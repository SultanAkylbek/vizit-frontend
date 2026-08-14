import { useEffect } from "react";
import type { Place } from "../../api/index";

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

function buildJsonLd(place: Place, canonical: string): Record<string, unknown> {
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

export default function PlaceSEO({ place }: { place: Place }) {
  const canonical = `https://vizit-ai.vercel.app/place/${place.slug}`;
  const title = `${place.name} — ${place.category} в ${place.city} | VIZIT AI`;
  const description = (place.about || place.ambient_description || `${place.category} в ${place.city}`).slice(0, 160);
  const jsonLd = buildJsonLd(place, canonical);

  useEffect(() => {
    document.title = title;

    let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = description;

    let linkCan = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!linkCan) {
      linkCan = document.createElement("link");
      linkCan.rel = "canonical";
      document.head.appendChild(linkCan);
    }
    linkCan.href = canonical;

    const og = [
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "business.business" },
      { property: "og:url", content: canonical },
      { property: "og:locale", content: "ru_KZ" },
      { property: "og:site_name", content: "VIZIT AI" },
    ];
    og.forEach(({ property, content }) => {
      let tag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("property", property);
        document.head.appendChild(tag);
      }
      tag.content = content;
    });

    let ld = document.querySelector('script[type="application/ld+json"]#place-jsonld') as HTMLScriptElement | null;
    if (!ld) {
      ld = document.createElement("script");
      ld.type = "application/ld+json";
      ld.id = "place-jsonld";
      document.head.appendChild(ld);
    }
    ld.textContent = JSON.stringify(jsonLd);

    return () => {
      ld?.remove();
    };
  }, [title, description, canonical, jsonLd]);

  return null;
}
