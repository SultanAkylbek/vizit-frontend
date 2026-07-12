import { useEffect, useState } from "react";
import { Wifi, Plug, ExternalLink, MapPin } from "lucide-react";
import { Layout } from "../Layout";
import type { Place } from "../api/index";

// Same backend as api/index.ts. Kept as a local constant (not import.meta.env)
// because that's how the original slug-lookup fix was wired.
const API_BASE = "https://vizit-backend-vdt2.onrender.com";

const TAG_ICON: Record<string, typeof Wifi> = {
  wifi: Wifi,
  "розетки": Plug,
};

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
      .then((data: Place) => {
        setPlace(data);
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
          .then((data: Place) => {
            setPlace(data);
            setStatus("ok");
          })
          .catch((secondErr) => {
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
      <div className="mx-auto max-w-2xl px-4 py-10">
        {/* User query bubble, right aligned like a chat turn */}
        <div className="mb-6 flex justify-end">
          <div className="max-w-[80%] rounded-3xl bg-[#2f2f2f] px-4 py-2.5 text-sm text-[#ececec]">
            Расскажи про {place?.name ?? slug}
          </div>
        </div>

        {/* AI response */}
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

            {status === "ok" && place && (
              <div className="flex flex-col gap-4">
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
                </div>

                {place.ambient_description && (
                  <p className="text-[15px] leading-relaxed text-white/85">
                    {place.ambient_description}
                  </p>
                )}

                {place.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {place.tags.map((tag) => {
                      const Icon = TAG_ICON[tag.toLowerCase()];
                      return (
                        <span
                          key={tag}
                          className="flex items-center gap-1.5 rounded-full border border-white/10
                                     bg-[#2a2a2a] px-3 py-1 text-xs text-white/70"
                        >
                          {Icon && <Icon size={12} />}
                          {tag}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Action, styled as a follow-up to the AI answer */}
                {place.two_gis_url && (
                  <div className="mt-1 flex flex-wrap gap-2">
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
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
