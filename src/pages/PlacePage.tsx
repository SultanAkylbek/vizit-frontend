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
import { PlaceSEO } from "../components/place/PlaceSEO";

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
        )}
      </div>
    </Layout>
  );
}
