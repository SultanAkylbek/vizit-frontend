import { useState, FormEvent } from "react";
import { ArrowUp, Laptop, Volume1, Wifi, CreditCard } from "lucide-react";
import { AppShell } from "./AppShell";
import { RecentPlace } from "./Sidebar";
import "./vizit-effects.css";

interface Suggestion {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
}

const SUGGESTIONS: Suggestion[] = [
  { icon: Laptop, label: "Где поработать с ноутбуком?" },
  { icon: Volume1, label: "Тихие места Астаны" },
  { icon: Wifi, label: "Кафе с быстрым Wi-Fi рядом" },
  { icon: CreditCard, label: "Заведения с оплатой Kaspi QR" },
];

export interface HomeScreenProps {
  recentPlaces: RecentPlace[];
  categories: string[];
  user: { name: string; plan?: string };
  onSelectPlace: (slug: string) => void;
  onSearch: (query: string) => void;
}

export function HomeScreen({
  recentPlaces,
  categories,
  user,
  onSelectPlace,
  onSearch,
}: HomeScreenProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setFocused] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) onSearch(q);
  };

  return (
    <AppShell
      recentPlaces={recentPlaces}
      categories={categories}
      user={user}
      onNewSearch={() => setQuery("")}
      onSelectPlace={onSelectPlace}
    >
      <div className="flex min-h-full flex-col items-center justify-center px-4 py-16">
        <h1 className="mb-3 text-4xl font-semibold tracking-tight text-[#ececec] sm:text-5xl">
          VIZIT AI
        </h1>
        <p className="mb-8 max-w-md text-center text-sm text-[#8e8e8e]">
          Найдите проверенные места рядом — с адресом, часами работы и способом оплаты.
        </p>

        <form
          onSubmit={submit}
          className={`vizit-ring w-full max-w-xl ${isFocused ? "is-focused" : ""}`}
        >
          <div
            className="flex items-center gap-2 rounded-[24px] border border-[#3a3a3a]
            bg-[#2f2f2f] px-4 py-3 transition-colors focus-within:border-[#4a4a4a]"
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Спросите про место, услугу или район…"
              className="min-w-0 flex-1 bg-transparent text-sm text-[#ececec]
              placeholder-[#8e8e8e] outline-none"
            />
            <button
              type="submit"
              disabled={!query.trim()}
              aria-label="Найти"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full
              bg-[#ececec] text-[#212121] transition-opacity
              disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowUp size={16} strokeWidth={2.5} />
            </button>
          </div>
        </form>

        <div className="mt-6 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
          {SUGGESTIONS.map(({ icon: Icon, label }) => (
            <button
              key={label}
              onClick={() => onSearch(label)}
              className="flex items-center gap-2.5 rounded-2xl border border-[#2f2f2f]
              bg-[#2a2a2a] px-4 py-3 text-left text-sm text-[#d9d9d9]
              transition-colors hover:bg-[#333333]"
            >
              <Icon size={16} className="shrink-0 text-[#8e8e8e]" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
