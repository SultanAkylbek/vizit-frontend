export const config = { runtime: "edge" };

const BACKEND = "https://vizit-backend-vdt2.onrender.com";
const FRONTEND = "https://vizit-ai.vercel.app";
const CRAWLER_USER_AGENT = /bot|crawler|spider|slurp|bingpreview|google-inspectiontool|oai-searchbot|chatgpt-user|perplexitybot|claudebot|anthropic-ai|facebookexternalhit|twitterbot|linkedinbot/i;

interface Place {
  id: string;
  name: string;
  slug: string;
  category?: string | null;
  district?: string | null;
  address?: string | null;
  ambient_description?: string | null;
  tags?: string[] | null;
}

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

function placeUrl(slug: string): string {
  return `${FRONTEND}/place/${encodeURIComponent(slug)}`;
}

async function fetchPlaces(): Promise<Place[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${BACKEND}/api/v1/places`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`Upstream returned ${response.status}`);
    const data: unknown = await response.json();
    if (!Array.isArray(data)) throw new Error("Upstream returned an invalid catalog");
    return data.filter((place): place is Place => Boolean(place && typeof place === "object" && "slug" in place && "name" in place));
  } finally {
    clearTimeout(timeout);
  }
}

function renderCatalog(places: Place[]): string {
  const description = "VIZIT AI — независимый гид по заведениям Астаны: кафе, рестораны, барбершопы, автосервисы и другие места.";
  const itemList = places.map((place, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: placeUrl(place.slug),
    name: place.name,
  }));
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "VIZIT AI",
      url: FRONTEND,
      description,
      inLanguage: "ru",
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "VIZIT AI",
      url: FRONTEND,
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Заведения Астаны в VIZIT AI",
      numberOfItems: itemList.length,
      itemListElement: itemList,
    },
  ];

  const cards = places.map((place) => {
    const summary = place.ambient_description || [place.category, place.district, place.address].filter(Boolean).join(" · ");
    const tags = place.tags?.length ? `<p class="tags">${escapeHtml(place.tags.join(" · "))}</p>` : "";
    return `<article>
      <h2><a href="/place/${encodeURIComponent(place.slug)}">${escapeHtml(place.name)}</a></h2>
      ${summary ? `<p>${escapeHtml(summary)}</p>` : ""}
      ${tags}
    </article>`;
  }).join("\n");

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>VIZIT AI — гид по заведениям Астаны</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
  <link rel="canonical" href="${FRONTEND}/">
  <meta property="og:type" content="website">
  <meta property="og:title" content="VIZIT AI — гид по заведениям Астаны">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${FRONTEND}/">
  <script type="application/ld+json">${serializeJsonLd(jsonLd)}</script>
  <style>
    :root{color-scheme:light}*{box-sizing:border-box}body{margin:0;background:#f5f5f3;color:#1a1a1a;font:16px/1.55 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}main{width:min(960px,calc(100% - 32px));margin:0 auto;padding:56px 0 72px}header{max-width:680px;margin-bottom:32px}h1{font-size:clamp(32px,6vw,56px);line-height:1.05;margin:0 0 16px}header p{font-size:18px;color:#555}section{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}article{background:#fff;border:1px solid #dfdfdc;border-radius:16px;padding:20px}h2{font-size:20px;margin:0 0 10px}a{color:#1769aa;text-decoration-thickness:1px;text-underline-offset:3px}article p{margin:0;color:#4a4a4a}.tags{font-size:14px;margin-top:12px;color:#70706c}footer{margin-top:36px;color:#70706c;font-size:14px}
  </style>
</head>
<body>
  <main>
    <header>
      <p>VIZIT AI · Астана</p>
      <h1>Места, которые подходят именно вам</h1>
      <p>${escapeHtml(description)}</p>
    </header>
    <section aria-label="Каталог заведений">
      ${cards || "<p>Каталог заведений скоро появится.</p>"}
    </section>
    <footer>Данные о заведениях собраны в каталоге VIZIT AI.</footer>
  </main>
</body>
</html>`;
}

function renderUnavailable(): string {
  return `<!doctype html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>VIZIT AI — временно недоступно</title></head><body><main><h1>VIZIT AI</h1><p>Каталог временно недоступен. Попробуйте снова через несколько секунд.</p></main></body></html>`;
}

export default async function handler(req: Request): Promise<Response> {
  const userAgent = req.headers.get("user-agent") || "";

  if (!CRAWLER_USER_AGENT.test(userAgent)) {
    return fetch(new URL("/index.html", req.url), {
      headers: { "user-agent": userAgent },
    });
  }

  try {
    const places = await fetchPlaces();
    return new Response(renderCatalog(places), {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
        Vary: "User-Agent",
      },
    });
  } catch {
    return new Response(renderUnavailable(), {
      status: 503,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Retry-After": "10",
        "X-Robots-Tag": "noindex, nofollow",
        Vary: "User-Agent",
      },
    });
  }
}
