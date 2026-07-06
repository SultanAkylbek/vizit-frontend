// api/enrich.ts
// Vercel Edge Function — принимает сырой текст о заведении
// (скопированный из 2GIS, соцсетей, или заполненный вендором),
// отправляет в LLM и возвращает готовый JSON для записи в Supabase.
//
// POST /api/enrich
// Body: { "raw_text": "...", "place_id": "uuid" (опционально) }
// Response: { enriched: { ambient_description, seo_keywords, ... } }

export const config = { runtime: "edge" };

// ── Тип ответа LLM ────────────────────────────────────────────
interface EnrichedPlace {
  ambient_description: string;   // до 250 символов, атмосферный текст
  seo_keywords:        string;   // "laptop-friendly, кофейня Астана, wifi, ..."
  emoji:               string;   // один эмодзи
  has_wifi:            boolean;
  has_outlets:         boolean;
  laptop_friendly:     boolean;  // тихо + розетки + wifi
  tags:                string[]; // 4–8 практичных тегов на русском
}

// ── Системный промт ───────────────────────────────────────────
// Написан так чтобы модель:
//   а) не выходила за 250 символов в ambient_description
//   б) давала плотные keywords на двух языках (ru+en)
//   в) строго возвращала JSON без markdown-обёрток
const SYSTEM_PROMPT = `
You are an SEO and local business expert for Astana, Kazakhstan.
Given raw text about a local business (cafe, barbershop, auto service, gym, etc.),
extract and generate structured data optimized for:
  - AI search engines (ChatGPT Search, Perplexity, Google AI Overviews)
  - Schema.org LocalBusiness markup
  - Russian-language local search

Return ONLY valid JSON. No markdown, no explanation, no code blocks.
Use this exact structure:

{
  "ambient_description": "<2-3 sentences in Russian describing atmosphere and key benefits, MAX 250 characters>",
  "seo_keywords": "<dense comma-separated keywords in BOTH Russian and English. Include: type of place, location context (Астана, Esil, etc.), unique features, use cases. Example: laptop-friendly, кофейня для работы Астана, розетки, wifi, quiet atmosphere, specialty coffee, без очередей, coworking Astana>",
  "emoji": "<single most fitting emoji>",
  "has_wifi": <true/false>,
  "has_outlets": <true/false>,
  "laptop_friendly": <true if has wifi + outlets + quiet atmosphere>,
  "tags": ["<4-8 short practical tags in Russian lowercase, e.g.: wifi, розетки, тихо, специалти, бизнес-ланч>"]
}

Rules:
- ambient_description MUST be under 250 characters
- seo_keywords should have 10-20 terms mixing Russian and English
- tags should be what locals actually search for
- If information is missing, infer from context or omit the field
`.trim();

// ── Вызов Anthropic (claude-haiku — дёшево и быстро) ─────────
async function callAnthropic(rawText: string, apiKey: string): Promise<EnrichedPlace> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key":         apiKey,
      "anthropic-version": "2023-06-01",
      "content-type":      "application/json",
    },
    body: JSON.stringify({
      model:      "claude-haiku-4-5",
      max_tokens: 600,
      system:     SYSTEM_PROMPT,
      messages: [{
        role:    "user",
        content: `Analyze this business information and return enriched JSON:\n\n${rawText}`,
      }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const data = await res.json() as { content: { type: string; text: string }[] };
  const text = data.content.find(b => b.type === "text")?.text ?? "";
  return parseJsonSafe(text);
}

// ── Вызов OpenAI (gpt-4o-mini — fallback) ─────────────────────
async function callOpenAI(rawText: string, apiKey: string): Promise<EnrichedPlace> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "content-type":  "application/json",
    },
    body: JSON.stringify({
      model:           "gpt-4o-mini",
      max_tokens:      600,
      response_format: { type: "json_object" },  // OpenAI JSON mode
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: `Analyze this business information and return enriched JSON:\n\n${rawText}` },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${err}`);
  }

  const data = await res.json() as { choices: { message: { content: string } }[] };
  const text = data.choices[0]?.message?.content ?? "";
  return parseJsonSafe(text);
}

// ── Парсинг JSON из ответа LLM ────────────────────────────────
// LLM иногда оборачивает в ```json ... ``` даже при явном запрете
function parseJsonSafe(text: string): EnrichedPlace {
  let clean = text.trim();

  // Убираем возможные markdown-блоки
  if (clean.startsWith("```")) {
    clean = clean.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const parsed = JSON.parse(clean) as EnrichedPlace;

  // Обрезаем ambient_description если модель всё же вышла за 250 символов
  if (parsed.ambient_description && parsed.ambient_description.length > 250) {
    parsed.ambient_description = parsed.ambient_description.slice(0, 247) + "…";
  }

  return parsed;
}

// ── Главный обработчик ────────────────────────────────────────
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status:  405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? "";
  const OPENAI_KEY    = process.env.OPENAI_API_KEY    ?? "";

  if (!ANTHROPIC_KEY && !OPENAI_KEY) {
    return new Response(JSON.stringify({ error: "No LLM API key configured" }), {
      status:  503,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { raw_text?: string; place_id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status:  400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rawText = (body.raw_text ?? "").trim();
  if (!rawText || rawText.length < 20) {
    return new Response(JSON.stringify({ error: "raw_text too short (min 20 chars)" }), {
      status:  400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Ограничиваем входной текст — защита от prompt injection и высокой цены
  const safeText = rawText.slice(0, 3000);

  try {
    // Пробуем Anthropic первым (дешевле), при ошибке — OpenAI
    let enriched: EnrichedPlace;
    if (ANTHROPIC_KEY) {
      try {
        enriched = await callAnthropic(safeText, ANTHROPIC_KEY);
      } catch (e) {
        if (!OPENAI_KEY) throw e;
        console.warn("Anthropic failed, falling back to OpenAI:", e);
        enriched = await callOpenAI(safeText, OPENAI_KEY);
      }
    } else {
      enriched = await callOpenAI(safeText, OPENAI_KEY);
    }

    return new Response(JSON.stringify({ enriched, place_id: body.place_id }), {
      status:  200,
      headers: {
        "Content-Type":  "application/json",
        "Cache-Control": "no-store",
      },
    });

  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: "LLM enrichment failed", detail: msg }), {
      status:  500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
