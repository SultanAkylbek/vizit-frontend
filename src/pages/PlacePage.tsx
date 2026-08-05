import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { ExternalLink, MapPin, Phone, Globe, Instagram, Clock, CreditCard, Star, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { Layout } from "../Layout";
import type { Place, PlaceGeoData } from "../api/index";
import { mapBackendPlace } from "../api/placeMapper";
import { useRecentPlaces } from "../hooks/useRecentPlaces";
import { normalizeTag } from "../geo/tags";

// Same backend as api/index.ts. Kept as a local constant (not import.meta.env)
// because that's how the original slug-lookup fix was wired.
const API_BASE = "https://vizit-backend-vdt2.onrender.com";

type Status = "loading" | "ok" | "error";

type DebugInfo = {
  urlTried: string;
  status: number | string;
  usedFallback: boolean;
};

type PlacePageProps = {
  slug: string;
};

export default function PlacePage({ slug }: PlacePageProps) {
  const [place, setPlace] = useState<Place | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [debug, setDebug] = useState<DebugInfo | null>(null);
  const { pushRecentPlace } = useRecentPlaces();

  // Record a real view once the place has actually loaded — no fake/seed data.
  useEffect(() => {
    if (status === "ok" && place?.slug) {
      pushRecentPlace({ slug: place.slug, name: place.name, district: place.district });
    }
  }, [status, place, pushRecentPlace]);

  useEffect(() => {
    const cleanSlug = slug.trim().toLowerCase();
    const primaryUrl = `${API_BASE}/api/v1/places/${encodeURIComponent(cleanSlug)}`;

    setStatus("loading");
    setDebug(null);

    fetch(primaryUrl)
      .then((res) => {
        if (res.ok) return res.json();
        return Promise.reject({ url: primaryUrl, status: res.status });
      })
      .then((data: unknown) => {
        setPlace(mapBackendPlace(data));
        setStatus("ok");
      })
      .catch((firstErr) => {
        // Fallback: retry with a trailing slash in case of a routing edge case.
        const fallbackUrl = `${primaryUrl}/`;
        fetch(fallbackUrl)
          .then((res) => {
            if (res.ok) return res.json();
            return Promise.reject({ url: fallbackUrl, status: res.status });
          })
          .then((data: unknown) => {
            setPlace(mapBackendPlace(data));
            setStatus("ok");
          })
          .catch((secondErr) => {
            // Try to find a locally added place (persisted in localStorage) before giving up
            try {
              const raw = localStorage.getItem("vizit_local_places");
              if (raw) {
                const arr = JSON.parse(raw) as any[];
                const found = arr.find((p) => p.slug === cleanSlug || p.id === cleanSlug || p.slug === slug);
                if (found) {
                  setPlace(mapBackendPlace(found));
                  setStatus("ok");
                  return;
                }
              }
            } catch (_) {}

            setDebug({
              urlTried: `${primaryUrl} → ${firstErr.status ?? "network error"}, ${fallbackUrl} → ${secondErr.status ?? "network error"}`,
              status: secondErr.status ?? "network error",
              usedFallback: true,
            });
            setStatus("error");
          });
      });
  }, [slug]);

  if (status !== "ok" || !place) {
    return (
      <Layout>
        <div className="mx-auto max-w-2xl px-4 py-10">
          <div className="mb-6 flex justify-end">
            <div className="max-w-[80%] rounded-3xl bg-[#2f2f2f] px-4 py-2.5 text-sm text-[#ececec]">
              Расскажи про {slug}
            </div>
          </div>
          <div className="flex gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ececec] text-xs font-semibold text-[#212121]">
              V
            </div>
            <div className="min-w-0 flex-1">
              {status === "loading" && (
                <p className="text-sm text-white/40">Ищу заведение...</p>
              )}
              {status === "error" && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-white/60">
                    Не нашёл заведение «{slug}». Возможно, оно было удалено или
                    ссылка неверна.
                  </p>
                  {debug && (
                    <pre className="overflow-x-auto rounded-lg border border-white/10 bg-[#2a2a2a] p-3 text-[11px] text-white/40">
                      {debug.urlTried}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const canonicalUrl = place.geo_data?.canonical_url || `https://vizit-ai.vercel.app/place/${place.slug}`;
  const metaTitle = `${place.name} — ${place.category} в ${place.district || place.city || "Астане"} | VIZIT AI`;
  const metaDescription = place.ambient_description 
    ? `${place.ambient_description.slice(0, 150)}${place.ambient_description.length > 150 ? "..." : ""}`
    : `${place.name} — ${place.category}. Адрес: ${place.address}. Телефон: ${place.phone || "не указан"}.`;

  // Build LocalBusiness Schema.org
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: place.name,
    description: place.ambient_description,
    url: canonicalUrl,
    image: place.emoji ? undefined : undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: place.address,
      addressLocality: place.city || place.district,
      addressCountry: "KZ",
    },
    geo: place.lat && place.lng ? {
      "@type": "GeoCoordinates",
      latitude: place.lat,
      longitude: place.lng,
    } : undefined,
    telephone: place.phone,
    sameAs: [place.website, place.instagram_link, ... (place.social_links || [])].filter(Boolean),
    openingHoursSpecification: place.working_hours ? {
      "@type": "OpeningHoursSpecification",
      opens: place.working_hours.split("-")[0]?.trim() || "09:00",
      closes: place.working_hours.split("-")[1]?.trim() || "21:00",
    } : undefined,
    priceRange: place.avg_check_kzt ? `${place.avg_check_kzt} KZT` : undefined,
    servesCuisine: place.category,
    aggregateRating: place.rating ? {
      "@type": "AggregateRating",
      ratingValue: place.rating,
      bestRating: 5,
    } : undefined,
  };

  // Build FAQ Schema if available
  const faqSchema = place.geo_data?.faq && place.geo_data.faq.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: place.geo_data.faq.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  } : undefined;

  // Build BreadcrumbList Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: "https://vizit-ai.vercel.app/" },
      { "@type": "ListItem", position: 2, name: "Заведения", item: "https://vizit-ai.vercel.app/businesses" },
      { "@type": "ListItem", position: 3, name: place.name, item: canonicalUrl },
    ],
  };

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* OpenGraph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:locale" content="ru_KZ" />
        <meta property="og:site_name" content="VIZIT AI" />
        
        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
        
        {/* JSON-LD Schemas */}
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(localBusinessSchema)}</script>
        {faqSchema && <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>}
      </Helmet>

      <Layout>
        <div className="mx-auto max-w-2xl px-4 py-10">
          {/* User query bubble, right aligned like a chat turn */}
          <div className="mb-6 flex justify-end">
            <div className="max-w-[80%] rounded-3xl bg-[#2f2f2f] px-4 py-2.5 text-sm text-[#ececec]">
              Расскажи про {place.name}
            </div>
          </div>

          {/* AI response */}
          <div className="flex gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ececec] text-xs font-semibold text-[#212121]">
              V
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-4">
                {/* Header */}
                <div>
                  <h1 className="flex items-center gap-2 text-lg font-medium text-[#ececec]">
                    {place.emoji && <span>{place.emoji}</span>}
                    {place.name}
                    {place.is_verified && (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-normal text-white/60">
                        проверено
                      </span>
                    )}
                  </h1>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-white/60">
                    <MapPin size={13} className="text-white/40" />
                    <span>
                      {[place.district, place.address].filter(Boolean).join(", ")}
                    </span>
                  </div>
                  {place.avg_check_kzt != null && (
                    <p className="mt-1 text-sm text-white/60">
                      Средний чек: ~{place.avg_check_kzt.toLocaleString("ru-RU")} ₸
                    </p>
                  )}
                  {place.rating && (
                    <div className="mt-1 flex items-center gap-1 text-sm text-yellow-500">
                      <Star size={13} fill="currentColor" />
                      <span>{place.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {place.ambient_description && (
                  <p className="text-[15px] leading-relaxed text-white/85">
                    {place.ambient_description}
                  </p>
                )}

                {/* Tags */}
                {(place.tags?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {(place.tags ?? []).map((rawTag) => {
                      const tag = normalizeTag(rawTag);
                      const Icon = tag.icon;
                      return (
                        <span
                          key={tag.id}
                          className="flex items-center gap-1.5 rounded-full border border-white/10
                                     bg-[#2a2a2a] px-3 py-1 text-xs text-white/70"
                        >
                          {Icon && <Icon size={12} />}
                          {tag.label}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Contacts Section */}
                <div className="mt-4 space-y-3">
                  <h2 className="text-sm font-medium text-white/80">Контакты</h2>
                  
                  {place.phone && (
                    <a
                      href={`tel:${place.phone.replace(/\s/g, "")}`}
                      className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
                    >
                      <Phone size={14} className="text-white/40" />
                      {place.phone}
                    </a>
                  )}
                  
                  {place.website && (
                    <a
                      href={place.website.startsWith("http") ? place.website : `https://${place.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
                    >
                      <Globe size={14} className="text-white/40" />
                      {place.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                  
                  {place.instagram_link && (
                    <a
                      href={place.instagram_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
                    >
                      <Instagram size={14} className="text-white/40" />
                      Instagram
                    </a>
                  )}
                  
                  {place.working_hours && (
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <Clock size={14} className="text-white/40" />
                      {place.working_hours}
                    </div>
                  )}
                  
                  {place.payment_methods && place.payment_methods.length > 0 && (
                    <div className="flex items-start gap-2 text-sm text-white/70">
                      <CreditCard size={14} className="text-white/40 mt-0.5" />
                      <span>Принимают: {place.payment_methods.join(", ")}</span>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {place.two_gis_url && (
                    <a
                      href={place.two_gis_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-full bg-[#ececec] px-4 py-2
                                 text-xs font-medium text-[#212121] hover:bg-white transition-colors"
                    >
                      Открыть в 2GIS
                      <ExternalLink size={12} />
                    </a>
                  )}
                  
                  {place.website && (
                    <a
                      href={place.website.startsWith("http") ? place.website : `https://${place.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-full border border-white/20 bg-[#2a2a2a] px-4 py-2
                                 text-xs font-medium text-white/80 hover:bg-[#303030] transition-colors"
                    >
                      Посетить сайт
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                {/* Map */}
                {place.lat && place.lng && (
                  <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
                    <iframe
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${place.lng - 0.01},${place.lat - 0.01},${place.lng + 0.01},${place.lat + 0.01}&layer=mapnik&marker=${place.lat},${place.lng}`}
                      width="100%"
                      height="250"
                      style={{ border: 0 }}
                      loading="lazy"
                      title={`Карта: ${place.name}`}
                      className="grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all"
                    />
                  </div>
                )}

                {/* FAQ Section */}
                {place.geo_data?.faq && place.geo_data.faq.length > 0 && (
                  <div className="mt-6">
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-white/80">
                      <MessageSquare size={14} className="text-white/40" />
                      Часто задаваемые вопросы
                    </h2>
                    <div className="space-y-3">
                      {place.geo_data.faq.map((faq, idx) => (
                        <details
                          key={idx}
                          className="group rounded-xl border border-white/10 bg-[#2a2a2a] p-3"
                        >
                          <summary className="cursor-pointer list-none text-sm font-medium text-white/80 group-open:text-white">
                            {faq.question}
                          </summary>
                          <p className="mt-2 text-sm text-white/60 leading-relaxed">
                            {faq.answer}
                          </p>
                        </details>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review Prompts */}
                {place.geo_data?.review_prompts && place.geo_data.review_prompts.length > 0 && (
                  <div className="mt-6">
                    <h2 className="mb-3 text-sm font-medium text-white/80">Как оставить отзыв</h2>
                    <div className="space-y-2">
                      {place.geo_data.review_prompts.slice(0, 3).map((prompt, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-white/10 bg-[#2a2a2a] px-3 py-2 text-sm text-white/60"
                        >
                          {prompt}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Breadcrumb navigation */}
                <nav className="mt-6 text-xs text-white/40">
                  <Link to="/" className="hover:text-white/70">Главная</Link>
                  <span className="mx-2">/</span>
                  <Link to="/businesses" className="hover:text-white/70">Все заведения</Link>
                  <span className="mx-2">/</span>
                  <span className="text-white/60">{place.name}</span>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
