import { useEffect, useState } from "react";
import { ExternalLink, MapPin, Phone, Globe, Instagram, Clock, CreditCard, Star, ChevronDown, ChevronUp } from "lucide-react";
import { Layout } from "../Layout";
import type { Place } from "../api/index";
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

// --- Helper Components ---

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <section className="mb-8">
      {title && <h2 className="mb-3 text-base font-medium text-[#ececec]">{title}</h2>}
      <div>{children}</div>
    </section>
  );
}

function ActionButton({ href, icon: Icon, label, variant = "primary" }: { href?: string; icon: any; label: string; variant?: "primary" | "secondary" | "outline" }) {
  if (!href) return null;
  
  const baseClasses = "flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors";
  const variants = {
    primary: "bg-[#ececec] text-[#212121] hover:bg-white",
    secondary: "bg-[#2a2a2a] text-[#ececec] hover:bg-[#3a3a3a]",
    outline: "border border-white/10 bg-transparent text-[#ececec] hover:bg-white/5"
  };

  return (
    <a href={href} target="_blank" rel="noreferrer" className={`${baseClasses} ${variants[variant]}`}>
      <Icon size={16} />
      {label}
    </a>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon size={18} className="mt-0.5 text-white/40 shrink-0" />
      <div>
        <p className="text-xs text-white/40">{label}</p>
        <p className="text-sm text-[#ececec]">{value}</p>
      </div>
    </div>
  );
}

function TagBadge({ tag, icon: Icon }: { tag: string; icon?: any }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-[#2a2a2a] px-3 py-1 text-xs text-white/70">
      {Icon && <Icon size={12} />}
      {tag}
    </span>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-3 text-left"
      >
        <span className="text-sm font-medium text-[#ececec] pr-4">{question}</span>
        {isOpen ? <ChevronUp size={16} className="text-white/40 shrink-0" /> : <ChevronDown size={16} className="text-white/40 shrink-0" />}
      </button>
      {isOpen && (
        <div className="pb-3">
          <p className="text-sm text-white/60 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

// --- Main Page Component ---

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

  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* User query bubble */}
        <div className="mb-8 flex justify-end">
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
              <div className="flex flex-col">
                {/* Hero Section */}
                <div className="mb-8">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h1 className="flex items-center gap-2 text-xl font-medium text-[#ececec]">
                        {place.emoji && <span>{place.emoji}</span>}
                        {place.name}
                        {place.is_verified && (
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-normal text-white/60">
                            проверено
                          </span>
                        )}
                      </h1>
                      {place.category && (
                        <p className="mt-1 text-sm text-white/40 capitalize">{place.category}</p>
                      )}
                    </div>
                    {place.rating && (
                      <div className="flex items-center gap-1 bg-[#2a2a2a] px-2 py-1 rounded-lg">
                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-medium text-[#ececec]">{place.rating}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-2 text-sm text-white/60 mb-4">
                    <MapPin size={16} className="mt-0.5 text-white/40 shrink-0" />
                    <span>{[place.district, place.address].filter(Boolean).join(", ") || place.address}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {place.two_gis_url && (
                      <ActionButton href={place.two_gis_url} icon={ExternalLink} label="2GIS" variant="primary" />
                    )}
                    {place.phone && (
                      <ActionButton href={`tel:${place.phone}`} icon={Phone} label="Позвонить" variant="secondary" />
                    )}
                    {place.website && (
                      <ActionButton href={place.website} icon={Globe} label="Сайт" variant="outline" />
                    )}
                    {place.instagram && (
                      <ActionButton href={place.instagram} icon={Instagram} label="Instagram" variant="outline" />
                    )}
                  </div>
                </div>

                {/* Description */}
                {place.ambient_description && (
                  <Section>
                    <p className="text-[15px] leading-relaxed text-white/85">{place.ambient_description}</p>
                  </Section>
                )}

                {/* USP / Why Choose */}
                {place.usp && (
                  <Section title="Почему выбирают нас">
                    <p className="text-[15px] leading-relaxed text-white/85">{place.usp}</p>
                  </Section>
                )}

                {/* Tags / Features */}
                {(place.tags?.length ?? 0) > 0 && (
                  <Section title="Особенности">
                    <div className="flex flex-wrap gap-2">
                      {(place.tags ?? []).map((rawTag) => {
                        const tag = normalizeTag(rawTag);
                        const Icon = tag.icon;
                        return <TagBadge key={tag.id} tag={tag.label} icon={Icon} />;
                      })}
                    </div>
                  </Section>
                )}

                {/* Working Hours */}
                {place.working_hours && (
                  <Section title="Часы работы">
                    <InfoRow icon={Clock} label="" value={place.working_hours} />
                  </Section>
                )}

                {/* Payment Methods */}
                {place.payment_methods && place.payment_methods.length > 0 && (
                  <Section title="Способы оплаты">
                    <div className="flex flex-wrap gap-2">
                      {place.payment_methods.map((method) => (
                        <span key={method} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-[#2a2a2a] px-3 py-1 text-xs text-white/70">
                          <CreditCard size={12} />
                          {method}
                        </span>
                      ))}
                    </div>
                  </Section>
                )}

                {/* How to get there */}
                {place.how_to_get_there && (
                  <Section title="Как добраться">
                    <p className="text-[15px] leading-relaxed text-white/85">{place.how_to_get_there}</p>
                  </Section>
                )}

                {/* Who is it for */}
                {place.who_is_it_for && (
                  <Section title="Кому подойдет">
                    <p className="text-[15px] leading-relaxed text-white/85">{place.who_is_it_for}</p>
                  </Section>
                )}

                {/* What's nearby */}
                {place.whats_nearby && (
                  <Section title="Что находится рядом">
                    <p className="text-[15px] leading-relaxed text-white/85">{place.whats_nearby}</p>
                  </Section>
                )}

                {/* FAQ */}
                {place.faq && place.faq.length > 0 && (
                  <Section title="Частые вопросы">
                    <div className="divide-y divide-white/5">
                      {place.faq.map((item, index) => (
                        <FAQItem key={index} question={item.question} answer={item.answer} />
                      ))}
                    </div>
                  </Section>
                )}

                {/* Tips for visitors */}
                {place.tips && place.tips.length > 0 && (
                  <Section title="Советы посетителям">
                    <ul className="space-y-2">
                      {place.tips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-white/60">
                          <span className="text-white/40 mt-1">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}

                {/* Local guides */}
                {place.local_guides && place.local_guides.length > 0 && (
                  <Section title="Локальные советы">
                    <ul className="space-y-2">
                      {place.local_guides.map((guide, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-white/60">
                          <span className="text-white/40 mt-1">•</span>
                          {guide}
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}

                {/* Additional info footer */}
                <div className="mt-8 pt-6 border-t border-white/5">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    {place.avg_check_kzt != null && (
                      <div>
                        <p className="text-white/40">Средний чек</p>
                        <p className="text-[#ececec]">~{place.avg_check_kzt.toLocaleString("ru-RU")} ₸</p>
                      </div>
                    )}
                    {place.phone && (
                      <div>
                        <p className="text-white/40">Телефон</p>
                        <p className="text-[#ececec]">{place.phone}</p>
                      </div>
                    )}
                    {place.website && (
                      <div className="col-span-2">
                        <p className="text-white/40">Сайт</p>
                        <a href={place.website} target="_blank" rel="noreferrer" className="text-[#ececec] underline decoration-white/20 hover:decoration-white/40">
                          {place.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
