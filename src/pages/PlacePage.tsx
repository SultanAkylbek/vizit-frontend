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
import { PlaceAdditional } from "../components/place/PlaceAdditional";
import { PlaceNearby } from "../components/place/PlaceNearby";
import { PlaceSEO } from "../components/place/PlaceSEO";

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
      
      // Analytics: page view
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "page_view", {
          event_category: "engagement",
          event_label: place.slug,
          value: 1
        });
      }
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

  return (
    <Layout>
      {status === "ok" && place && <PlaceSEO place={place} />}
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
              <pre className="overflow-x-auto rounded-lg border border-white/10 bg-[#2a2a2a] p-3 text-[11px] text-white/40">
                {debug.urlTried}
              </pre>
            )}
          </div>
        )}

        {status === "ok" && place && (
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
            <PlaceAdditional place={place} />
          </div>
        )}
      </div>
    </Layout>
  );
}
