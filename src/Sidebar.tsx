import { Plus, MapPin, User, ChevronUp } from "lucide-react";

export type RecentPlace = {
  slug: string;
  name: string;
  category: string;
};

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  onNewSearch: () => void;
  onSelectPlace: (slug: string) => void;
  recentPlaces: RecentPlace[];
  userName?: string;
};

export function Sidebar({
  isOpen,
  onClose,
  onNewSearch,
  onSelectPlace,
  recentPlaces,
  userName = "Гость",
}: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col
          bg-[#171717] transition-transform duration-200 ease-out
          md:static md:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Top: new search */}
        <div className="px-3 pt-3">
          <button
            onClick={() => {
              onNewSearch();
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-lg border border-white/10 px-3 py-2.5
                       text-sm text-[#ececec] hover:bg-white/5 transition-colors"
          >
            <Plus size={16} strokeWidth={2} />
            <span>Найти место</span>
          </button>
        </div>

        {/* Middle: recent places, styled like chat history */}
        <nav className="mt-4 flex-1 overflow-y-auto px-3">
          <p className="px-2 pb-1 text-xs font-medium text-white/40">
            Недавние места
          </p>
          <ul className="flex flex-col gap-0.5">
            {recentPlaces.map((place) => (
              <li key={place.slug}>
                <button
                  onClick={() => {
                    onSelectPlace(place.slug);
                    onClose();
                  }}
                  className="group flex w-full items-center gap-2 rounded-lg px-2 py-2
                             text-left text-sm text-white/80 hover:bg-white/5 transition-colors"
                >
                  <MapPin
                    size={14}
                    className="shrink-0 text-white/40 group-hover:text-white/60"
                  />
                  <span className="truncate">{place.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom: profile */}
        <div className="border-t border-white/10 p-3">
          <button className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-white/5 transition-colors">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10">
              <User size={14} className="text-white/70" />
            </div>
            <span className="flex-1 truncate text-left text-sm text-[#ececec]">
              {userName}
            </span>
            <ChevronUp size={14} className="text-white/40" />
          </button>
        </div>
      </aside>
    </>
  );
}
