import './vizit-effects.css';
import { useMemo, useState, useRef, useEffect } from "react";
import { ArrowUp, Search, MapPin } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "./Layout";
import { usePlaces } from "./hooks/usePlaces";
import type { Place } from "./api/index";
import { CATEGORIES, SUGGESTIONS } from "./constants";

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

type SearchBarProps = {
  query: string;
  onChange: (value: string) => void;
};

// ВЫНЕСЛИ ИНПУТ СЮДА — ТЕПЕРЬ ФОКУС ПРИ ВВОДЕ ТЕРЯТЬСЯ НЕ БУДЕТ!
function SearchBar({ query, onChange }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Возвращаем фокус в инпут при вводе
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div
      className="flex w-full items-center gap-2 rounded-3xl border border-white/10 bg-[#2f2f2f]
                 px-4 py-3 shadow-sm transition-colors focus-within:border-white/25 focus-within:bg-[#333333]"
    >
      <Search size={16} className="shrink-0 text-white/40" />
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => onChange(e.target.value)}
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
  );
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

  const isSearching = query.trim().length > 0 || !!activeCategory;

  const handleClear = () => {
    setQuery("");
    navigate("/");
  };

  // ── Screen 1: Welcome ──
  if (!isSearching) {
    return (
      <Layout>
        <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center px-4 py-16">
          <h1 className="mb-8 text-3xl font-semibold text-[#ececec] md:text-4xl">
            VIZIT AI
          </h1>

          <div className="w-full">
            <SearchBar query={query} onChange={setQuery} />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => navigate('/chat')}
              className="rounded-2xl border border-white/10 bg-[#2a2a2a] px-4 py-3 text-sm text-white/80 hover:bg-white/5 hover:border-white/20 transition-colors"
            >
              Бесплатный чат
            </button>
            <button
              onClick={() => navigate('/vendor')}
              className="rounded-2xl border border-white/10 bg-[#2a2a2a] px-4 py-3 text-sm text-white/80 hover:bg-white/5 hover:border-white/20 transition-colors"
            >
              Добавить место
            </button>
          </div>

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
        </div>
      </Layout>
    );
  }

  // ── Screen 2: Results ──
  return (
    <Layout>
      <div className="mx-auto flex min-h-full max-w-2xl flex-col px-4 py-8">
        <SearchBar query={query} onChange={setQuery} />

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs font-medium text-white/40">
            {activeCategoryLabel
              ? `Категория: ${activeCategoryLabel}`
              : `Результаты по запросу «${query}»`}
          </p>
          <button
            onClick={handleClear}
            className="text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            Очистить поиск
          </button>
        </div>

        <div className="mt-3 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10">
          {loading && (
            <p className="px-4 py-6 text-center text-sm text-white/40">
              Загружаю заведения...
            </p>
          )}

          {error && (
            <p className="px-4 py-6 text-center text-sm text-white/60">
              {error}
            </p>
          )}

          {!loading && !error && filteredPlaces.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-white/40">
              Ничего не найдено. Попробуйте другой запрос.
            </p>
          )}

          {!loading &&
            !error &&
            filteredPlaces.map((place) => (
              <button
                key={place.id}
                onClick={() => navigate(`/place/${place.slug}`)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
              >
                <span className="text-lg leading-none">
                  {place.emoji ?? (
                    <MapPin size={16} className="text-white/40" />
                  )}
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
