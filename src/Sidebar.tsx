import { Plus, MapPin, ChevronRight, User } from "lucide-react";

export interface RecentPlace {
  slug: string;
  name: string;
  city: string;
}

export interface SidebarProps {
  isMobileOpen: boolean;
  onClose: () => void;
  onNewSearch: () => void;
  recentPlaces: RecentPlace[];
  categories: string[];
  user: { name: string; plan?: string };
  onSelectPlace: (slug: string) => void;
}

export function Sidebar({
  isMobileOpen,
  onClose,
  onNewSearch,
  recentPlaces,
  categories,
  user,
  onSelectPlace,
}: SidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
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
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Top: new search */}
        <div className="px-3 pt-3">
          <button
            onClick={onNewSearch}
            className="flex w-full items-center gap-2 rounded-lg border border-[#2a2a2a]
            px-3 py-2.5 text-sm font-medium text-[#ececec] transition-colors
            hover:bg-[#212121]"
          >
            <Plus size={16} strokeWidth={2.25} />
            Найти место
          </button>
        </div>

        {/* Middle: categories + recent places, scrollable */}
        <nav className="mt-4 flex-1 overflow-y-auto px-3 pb-4">
          <p className="px-2 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-[#8e8e8e]">
            Категории
          </p>
          <ul className="mb-4 space-y-0.5">
            {categories.map((c) => (
              <li key={c}>
                <button
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2
                  text-sm text-[#d9d9d9] transition-colors hover:bg-[#212121]"
                >
                  <span className="truncate">{c}</span>
                </button>
              </li>
            ))}
          </ul>

          <p className="px-2 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-[#8e8e8e]">
            Недавние места
          </p>
          <ul className="space-y-0.5">
            {recentPlaces.map((p) => (
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
        </nav>

        {/* Bottom: profile */}
        <div className="border-t border-[#2a2a2a] px-3 py-3">
          <button
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2
            text-left transition-colors hover:bg-[#212121]"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#3a3a3a]">
              <User size={14} className="text-[#ececec]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-[#ececec]">{user.name}</span>
              {user.plan && (
                <span className="block truncate text-xs text-[#8e8e8e]">{user.plan}</span>
              )}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
