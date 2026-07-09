// api/place.ts
// Vercel Edge Function — SSR для страниц заведений.
// Запрашивает данные из бэкенда (Supabase через FastAPI),
// отдаёт ботам полный HTML с JSON-LD и мета-тегами.
//
// Никаких внешних API-вызовов (OpenAI, Anthropic и т.д.) здесь нет.
// Все поля (seo_keywords, rating_value, review_count, instagram_link,
// twogis_link) заполняются вручную в Supabase и просто читаются отсюда.

export const config = { runtime: "edge" };

const BACKEND  = "https://vizit-backend-vdt2.onrender.com";
const FRONTEND = "https://vizit-ai.vercel.app";

// ── Schema.org @type по категории ─────────────────────────────
const SCHEMA_TYPE: Record<string, string> = {
  cafe:       "CafeOrCoffeeShop",
  restaurant: "Restaurant",
  barbershop: "HairSalon",
  sto:        "AutoRepair",
  gym:        "ExerciseGym",
};

// ── Тип заведения — все поля которые приходят из бэкенда ──────
interface Place {
  id:                  string;
  name:                string;
  slug:                string;
  category:            string;
  district:            string;
  address:             string;
  ambient_description: string | null;
  tags:                string[];
  is_verified:         boolean;
  tier:                string;
  avg_check_kzt:       number | null;
  has_wifi:            boolean;
  has_outlets:         boolean;
  lat:                 number | null;
  lng:                 number | null;
  emoji:               string | null;
  two_gis_url:         string | null;
  offers:              { title: string; bonus_text: string }[];
  // ── Поля заполняются вручную в Supabase ───────────────────
  seo_keywords:   string | null;  // "laptop-friendly, кофейня Астана, wifi, ..."
  rating_value:   number | null;  // 1.0–5.0
  review_count:   number | null;  // кол-во отзывов
  instagram_link: string | null;  // https://instagram.com/...
  twogis_link:    string | null;  // https://2gis.kz/...
}

// ── Fetch с таймаутом ─────────────────────────────────────────
async function fetchPlace(slug: string): Promise<Place | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  const urls = [
    `${BACKEND}/api/v1/places/${encodeURIComponent(slug)}`,
    `${BACKEND}/api/v1/places/${encodeURIComponent(slug)}/`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        signal:  controller.signal,
        headers: { "Accept": "application/json" },
        cache:   "no-store",
      });

      if (res.ok) {
        clearTimeout(timeout);
        return res.json() as Promise<Place>;
      }
      if (res.status === 404) {
        clearTimeout(timeout);
        return null;
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        clearTimeout(timeout);
        return null;
      }
    }
  }

  clearTimeout(timeout);
  return null;
}

// ── JSON-LD (Schema.org) ──────────────────────────────────────
function buildJsonLd(place: Place): Record<string, unknown> {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type":    SCHEMA_TYPE[place.category] ?? "LocalBusiness",
    name:       place.name,
    description: place.ambient_description ??
      `${place.name} — ${place.category} в районе ${place.district}, Астана`,
    url: `${FRONTEND}/place/${place.slug}`,
    address: {
      "@type":         "PostalAddress",
      streetAddress:   place.address,
      addressLocality: "Астана",
      addressCountry:  "KZ",
    },
  };

  // aggregateRating — только если вбиты rating_value и review_count
  if (place.rating_value && place.review_count) {
    jsonLd.aggregateRating = {
      "@type":       "AggregateRating",
      ratingValue:   place.rating_value,
      bestRating:    5,
      worstRating:   1,
      ratingCount:   place.review_count,
    };
  }

  // sameAs — все известные внешние страницы заведения
  const sameAs: string[] = [];
  const gisUrl = place.twogis_link ?? place.two_gis_url;
  if (gisUrl)              sameAs.push(gisUrl);
  if (place.instagram_link) sameAs.push(place.instagram_link);
  if (sameAs.length)       jsonLd.sameAs = sameAs;

  if (place.lat && place.lng) {
    jsonLd.geo = {
      "@type":   "GeoCoordinates",
      latitude:  place.lat,
      longitude: place.lng,
    };
  }

  if (place.tags?.length) {
    jsonLd.keywords = place.tags.join(", ");
  }

  if (place.avg_check_kzt) {
    jsonLd.priceRange = `~${place.avg_check_kzt} ₸`;
  }

  if (gisUrl) jsonLd.hasMap = gisUrl;

  const amenities: unknown[] = [];
  if (place.has_wifi)    amenities.push({ "@type": "LocationFeatureSpecification", name: "WiFi",          value: true });
  if (place.has_outlets) amenities.push({ "@type": "LocationFeatureSpecification", name: "Power outlets", value: true });
  if (amenities.length)  jsonLd.amenityFeature = amenities;

  return jsonLd;
}

// ── HTML для успешного случая ─────────────────────────────────
function renderPlaceHtml(place: Place): string {
  const title = `${place.name} — ${place.category} в Астане | VIZIT AI`;
  const desc  = place.ambient_description ??
    `${place.name}: ${place.address}, ${place.district}. VIZIT AI — гид по заведениям Астаны.`;

  // search-context: ambient_description + seo_keywords + tags в одном теге.
  // Не отображается пользователю. AI-краулеры читают весь <head> и
  // используют content этого тега как сигнал релевантности запросу.
  const searchContext = [
    place.ambient_description,
    place.seo_keywords,
    place.tags?.join(", "),
  ].filter(Boolean).join(". ");

  const jsonLd   = JSON.stringify(buildJsonLd(place));
  const gisUrl   = place.twogis_link ?? place.two_gis_url;

  const tagsHtml = place.tags?.length
    ? place.tags.map(t =>
        `<span style="background:#f0f0ee;border-radius:20px;padding:4px 12px;font-size:12px;color:#555;margin:0 4px 4px 0;display:inline-block">${t}</span>`
      ).join("")
    : "";

  const offerHtml = place.offers?.[0]
    ? `<div style="background:#fff8e6;border:1px solid #f0c040;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:14px">
         🎁 ${place.offers[0].title} — ${place.offers[0].bonus_text}
       </div>`
    : "";

  const gisBtn = gisUrl
    ? `<a href="${gisUrl}" target="_blank" rel="noreferrer"
           style="display:inline-block;background:#378ADD;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">
         🗺️ Открыть в 2GIS
       </a>`
    : "";

  const ratingHtml = place.rating_value
    ? `<span style="color:#BA7517;font-weight:600">★ ${place.rating_value}</span>
       ${place.review_count ? `<span style="color:#999;font-size:12px">(${place.review_count} отзывов)</span>` : ""}
       &nbsp;`
    : "";

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
  <meta name="description" content="${desc.replace(/"/g, "&quot;")}"/>
  <meta property="og:type"        content="website"/>
  <meta property="og:title"       content="${title.replace(/"/g, "&quot;")}"/>
  <meta property="og:description" content="${desc.replace(/"/g, "&quot;")}"/>
  <meta property="og:url"         content="${FRONTEND}/place/${place.slug}"/>
  <meta name="robots" content="index,follow"/>
  ${searchContext
    ? `<meta name="search-context" content="${searchContext.replace(/"/g, "&quot;")}"/>`
    : ""}
  <link rel="canonical" href="${FRONTEND}/place/${place.slug}"/>
  <script type="application/ld+json">${jsonLd}</script>
  <style>
    body{font-family:system-ui,sans-serif;background:#f5f5f3;margin:0;padding:24px 16px 60px}
    .card{background:#fff;border:1px solid #e3e3e0;border-radius:16px;padding:24px;max-width:560px;margin:0 auto}
    a.back{color:#378ADD;text-decoration:none;font-size:13px;display:inline-block;margin-bottom:20px}
    h1{font-size:24px;font-weight:700;margin:0 0 4px;color:#1a1a1a}
    .meta{font-size:13px;color:#777;margin-bottom:16px}
    .desc{font-size:15px;line-height:1.6;color:#333;margin-bottom:16px}
  </style>
</head>
<body>
  <a href="/" class="back">← VIZIT AI</a>
  <div class="card">
    <div style="font-size:36px;margin-bottom:8px">${place.emoji ?? "📍"}</div>
    <h1>${place.name}</h1>
    <p class="meta">${ratingHtml}${place.category} · ${place.district} · ${place.address}</p>
    ${place.ambient_description ? `<p class="desc">${place.ambient_description}</p>` : ""}
    ${offerHtml}
    ${tagsHtml ? `<div style="margin-bottom:16px">${tagsHtml}</div>` : ""}
    ${place.avg_check_kzt ? `<p style="font-size:13px;color:#777;margin-bottom:16px">Средний чек: ~${place.avg_check_kzt.toLocaleString("ru-RU")} ₸</p>` : ""}
    ${gisBtn}
  </div>
</body>
</html>`;
}

// ── HTML-заглушка при ошибке / таймауте ──────────────────────
function renderFallbackHtml(reason: "timeout" | "not_found" | "error"): string {
  const messages = {
    timeout:   "Сервер просыпается (cold start). Страница появится через несколько секунд.",
    not_found: "Такое заведение не найдено в базе VIZIT AI.",
    error:     "Временная ошибка. Попробуйте обновить страницу.",
  };
  const isRetryable = reason !== "not_found";

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>VIZIT AI — ${reason === "not_found" ? "Не найдено" : "Загрузка"}</title>
  ${isRetryable ? '<meta http-equiv="refresh" content="6"/>' : ""}
  <style>
    body{font-family:system-ui,sans-serif;background:#f5f5f3;margin:0;padding:40px 16px;text-align:center}
    .card{background:#fff;border:1px solid #e3e3e0;border-radius:16px;padding:32px;max-width:480px;margin:0 auto}
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size:48px;margin-bottom:16px">${reason === "not_found" ? "🔍" : "⏳"}</div>
    <h2 style="color:#1a1a1a;margin-bottom:8px">VIZIT AI</h2>
    <p style="color:#666;line-height:1.6">${messages[reason]}</p>
    ${isRetryable ? "<p style='font-size:12px;color:#aaa'>Страница обновится автоматически…</p>" : ""}
    <a href="/" style="color:#378ADD;font-size:13px">← На главную</a>
  </div>
</body>
</html>`;
}

// ── Главный обработчик ────────────────────────────────────────
export default async function handler(req: Request): Promise<Response> {
  const url  = new URL(req.url);
  const slug = url.pathname.replace(/^\/place\//, "").replace(/\/$/, "").trim().toLowerCase();

  if (!slug) {
    return new Response(renderFallbackHtml("not_found"), {
      status:  404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  let place: Place | null = null;
  let timedOut = false;

  try {
    place = await fetchPlace(slug);
  } catch {
    timedOut = true;
  }

  if (!place && !timedOut) {
    return new Response(renderFallbackHtml("not_found"), {
      status:  404,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  if (!place) {
    return new Response(renderFallbackHtml("timeout"), {
      status:  200,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  return new Response(renderPlaceHtml(place), {
    status:  200,
    headers: {
      "Content-Type":  "text/html; charset=utf-8",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
