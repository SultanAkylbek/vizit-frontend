import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getPlaceBySlug } from "../src/api/index";

const BOT_UA_RE =
  /bot|crawler|spider|chatgpt|gptbot|claude|perplexity|anthropic|googlebot|bingbot|yandex|slurp|duckduckbot|facebookexternalhit|twitterbot|linkedinbot|whatsapp|slackbot|discordbot/i;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toSchemaType(category: string): string {
  const c = (category || "").toLowerCase();
  if (c.includes("coffee") || c.includes("cafe") || c.includes("кафе") || c.includes("кофе"))
    return "CafeOrCoffeeShop";
  if (c.includes("restaurant") || c.includes("ресторан")) return "Restaurant";
  if (c.includes("hair") || c.includes("barber") || c.includes("салон") || c.includes("барбер"))
    return "HairSalon";
  if (c.includes("auto") || c.includes("car") || c.includes("сервис") || c.includes("сто"))
    return "AutoRepair";
  if (c.includes("gym") || c.includes("fitness") || c.includes("спортзал") || c.includes("фитнес"))
    return "ExerciseGym";
  return "LocalBusiness";
}

function parseHours(workingHours: string | null): string[] {
  if (!workingHours) return [];
  const hours: string[] = [];
  const lines = workingHours.split(/[;,]/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const m = trimmed.match(
      /(Пн|Вт|Ср|Чт|Пт|Сб|Вс|Ежедневно|Круглосуточно)[^\d]*(\d{1,2}[.:]\d{2})[^\d]*(\d{1,2}[.:]\d{2})/i
    );
    if (m) {
      const dayMap: Record<string, string> = {
        Пн: "Mo", Вт: "Tu", Ср: "We", Чт: "Th", Пт: "Fr", Сб: "Sa", Вс: "Su",
        Ежедневно: "Mo-Su", Круглосуточно: "Mo-Su",
      };
      const enDay = dayMap[m[1]] || "Mo-Su";
      const open = m[2].replace(".", ":");
      const close = m[3].replace(".", ":");
      hours.push(`${enDay} ${open}-${close}`);
    } else if (/круглосуточно|24\s*ч/i.test(trimmed)) {
      hours.push("Mo-Su 00:00-23:59");
    }
  }
  return hours;
}

function slugify(text: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh",
    з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
    п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts",
    ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu",
    я: "ya", ә: "a", ғ: "g", қ: "q", ң: "n", ө: "o", ұ: "u", ү: "u",
    һ: "h", і: "i",
  };
  return text
    .toLowerCase()
    .split("")
    .map((c) => map[c] || c)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildJsonLd(place: any, canonical: string): Record<string, unknown> {
  const schemaType = toSchemaType(place.category);
  const addressLocality = place.district
    ? `${place.district}, ${place.city}`
    : place.city;

  const sameAs: string[] = [];
  if (place.two_gis_url) sameAs.push(place.two_gis_url);
  if (place.instagram_link) sameAs.push(place.instagram_link);
  if (place.website) sameAs.push(place.website);

  const graph: Record<string, unknown>[] = [
    {
      "@type": schemaType,
      "@id": `${canonical}#business`,
      name: place.name,
      description: place.about || place.ambient_description || `${place.category} в ${place.city}`,
      url: canonical,
      mainEntityOfPage: { "@id": `${canonical}#webpage` },
      image: place.photos?.[0] || undefined,
      address: {
        "@type": "PostalAddress",
        streetAddress: place.address,
        addressLocality: addressLocality,
        addressCountry: "KZ",
      },
      geo:
        place.lat && place.lng
          ? {
              "@type": "GeoCoordinates",
              latitude: place.lat,
              longitude: place.lng,
            }
          : undefined,
      telephone: place.phone || undefined,
      priceRange: place.avg_check_kzt ? `~${place.avg_check_kzt} ₸` : "$$",
      paymentAccepted: place.payment_methods?.length
        ? place.payment_methods
        : ["Kaspi QR", "Kaspi Red", "Наличные", "Карта"],
      areaServed: {
        "@type": "City",
        name: place.city,
        containedInPlace: { "@type": "Country", name: "Казахстан" },
      },
      knowsAbout: place.tags?.length ? place.tags : [place.category],
      sameAs: sameAs.length ? sameAs : undefined,
      aggregateRating:
        place.rating && place.rating > 0
          ? {
              "@type": "AggregateRating",
              ratingValue: place.rating,
              bestRating: 5,
              worstRating: 1,
              ratingCount: place.review_count || 1,
            }
          : undefined,
      openingHoursSpecification: parseHours(place.working_hours).length
        ? parseHours(place.working_hours).map((h) => {
            const [days, hours] = h.split(" ");
            const [opens, closes] = hours.split("-");
            return {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: days.split("-").map((d) => {
                const map: Record<string, string> = {
                  Mo: "Monday", Tu: "Tuesday", We: "Wednesday",
                  Th: "Thursday", Fr: "Friday", Sa: "Saturday", Su: "Sunday",
                };
                return map[d] || d;
              }),
              opens,
              closes,
            };
          })
        : undefined,
      makesOffer: place.offerings?.length
        ? place.offerings.map((o: string) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: o },
          }))
        : undefined,
      hasMap: place.two_gis_url || undefined,
      amenityFeature: [
        ...(place.has_wifi ? [{ "@type": "LocationFeatureSpecification", name: "WiFi", value: true }] : []),
        ...(place.has_outlets ? [{ "@type": "LocationFeatureSpecification", name: "Power outlets", value: true }] : []),
      ].length || undefined,
    },
    {
      "@type": "FAQPage",
      "@id": `${canonical}#faq`,
      mainEntity:
        place.faq?.length && place.faq[0]?.q
          ? place.faq.map((f: any) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            }))
          : undefined,
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${canonical}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "VIZIT AI", item: "https://vizit-ai.vercel.app/" },
        { "@type": "ListItem", position: 2, name: place.city, item: `https://vizit-ai.vercel.app/city/${slugify(place.city)}` },
        { "@type": "ListItem", position: 3, name: place.category, item: `https://vizit-ai.vercel.app/category/${slugify(place.category)}` },
        { "@type": "ListItem", position: 4, name: place.name, item: canonical },
      ],
    },
    {
      "@type": "WebPage",
      "@id": `${canonical}#webpage`,
      url: canonical,
      name: `${place.name} — ${place.category} в ${place.city}`,
      description: place.about || place.ambient_description || `${place.category} в ${place.city}`,
      inLanguage: "ru-KZ",
      isPartOf: { "@id": "https://vizit-ai.vercel.app/#website" },
      about: { "@id": `${canonical}#business` },
      primaryImageOfPage: place.photos?.[0] || undefined,
    },
  ];

  const clean = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(clean).filter((v) => v !== undefined);
    if (obj && typeof obj === "object") {
      const res: any = {};
      for (const [k, v] of Object.entries(obj)) {
        const c = clean(v);
        if (c !== undefined) res[k] = c;
      }
      return Object.keys(res).length ? res : undefined;
    }
    return obj;
  };

  return {
    "@context": "https://schema.org",
    "@graph": clean(graph),
  };
}

function buildFactSheet(place: any, canonical: string): string {
  const parts: string[] = [];
  parts.push(`${place.name} — ${place.category} в ${place.city}${place.district ? `, район ${place.district}` : ""}.`);
  parts.push(`Адрес: ${place.address}.`);
  if (place.phone) parts.push(`Телефон: ${place.phone}.`);
  if (place.working_hours) parts.push(`Часы работы: ${place.working_hours}.`);
  if (place.avg_check_kzt) parts.push(`Средний чек: ~${place.avg_check_kzt} ₸.`);
  if (place.rating) parts.push(`Рейтинг: ${place.rating} из 5.`);
  if (place.about) parts.push(place.about);
  if (place.usp) parts.push(`Уникальное предложение: ${place.usp}.`);
  if (place.offerings?.length) parts.push(`Услуги: ${place.offerings.join(", ")}.`);
  if (place.tags?.length) parts.push(`Ключевые слова: ${place.tags.join(", ")}.`);
  parts.push(`Официальная страница: ${canonical}`);
  if (place.two_gis_url) parts.push(`Карта: ${place.two_gis_url}`);
  return parts.join(" ");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slug = (req.query.slug as string) || "";
  const ua = (req.headers["user-agent"] || "").toLowerCase();

  if (!BOT_UA_RE.test(ua)) {
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
    return res.status(200).send(`<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VIZIT AI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`);
  }

  try {
    const place = await getPlaceBySlug(slug);
    if (!place) {
      res.setHeader("X-Robots-Tag", "noindex");
      return res.status(404).send(`<!DOCTYPE html><html><body><h1>404</h1></body></html>`);
    }

    const canonical = `https://vizit-ai.vercel.app/place/${slug}`;
    const title = `${place.name} — ${place.category} в ${place.city} | VIZIT AI`;
    const description = (place.about || place.ambient_description || `${place.category} в ${place.city}`).slice(0, 160);
    const factSheet = buildFactSheet(place, canonical);
    const jsonLd = buildJsonLd(place, canonical);

    const html = `<!DOCTYPE html>
<html lang="ru-KZ">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="business.business">
  <meta property="og:url" content="${canonical}">
  <meta property="og:locale" content="ru_KZ">
  <meta property="og:site_name" content="VIZIT AI">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <link rel="preconnect" href="https://vizit-backend-vdt2.onrender.com">
  <style>body{font-family:system-ui,sans-serif;line-height:1.6;color:#111;max-width:800px;margin:0 auto;padding:24px}</style>
</head>
<body>
  <article>
    <h1>${escapeHtml(place.name)}</h1>
    <p><strong>${escapeHtml(place.category)}</strong> в ${escapeHtml(place.city)}${place.district ? `, район ${escapeHtml(place.district)}` : ""}</p>
    <p>${escapeHtml(factSheet)}</p>
    ${place.about ? `<h2>О заведении</h2><p>${escapeHtml(place.about)}</p>` : ""}
    ${place.offerings?.length ? `<h2>Услуги</h2><ul>${place.offerings.map((o: string) => `<li>${escapeHtml(o)}</li>`).join("")}</ul>` : ""}
    ${place.faq?.length && place.faq[0]?.q ? `<h2>Частые вопросы</h2>${place.faq.map((f: any) => `<details><summary>${escapeHtml(f.q)}</summary><p>${escapeHtml(f.a)}</p></details>`).join("")}` : ""}
    ${place.two_gis_url ? `<p><a href="${place.two_gis_url}">Посмотреть на карте (2GIS)</a></p>` : ""}
    <p><a href="${canonical}">Официальная страница на VIZIT AI</a></p>
  </article>
  <script>window.__PLACE_DATA__=${JSON.stringify(place)}</script>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
    res.setHeader("Link", `<${canonical}>; rel="canonical"`);
    res.status(200).send(html);
  } catch (err) {
    console.error("SSR error", err);
    res.setHeader("X-Robots-Tag", "noindex");
    res.status(503).send(`<!DOCTYPE html><html><body><h1>503</h1></body></html>`);
  }
}
