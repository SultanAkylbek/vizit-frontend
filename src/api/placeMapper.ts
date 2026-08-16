import type { Place } from "./index";

type RawPlace = Record<string, unknown>;

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return ["true", "1", "yes", "да"].includes(value.toLowerCase());
  return fallback;
}

function asTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return asTags(parsed);
    } catch {
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9а-яёәғқңөұүһі]+/gi, "-")
    .replace(/^-+|-+$/g, "") || "place";
}

function categoryEmoji(category: string): string {
  return {
    cafe: "☕",
    restaurant: "🍽️",
    barbershop: "💈",
    sto: "🔧",
    gym: "🏋️",
  }[category] || "📍";
}

/**
 * Converts every known backend place shape into the single UI Place contract.
 * Supports both the MVP search API shape and the GEO PlaceRecord shape.
 * FULLY unwraps generated_content (Grok AI) so SEO/LLM fields reach the UI.
 */
export function mapBackendPlace(raw: unknown): Place {
  const item = (raw && typeof raw === "object" ? raw : {}) as RawPlace;

  const name = asString(item.name, asString(item.business_name, "Заведение"));
  const slug = asString(item.slug, asString(item.business_id, slugify(name)));
  const category = asString(item.category, asString(item.niche, "other")).toLowerCase();
  const address = asString(item.address, "Адрес уточняется");
  const district = asString(item.district, asString(item.city, ""));

  // === generated_content from Grok AI (the SEO/LLM payload) ===
  const gc = item.generated_content && typeof item.generated_content === "object"
    ? (item.generated_content as Record<string, unknown>)
    : null;

  // Helper: pick string from generated_content first, then root item
  const pickStr = (gcKey: string, itemKey: string): string | undefined =>
    gc ? asString(gc[gcKey] as string, undefined) || asString(item[itemKey] as string, undefined) || undefined
    : asString(item[itemKey] as string, undefined) || undefined;

  // Helper: pick array of strings
  const pickArr = (gcKey: string, itemKey: string): string[] | undefined => {
    if (gc && Array.isArray(gc[gcKey])) return (gc[gcKey] as unknown[]).map(String);
    if (Array.isArray(item[itemKey])) return (item[itemKey] as unknown[]).map(String);
    return undefined;
  };

  // Helper: pick FAQ array
  const pickFaq = (): { question: string; answer: string }[] | undefined => {
    if (gc && Array.isArray(gc.faq)) return (gc.faq as any[]).map((f) => ({ question: String(f.question || f.q || ""), answer: String(f.answer || f.a || "") }));
    if (Array.isArray(item.faq)) return (item.faq as any[]).map((f) => ({ question: String(f.question || f.q || ""), answer: String(f.answer || f.a || "") }));
    return undefined;
  };

  // Helper: pick search_intents (strings or {query, intent_type} objects)
  const pickSearchIntents = (): (string | { query: string; intent_type: string })[] | undefined => {
    const source = gc && Array.isArray(gc.search_intents) ? gc.search_intents
      : Array.isArray(item.search_intents) ? item.search_intents
      : undefined;
    if (!source) return undefined;
    return source.map((si: any) => {
      if (typeof si === "string") return si;
      if (si && typeof si === "object") {
        return {
          query: String(si.query || si.q || ""),
          intent_type: String(si.intent_type || si.type || "informational"),
        };
      }
      return String(si);
    });
  };

  // === description priority: gc.about → ambient_description → description_for_maps → usp ===
  const gcAbout = pickStr("about", "about");
  const description = asString(
    gcAbout,
    asString(item.ambient_description,
      asString(item.description_for_maps,
        asString(item.usp, "Описание пока не добавлено.")))
  );

  const lat = asNumber(item.lat) ?? asNumber(item.latitude");
  const lng = asNumber(item.lng) ?? asNumber(item.longitude");
  const twoGisUrl = asString(item.two_gis_url, asString(item.source_url, ""));
  const id = asString(item.id, slug);
  const tags = asTags(item.tags);

  return {
    id,
    name,
    slug,
    category,
    niche: asString(item.niche, undefined) || undefined,
    city: asString(item.city, undefined) || undefined,
    district,
    address,
    emoji: asString(item.emoji, categoryEmoji(category)),
    ambient_description: description,
    tags,
    is_verified: asBoolean(item.is_verified),
    tier: asString(item.tier, "free"),
    avg_check_kzt: asNumber(item.avg_check_kzt),
    two_gis_url: twoGisUrl || undefined,
    lat,
    lng,
    phone: asString(item.phone, undefined) || undefined,
    website: asString(item.website, undefined) || undefined,
    instagram: asString(item.instagram, undefined) || undefined,
    working_hours: pickStr("working_hours", "working_hours"),
    rating: asNumber(item.rating),
    payment_methods: pickArr("payment_methods", "payment_methods"),

    // === AI-generated SEO/LLM fields (unwrapped from generated_content) ===
    about: gcAbout,
    usp: pickArr("usp", "usp")?.[0] || asString(item.usp, undefined) || undefined,
    offerings: pickArr("offerings", "offerings"),
    audience: pickArr("audience", "audience"),
    faq: pickFaq(),
    tips: pickArr("tips", "tips"),
    how_to_get_there: pickStr("how_to_get_there", "how_to_get_there"),
    nearby_landmarks: pickArr("nearby_landmarks", "nearby_landmarks"),

    // NEW: additional SEO fields from Grok AI
    entity_summary: pickStr("entity_summary", "entity_summary"),
    summary: pickStr("summary", "summary") || pickStr("entity_summary", "entity_summary"),
    atmosphere: pickStr("atmosphere", "atmosphere"),
    amenities: pickArr("amenities", "amenities"),
    practical_info: gc && typeof gc.practical_info === "object" ? gc.practical_info as Record<string, unknown> : undefined,
    semantic_terms: pickArr("semantic_terms", "semantic_terms"),
    search_intents: pickSearchIntents(),

    // Keep the full generated_content object for components that need raw access
    generated_content: gc ?? undefined,

    // Legacy / extra fields
    features: pickArr("features", "features"),
    target_audience: pickArr("audience", "target_audience")?.[0] || pickStr("target_audience", "target_audience"),
    local_guides: Array.isArray(item.local_guides) ? item.local_guides.map(String) : undefined,
    comparison_sections: Array.isArray(item.comparison_sections) ? item.comparison_sections.map((c: any) => ({ title: String(c.title || ""), content: String(c.content || "") })) : undefined,
    page_sections: Array.isArray(item.page_sections) ? item.page_sections.map((p: any) => ({ title: String(p.title || ""), content: String(p.content || "") })) : undefined,
    ai_context: asString(item.ai_context, undefined) || undefined,
    business_knowledge: asString(item.business_knowledge, undefined) || undefined,
    entity_json: item.entity_json && typeof item.entity_json === "object" ? item.entity_json as Record<string, unknown> : undefined,
    semantic_relations: Array.isArray(item.semantic_relations) ? item.semantic_relations.map(String) : undefined,
    source_snippets: Array.isArray(item.source_snippets) ? item.source_snippets.map(String) : undefined,
    recommendation_snippets: Array.isArray(item.recommendation_snippets) ? item.recommendation_snippets.map(String) : undefined,
    conversational_answers: Array.isArray(item.conversational_answers) ? item.conversational_answers.map((c: any) => ({ question: String(c.question || ""), answer: String(c.answer || "") })) : undefined,
    breadcrumb: Array.isArray(item.breadcrumb) ? item.breadcrumb.map((b: any) => ({ name: String(b.name || ""), url: b.url ? String(b.url) : undefined })) : undefined,
    canonical_url: asString(item.canonical_url, undefined) || undefined,
  } as Place;
}

export function mapBackendPlaces(raw: unknown): Place[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(mapBackendPlace);
}
