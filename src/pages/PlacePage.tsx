import { useEffect, useState } from "react";
import { Layout } from "../Layout";
import type { Place } from "../api/index";
import { mapBackendPlace } from "../api/placeMapper";
import { useRecentPlaces } from "../hooks/useRecentPlaces";
import { PlaceHero } from "../components/place/PlaceHero";
import { PlaceDescription } from "../components/place/PlaceDescription";
import { PlaceUSP } from "../components/place/PlaceUSP";
import { PlaceOfferings } from "../components/place/PlaceOfferings";
import { PlaceAudience } from "../components/place/PlaceAudience";
import { PlaceHours } from "../components/place/PlaceHours";
import { PlacePayment } from "../components/place/PlacePayment";
import { PlaceDirections } from "../components/place/PlaceDirections";
import { PlaceFAQ } from "../components/place/PlaceFAQ";
import { PlaceTips } from "../components/place/PlaceTips";
import { PlaceNearby } from "../components/place/PlaceNearby";
import { PlaceSocials } from "../components/place/PlaceSocials";
import PlaceSEO from "../components/place/PlaceSEO";

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

function mergeWithLocalPlace(backendPlace: Place): Place {
  try {
    const raw = localStorage.getItem("vizit_local_places");
    if (!raw) return backendPlace;
    const arr = JSON.parse(raw) as any[];
    const local = arr.find(
      (p) => p.slug === backendPlace.slug || p.id === backendPlace.id || p.business_id === backendPlace.id
    );
    if (!local) return backendPlace;

    const merged = { ...backendPlace };
    if (local.generated_content && typeof local.generated_content === "object") {
      const gc = local.generated_content as Record<string, unknown>;
      if (gc.about && !merged.about) merged.about = String(gc.about);
      if (Array.isArray(gc.usp) && !merged.usp) merged.usp = (gc.usp as string[]).join(" • ");
      if (Array.isArray(gc.offerings) && (!merged.offerings || merged.offerings.length === 0))
        merged.offerings = gc.offerings as string[];
      if (Array.isArray(gc.audience) && (!merged.audience || merged.audience.length === 0))
        merged.audience = gc.audience as string[];
      if (Array.isArray(gc.faq) && (!merged.faq || merged.faq.length === 0))
        merged.faq = gc.faq as { question: string; answer: string }[];
      if (Array.isArray(gc.tips) && (!merged.tips || merged.tips.length === 0))
        merged.tips = gc.tips as string[];
      if (gc.how_to_get_there && !merged.how_to_get_there)
        merged.how_to_get_there = String(gc.how_to_get_there);
      if (Array.isArray(gc.nearby_landmarks) && (!merged.nearby_landmarks || merged.nearby_landmarks.length === 0))
        merged.nearby_landmarks = gc.nearby_landmarks as string[];
      if (gc.working_hours && !merged.working_hours)
        merged.working_hours = String(gc.working_hours);
      if (Array.isArray(gc.payment_methods) && (!merged.payment_methods || merged.payment_methods.length === 0))
        merged.payment_methods = gc.payment_methods as string[];
    }
    if (local.about && !merged.about) merged.about = local.about;
    if (local.usp && !merged.usp) merged.usp = local.usp;
    if (Array.isArray(local.offerings) && (!merged.offerings || merged.offerings.length === 0))
      merged.offerings = local.offerings;
    if (Array.isArray(local.audience) && (!merged.audience || merged.audience.length === 0))
      merged.audience = local.audience;
    if (Array.isArray(local.faq) && (!merged.faq || merged.faq.length === 0))
      merged.faq = local.faq;
    if (Array.isArray(local.tips) && (!merged.tips || merged.tips.length === 0))
      merged.tips = local.tips;
    if (local.how_to_get_there && !merged.how_to_get_there)
      merged.how_to_get_there = local.how_to_get_there;
    if (Array.isArray(local.nearby_landmarks) && (!merged.nearby_landmarks || merged.nearby_landmarks.length === 0))
      merged.nearby_landmarks = local.nearby_landmarks;
    if (local.instagram && !merged.instagram) merged.instagram = local.instagram;
    if (local.tiktok && !merged.tiktok) merged.tiktok = local.tiktok;

    return merged;
  } catch {
    return backendPlace;
  }
}

// Build JSON-LD Schema.org for this place page
function buildSchemaJsonLd(place: Place): string {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: place.name,
    description: place.about || place.ambient_description || `${place.category} в ${place.city}`,
    url: `https://vizit-ai.vercel.app/place/${place.slug}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: place.address,
      addressLocality: place.district ? `${place.district}, ${place.city}` : place.city,
      addressCountry: "KZ",
    },
    geo: place.lat && place.lng
      ? { "@type": "GeoCoordinates", latitude: place.lat, longitude: place.lng }
      : undefined,
    telephone: place.phone || undefined,
    priceRange: place.avg_check_kzt ? `~${place.avg_check_kzt} ₸` : "$$",
    paymentAccepted: place.payment_methods?.length ? place.payment_methods : ["Kaspi QR", "Наличные", "Карта"],
    areaServed: { "@type": "City", name: place.city, containedInPlace: { "@type": "Country", name: "Казахстан" } },
    sameAs: [place.two_gis_url, place.instagram, place.website].filter(Boolean) as string[],
    openingHoursSpecification: place.working_hours
      ? [{ "@type": "OpeningHoursSpecification", description: place.working_hours }]
      : undefined,
    aggregateRating: place.rating
      ? { "@type": "AggregateRating", ratingValue: place.rating, bestRating: 5, worstRating: 1, ratingCount: place.review_count || 1 }
      : undefined,
    knowsAbout: place.tags?.length ? place.tags : [place.category],
    hasMap: place.two_gis_url || undefined,
  };

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

  return JSON.stringify({ "@context": "https://schema.org", "@graph": clean([schema]) });
}

export default function PlacePage({ slug }: PlacePageProps) {
  const [place, setPlace] = useState<Place | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [debug, setDebug] = useState<DebugInfo | null>(null);
  const { pushRecentPlace } = useRecentPlaces();

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
        const mapped = mapBackendPlace(data);
        const merged = mergeWithLocalPlace(mapped);
        setPlace(merged);
        setStatus("ok");
      })
      .catch((firstErr) => {
        const fallbackUrl = `${primaryUrl}/`;
        fetch(fallbackUrl)
          .then((res) => {
            if (res.ok) return res.json();
            return Promise.reject({ url: fallbackUrl, status: res.status });
          })
          .then((data: unknown) => {
            const mapped = mapBackendPlace(data);
            const merged = mergeWithLocalPlace(mapped);
            setPlace(merged);
            setStatus("ok");
          })
          .catch((secondErr) => {
            try {
              const raw = localStorage.getItem("vizit_local_places");
              if (raw) {
                const arr = JSON.parse(raw) as any[];
                const found = arr.find(
                  (p) => p.slug === cleanSlug || p.id === cleanSlug || p.slug === slug
                );
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

  return (
    <Layout>
      {status === "ok" && place && <PlaceSEO place={place} />}

      {/* Schema.org JSON-LD for Google/LLM crawlers */}
      {status === "ok" && place && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: buildSchemaJsonLd(place) }}
        />
      )}

      <div className="mx-auto max-w-5xl px-4 py-10">
        {status === "loading" && (
          <p className="text-sm text-white/40">Загрузка информации о заведении...</p>
        )}

        {status === "error" && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-white/60">
              Не нашёл заведение «{slug}». Возможно, оно было удалено или ссылка неверна.
            </p>
            {debug && (
              <pre className="overflow-x-auto rounded-lg border border-white/10 bg-[#1a1a1a] p-3 text-[11px] text-white/40">
                {debug.urlTried}
              </pre>
            )}
          </div>
        )}

        {status === "ok" && place && (
          <>
            <div className="flex flex-col gap-0">
              <PlaceHero place={place} />
              <PlaceDescription place={place} />
              <PlaceUSP place={place} />
              <PlaceOfferings place={place} />
              <PlaceAudience place={place} />
              <PlaceHours place={place} />
              <PlacePayment place={place} />
              <PlaceDirections place={place} />
              <PlaceNearby place={place} />
              <PlaceFAQ place={place} />
              <PlaceTips place={place} />
              <PlaceSocials place={place} />
            </div>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* SEO TEXT BLOCK — Google & LLMs read this               */}
            {/* ═══════════════════════════════════════════════════════ */}
            <div className="mt-10 rounded-2xl border border-white/10 bg-[#1a1a1a] p-5">
              <h2 className="mb-3 text-lg font-semibold text-[#ececec]">
                {place.name} — {place.category} в {place.city}
              </h2>

              {place.about && (
                <p className="mb-3 text-sm leading-relaxed text-white/70">{place.about}</p>
              )}

              {place.entity_summary && !place.about && (
                <p className="mb-3 text-sm leading-relaxed text-white/70">{place.entity_summary}</p>
              )}

              {place.usp && (
                <div className="mb-3">
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/40">
                    Преимущества
                  </h3>
                  <p className="text-sm text-white/70">
                    {Array.isArray(place.usp) ? place.usp.join(". ") : place.usp}
                  </p>
                </div>
              )}

              {place.offerings && place.offerings.length > 0 && (
                <div className="mb-3">
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/40">
                    Услуги
                  </h3>
                  <p className="text-sm text-white/70">{place.offerings.join(", ")}</p>
                </div>
              )}

              {place.how_to_get_there && (
                <div className="mb-3">
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/40">
                    Как добраться
                  </h3>
                  <p className="text-sm text-white/70">{place.how_to_get_there}</p>
                </div>
              )}

              {place.nearby_landmarks && place.nearby_landmarks.length > 0 && (
                <div className="mb-3">
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/40">
                    Что рядом
                  </h3>
                  <p className="text-sm text-white/70">{place.nearby_landmarks.join(", ")}</p>
                </div>
              )}

              {place.search_intents && place.search_intents.length > 0 && (
                <div className="mt-4 border-t border-white/10 pt-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
                    Популярные запросы
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {place.search_intents.slice(0, 10).map((intent, idx) => {
                      const text = typeof intent === "string" ? intent : intent.query || "";
                      return text ? (
                        <span
                          key={idx}
                          className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/50"
                        >
                          {text}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {place.semantic_terms && place.semantic_terms.length > 0 && (
                <div className="mt-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
                    Ключевые слова
                  </h3>
                  <p className="text-xs leading-relaxed text-white/30">
                    {place.semantic_terms.join(", ")}
                  </p>
                </div>
              )}
            </div>
            {/* ═══════════════════════════════════════════════════════ */}
          </>
        )}
      </div>
    </Layout>
  );
}
