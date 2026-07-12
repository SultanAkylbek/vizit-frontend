import { useState } from "react";
import { ArrowUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Layout } from "./components/Layout";

const SUGGESTIONS = [
  "Где поработать с ноутбуком?",
  "Тихие места Астаны",
  "Кофейня с розетками рядом",
  "Куда сходить вечером вдвоём",
];

export default function App() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSubmit = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    // Replace with real search route, e.g. /search?q=...
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <Layout>
      <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center px-4 py-16">
        <h1 className="mb-8 text-3xl font-semibold text-[#ececec] md:text-4xl">
          VIZIT AI
        </h1>

        {/* Search bar */}
        <div className="w-full">
          <div className="flex items-center gap-2 rounded-3xl border border-white/10 bg-[#2f2f2f] px-4 py-3 shadow-sm">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Спросите про место в Астане..."
              className="flex-1 bg-transparent text-sm text-[#ececec] placeholder:text-white/40 focus:outline-none"
            />
            <button
              onClick={handleSubmit}
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
              key={s}
              onClick={() => setQuery(s)}
              className="rounded-2xl border border-white/10 bg-[#2a2a2a] px-4 py-3
                         text-left text-sm text-white/80 hover:bg-white/5 hover:border-white/20
                         transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </Layout>
  );
}
