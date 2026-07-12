import { useMemo, useState } from "react";
import { ArrowUp, MapPin } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "./Layout";
import { usePlaces } from "./hooks/usePlaces";
import type { Place } from "./api/index";

// Экспортируем категории прямо отсюда, чтобы убрать ошибку [MISSING_EXPORT] в сборщике
export const CATEGORIES = [
  { value: "cafe", label: "Кофейни" },
  { value: "restaurant", label: "Рестораны" },
  { value: "barbershop", label: "Барбершопы" },
  { value: "sto", label: "СТО" },
  { value: "gym", label: "Спортзалы" },
  { value: "other", label: "Другое" },
];

const SUGGESTIONS: { label: string; query: string }[] = [
  { label: "Где поработать с ноутбуком?", query: "wifi" },
  { label: "Тихие места Астаны", query: "тихо" },
  { label: "Кофейня с розетками рядом", query: "розетки" },
  { label: "Куда сходить вечером вдвоём", query: "restaurant" },
];

function matchesQuery(place: Place, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  const haystack = [
    place.name,
    place.category,
    place.district,
    place.address,
    place.ambient_description ?? "",
    ...(place.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export default function App() {
  const { places, loading, error } = usePlaces();
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get("category");

  const filteredPlaces = useMemo(() => {
    return places.filter(
      (p) =>
        matchesQuery(p, query) &&
        (!activeCategory || p.category === activeCategory)
    );
  }, [places, query, activeCategory]);

  const activeCategoryLabel = CATEGORIES.find(
    (c) => c.value === activeCategory
  )?.label;

  return (
    <Layout>
      <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center px-4 py-16">
        <h1 className="mb-8 text-3xl font-semibold text-[#ececec] md:text-4xl">
          VIZIT AI
        </h1>

        {/* Search bar — filters places live as you type */}
        <div className="w-full">
          <div className="flex items-center gap-2 rounded-3xl border border-white/10 bg-[#2f2f2f] px-4 py-3 shadow-sm">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Спросите про место в Астане..."
              className="flex-1 bg-transparent text-sm text-[#ececec] placeholder:text-white/40 focus:outline-none"
            />
            <button
              onClick={(e) => (e.currentTarget as HTMLButtonElement).blur()}
              disabled={!query.trim()}
              aria-label="Найти"
              className={`
                flex h-8 w-8 shrink-0 items-center justify-center rounded-full
                transition-colors
                ${
                  query.trim()
                    ? "bg-white text-black hover:bg-white/90"
                    : "bg-white/10 text-white/30"
                }
              `}
            >
              <ArrowUp size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Quick suggestions */}
        <div className="mt-6 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.label}
              onClick={() => setQuery(s.query)}
              className="rounded-2xl border border-white/10 bg-[#2a2a2a] px-4 py-3
                         text-left text-sm text-white/80 hover:bg-white/5 hover:border-white/20
                         transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>

        {activeCategoryLabel && (
          <div className="mt-8 flex w-full items-center justify-between border-b border-white/5 pb-2">
            <p className="text-xs font-medium text-white/40">
              Категория: <span className="text-white/70">{activeCategoryLabel}</span>
            </p>
            <button 
              onClick={() => navigate("/")}
              className="text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              Сбросить фильтр
            </button>
          </div>
        )}

        {/* Live-filtered list of all places */}
        <div className="mt-4 flex w-full flex-col gap-2 pb-10">
          {loading && (
            <p className="py-6 text-center text-sm text-white/40">
              Загружаю заведения...
            </p>
          )}

          {error && (
            <p className="py-6 text-center text-sm text-white/60">{error}</p>
          )}

          {!loading && !error && filteredPlaces.length === 0 && (
            <p className="py-6 text-center text-sm text-white/40">
              Ничего не найдено. Попробуйте другой запрос.
            </p>
          )}

          {!loading &&
            !error &&
            filteredPlaces.map((place) => (
              <button
                key={place.id}
                onClick={() => navigate(`/place/${place.slug}`)}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#2a2a2a]
                           px-4 py-3 text-left hover:bg-white/5 hover:border-white/20 transition-colors"
              >
                <span className="text-lg leading-none">
                  {place.emoji ?? <MapPin size={16} className="text-white/40" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-[#ececec]">
                    {place.name}
                  </span>
                  <span className="block truncate text-xs text-white/40">
                    {place.district || place.category}
                  </span>
                </span>
                {place.is_verified && (
                  <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/60">
                    проверено
                  </span>
                )}
              </button>
            ))}
        </div>
      </div>
    </Layout>
  );
}
