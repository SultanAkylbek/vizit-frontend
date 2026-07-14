export const config = { runtime: "edge" };

const BACKEND = "https://vizit-backend-vdt2.onrender.com";
const FRONTEND = "https://vizit-ai.vercel.app";

const SCHEMA_TYPE: Record<string, string> = {
  cafe: "CafeOrCoffeeShop",
  restaurant: "Restaurant",
  barbershop: "HairSalon",
  sto: "AutoRepair",
  gym: "ExerciseGym",
};

interface Offer {
  title?: string | null;
  bonus_text?: string | null;
}

interface Place {
  id: string;
  name: string;
  slug: string;
  category?: string | null;
  district?: string | null;
  address?: string | null;
  ambient_description?: string | null;
  tags?: string[] | null;
  is_verified?: boolean;
  tier?: string | null;
  avg_check_kzt?: number | null;
  has_wifi?: boolean;
  has_outlets?: boolean;
  lat?: number | null;
  lng?: number | null;
  emoji?: string | null;
  two_gis_url?: string | null;
  twogis_link?: string | null;
  offers?: Offer[] | null;
  seo_keywords?: string | null;
  rating?: number | null;
  rating_value?: number | null;
  review_count?: number | null;
  instagram_link?: string | null;
}

type FetchResult =
  | { status: "found"; place: Place }
  | { status: "not_found" }
  | { status: "timeout" }
  | { status: "error" };

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function safeExternalUrl(value?: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function canonicalUrl(slug: string): string {
  return `${FRONTEND}/place/${encodeURIComponent(slug)}`;
}

async function fetchPlace(slug: string): Promise<FetchResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${BACKEND}/api/v1/places/${encodeURIComponent(slug)}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (response.status === 404) return { status: "not_found" };
    if (!response.ok) return { status: "error" };

    const place: unknown = await response.json();
    if (!place || typeof place !== "object" || !("name" in place) || !("slug" in place)) {
      return { status: "error" };
    }
    return { status: "found", place: place as Place };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") return { status: "timeout" };
    return { status: "error" };
  } finally {
    clearTimeout(timeout);
  }
}

function buildJsonLd(place: Place): Record<string, unknown> {
  const category = place.category || "заведение";
  const district = place.district || "Астана";
  const gisUrl = safeExternalUrl(place.twogis_link ?? place.two_gis_url);
  const instagramUrl = safeExternalUrl(place.instagram_link);
  const rating = place.rating_value ?? place.rating;
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": SCHEMA_TYPE[category] ?? "LocalBusiness",
    name: place.name,
    description: place.ambient_description || `${place.name} — ${category} в районе ${district}, Астана`,
    url: canonicalUrl(place.slug),
    address: {
      "@type": "PostalAddress",
      streetAddress: place.address || undefined,
      addressLocality: "Астана",
      addressCountry: "KZ",
    },
  };

  if (rating != null && place.review_count != null && place.review_count > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: rating,
      bestRating: 5,
      worstRating: 1,
      ratingCount: place.review_count,
    };
  }

  const sameAs = [gisUrl, instagramUrl].filter((value): value is string => Boolean(value));
  if (sameAs.length) jsonLd.sameAs = sameAs;

  if (place.lat != null && place.lng != null) {
    jsonLd.geo = { "@type": "GeoCoordinates", latitude: place.lat, longitude: place.lng };
  }
  if (place.tags?.length) jsonLd.keywords = place.tags.join(", ");
  if (place.avg_check_kzt != null) jsonLd.priceRange = `~${place.avg_check_kzt} ₸`;
  if (gisUrl) jsonLd.hasMap = gisUrl;

  const amenities: Record<string, unknown>[] = [];
  if (place.has_wifi) amenities.push({ "@type": "LocationFeatureSpecification", name: "WiFi", value: true });
  if (place.has_outlets) amenities.push({ "@type": "LocationFeatureSpecification", name: "Power outlets", value: true });
  if (amenities.length) jsonLd.amenityFeature = amenities;

  return jsonLd;
}

function renderPlaceHtml(place: Place): string {
  const category = place.category || "заведение";
  const district = place.district || "Астана";
  const title = `${place.name} — ${category} в Астане | VIZIT AI`;
  const description = place.ambient_description || `${place.name}: ${place.address || district}. VIZIT AI — гид по заведениям Астаны.`;
  const pageUrl = canonicalUrl(place.slug);
  const gisUrl = safeExternalUrl(place.twogis_link ?? place.two_gis_url);
  const rating = place.rating_value ?? place.rating;

  const tagsHtml = place.tags?.length
    ? place.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")
    : "";
  const offer = place.offers?.[0];
  const offerHtml = offer && (offer.title || offer.bonus_text)
    ? `<aside class="offer"><strong>${escapeHtml(offer.title || "Предложение")}</strong>${offer.bonus_text ? ` — ${escapeHtml(offer.bonus_text)}` : ""}</aside>`
    : "";
  const mapLink = gisUrl
    ? `<a class="map" href="${escapeHtml(gisUrl)}" target="_blank" rel="noopener noreferrer">Открыть в 2GIS</a>`
    : "";
  const ratingHtml = rating != null
    ? `<span class="rating">${escapeHtml(rating)}</span>${place.review_count ? ` <span>(${escapeHtml(place.review_count)} отзывов)</span>` : ""}`
    : "";
  const priceHtml = place.avg_check_kzt != null
    ? `<p class="price">Средний чек: ~${escapeHtml(place.avg_check_kzt.toLocaleString("ru-RU"))} ₸</p>`
    : "";

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(pageUrl)}">
  <link rel="canonical" href="${escapeHtml(pageUrl)}">
  <script type="application/ld+json">${serializeJsonLd(buildJsonLd(place))}</script>
  <style>
    :root{color-scheme:light}*{box-sizing:border-box}body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f5f5f3;color:#1a1a1a;margin:0;padding:24px 16px 60px}.shell{max-width:608px;margin:0 auto}.card{background:#fff;border:1px solid #e3e3e0;border-radius:16px;padding:24px}.back{color:#1769aa;text-decoration:none;font-size:14px;display:inline-block;margin-bottom:20px}h1{font-size:28px;line-height:1.2;margin:0 0 8px}.emoji{font-size:36px;margin-bottom:8px}.meta,.price{font-size:14px;color:#6b6b68}.description{font-size:16px;line-height:1.6;color:#333}.rating{color:#8a5800;font-weight:700}.offer{background:#fff8e6;border:1px solid #d8a82d;border-radius:8px;padding:12px 16px;margin:16px 0;font-size:14px}.tags{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}.tag{background:#f0f0ee;border-radius:20px;padding:4px 12px;font-size:12px;color:#555}.map{display:inline-block;background:#1769aa;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:700}
  </style>
</head>
<body>
  <main class="shell">
    <a href="/" class="back">← VIZIT AI</a>
    <article class="card">
      ${place.emoji ? `<div class="emoji" aria-hidden="true">${escapeHtml(place.emoji)}</div>` : ""}
      <h1>${escapeHtml(place.name)}</h1>
      <p class="meta">${ratingHtml}${ratingHtml ? " · " : ""}${escapeHtml(category)} · ${escapeHtml(district)}${place.address ? ` · ${escapeHtml(place.address)}` : ""}</p>
      ${place.ambient_description ? `<p class="description">${escapeHtml(place.ambient_description)}</p>` : ""}
      ${offerHtml}
      ${tagsHtml ? `<div class="tags">${tagsHtml}</div>` : ""}
      ${priceHtml}
      ${mapLink}
    </article>
  </main>
</body>
</html>`;
}

function renderFallbackHtml(reason: "timeout" | "not_found" | "error"): string {
  const messages = {
    timeout: "Сервер отвечает дольше обычного. Попробуйте обновить страницу через несколько секунд.",
    not_found: "Такое заведение не найдено в базе VIZIT AI.",
    error: "Сервис временно недоступен. Попробуйте обновить страницу позже.",
  };
  const retryable = reason !== "not_found";
  const title = reason === "not_found" ? "Страница не найдена" : "Временно недоступно";

  return `<!doctype html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>VIZIT AI — ${title}</title></head><body><main style="max-width:480px;margin:48px auto;padding:24px;font:16px/1.6 system-ui,sans-serif"><h1>VIZIT AI</h1><p>${messages[reason]}</p>${retryable ? "<p>Повторите попытку немного позже.</p>" : ""}<a href="/">На главную</a></main></body></html>`;
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const rawSlug = url.pathname.replace(/^\/place\//, "").replace(/\/$/, "").trim();

  let slug: string;
  try {
    slug = decodeURIComponent(rawSlug).toLowerCase();
  } catch {
    return new Response(renderFallbackHtml("not_found"), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
    });
  }

  if (!slug) {
    return new Response(renderFallbackHtml("not_found"), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
    });
  }

  const result = await fetchPlace(slug);

  if (result.status === "not_found") {
    return new Response(renderFallbackHtml("not_found"), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
    });
  }

  if (result.status === "timeout" || result.status === "error") {
    return new Response(renderFallbackHtml(result.status), {
      status: 503,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Retry-After": "10",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  return new Response(renderPlaceHtml(result.place), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
