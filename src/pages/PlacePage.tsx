import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Star, Wifi, Plug, ExternalLink, Instagram } from "lucide-react";
import { Layout } from "../Layout";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

type Place = {
  id: string;
  slug: string;
  name: string;
  category: string;
  ambient_description: string;
  tags: string[];
  rating_value?: number;
  review_count?: number;
  instagram_link?: string;
  twogis_link?: string;
};

const TAG_ICON: Record<string, typeof Wifi> = {
  wifi: Wifi,
  "розетки": Plug,
};

export default function PlacePage() {
  const { slug = "" } = useParams();
  const [place, setPlace] = useState<Place | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    const cleanSlug = slug.trim().toLowerCase();
    setStatus("loading");
    fetch(`${API_BASE}/api/v1/places/${encodeURIComponent(cleanSlug)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => {
        setPlace(data);
        setStatus("ok");
      })
      .catch(() => setStatus("error"));
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
              <p className="text-sm text-white/60">
                Не нашёл заведение «{slug}». Возможно, оно было удалено или
                ссылка неверна.
              </p>
            )}

            {status === "ok" && place && (
              <div className="flex flex-col gap-4">
                <div>
                  <h1 className="text-lg font-medium text-[#ececec]">
                    {place.name}
                  </h1>
                  {place.rating_value != null && (
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-white/60">
                      <Star
                        size={14}
                        className="fill-amber-400 text-amber-400"
                      />
                      <span>{place.rating_value.toFixed(1)}</span>
                      {place.review_count != null && (
                        <span className="text-white/40">
                          ({place.review_count} отзывов)
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-[15px] leading-relaxed text-white/85">
                  {place.ambient_description}
                </p>

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

                {/* Actions, styled as a follow-up to the AI answer */}
                <div className="mt-1 flex flex-wrap gap-2">
                  {place.twogis_link && (
                    <a
                      href={place.twogis_link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-full bg-[#ececec] px-4 py-2
                                 text-xs font-medium text-[#212121] hover:bg-white transition-colors"
                    >
                      Открыть в 2GIS
                      <ExternalLink size={12} />
                    </a>
                  )}
                  {place.instagram_link && (
                    <a
                      href={place.instagram_link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-full border border-white/10
                                 px-4 py-2 text-xs text-white/70 hover:bg-white/5 transition-colors"
                    >
                      <Instagram size={12} />
                      Instagram
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
