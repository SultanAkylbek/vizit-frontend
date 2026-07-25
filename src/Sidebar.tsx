import { Plus, MapPin, ChevronRight, MessageCircle, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CATEGORIES } from "./constants";
import type { RecentPlace } from "./hooks/useRecentPlaces";
import { useAuth } from "./auth/useAuth";

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewSearch: () => void;
  onChatOpen: () => void;
  onProfileClick: () => void;
  onSelectCategory: (category: string) => void;
  onSelectPlace: (slug: string) => void;
  activeCategory: string | null;
  /** Real, locally-tracked recent views — always an array, never undefined. */
  recentPlaces?: RecentPlace[];
}

export function Sidebar({
  isOpen,
  onClose,
  onNewSearch,
  onChatOpen,
  onProfileClick,
  onSelectCategory,
  onSelectPlace,
  activeCategory,
  recentPlaces,
}: SidebarProps) {
  // Defensive: never assume the array prop is actually an array at runtime.
  const safeRecentPlaces = recentPlaces ?? [];
  const safeCategories = CATEGORIES ?? [];
  const { user, status, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    onClose();
    navigate("/");
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-[260px] shrink-0 flex-col
        bg-[#171717] text-[#ececec] transition-transform duration-200 ease-out
        md:static md:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Top: new search + chat */}
        <div className="space-y-1.5 px-3 pt-3">
          <button
            onClick={onNewSearch}
            className="flex w-full items-center gap-2 rounded-lg border border-[#2a2a2a]
            px-3 py-2.5 text-sm font-medium text-[#ececec] transition-colors
            hover:bg-[#212121]"
          >
            <Plus size={16} strokeWidth={2.25} />
            Найти место
          </button>
          <button
            onClick={onChatOpen}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2
            text-sm text-[#d9d9d9] transition-colors hover:bg-[#212121]"
          >
            <MessageCircle size={16} strokeWidth={2.25} />
            Бесплатный чат
          </button>
        </div>

        {/* Middle: categories + recent places, scrollable */}
        <nav className="mt-4 flex-1 overflow-y-auto px-3 pb-4">
          <p className="px-2 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-[#8e8e8e]">
            Категории
          </p>
          <ul className="mb-4 space-y-0.5">
            {safeCategories.map((c) => (
              <li key={c.value}>
                <button
                  onClick={() => onSelectCategory(c.value)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2
                  text-sm transition-colors hover:bg-[#212121] ${
                    activeCategory === c.value ? "bg-[#212121] text-[#ececec]" : "text-[#d9d9d9]"
                  }`}
                >
                  <span className="truncate">{c.label}</span>
                </button>
              </li>
            ))}
          </ul>

          {safeRecentPlaces.length > 0 && (
            <>
              <p className="px-2 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-[#8e8e8e]">
                Недавние места
              </p>
              <ul className="space-y-0.5">
                {safeRecentPlaces.map((p) => (
                  <li key={p.slug}>
                    <button
                      onClick={() => onSelectPlace(p.slug)}
                      className="group flex w-full items-center gap-2 rounded-lg px-2.5 py-2
                      text-left text-sm text-[#d9d9d9] transition-colors hover:bg-[#212121]"
                    >
                      <MapPin size={14} className="shrink-0 text-[#8e8e8e]" />
                      <span className="min-w-0 flex-1 truncate">{p.name}</span>
                      <ChevronRight
                        size={14}
                        className="shrink-0 text-[#5f5f5f] opacity-0 transition-opacity group-hover:opacity-100"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </nav>

        {/* Bottom: real auth state, not a static placeholder */}
        <div className="border-t border-[#2a2a2a] px-3 py-3">
          {status === "authenticated" && user ? (
            <div className="space-y-1">
              <button
                onClick={onProfileClick}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[#212121]"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#3a3a3a]">
                  <User size={14} className="text-[#ececec]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-[#ececec]">{user.name}</span>
                  <span className="block truncate text-xs text-[#8e8e8e]">{user.email}</span>
                </span>
              </button>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm text-[#8e8e8e] transition-colors hover:bg-[#212121] hover:text-[#ececec]"
              >
                <LogOut size={14} />
                Выйти
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                onClose();
                navigate("/login");
              }}
              disabled={status === "restoring"}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm text-[#ececec] transition-colors hover:bg-[#212121] disabled:opacity-40"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#3a3a3a]">
                <User size={14} className="text-[#ececec]" />
              </span>
              {status === "restoring" ? "Загрузка..." : "Войти"}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
