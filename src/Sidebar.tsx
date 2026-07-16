import { Plus, LayoutGrid, User, ChevronUp } from "lucide-react";
import { CATEGORIES } from "./constants";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  onNewSearch: () => void;
  onChatOpen: () => void;
  onProfileClick: () => void;
  onSelectCategory: (category: string) => void;
  activeCategory?: string | null;
  userName?: string;
};

export function Sidebar({
  isOpen,
  onClose,
  onNewSearch,
  onSelectCategory,
  activeCategory,
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
        {/* Top: new search, styled like ChatGPT's "New chat" */}
        <div className="px-3 pt-3 space-y-2">
          <button
            onClick={() => {
              onNewSearch();
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-lg border border-white/10 px-3 py-2.5
                       text-sm text-[#ececec] hover:bg-white/5 transition-colors"
          >
            <Plus size={16} strokeWidth={2} />
            <span>Новый поиск</span>
          </button>
          <button
            onClick={() => {
              onChatOpen();
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-lg border border-white/10 px-3 py-2.5
                       text-sm text-[#ececec] hover:bg-white/5 transition-colors"
          >
            <LayoutGrid size={16} className="text-white/40" />
            <span>Бесплатный чат</span>
          </button>
        </div>

        {/* Middle: categories, styled like chat-history entries */}
        <nav className="mt-4 flex-1 overflow-y-auto px-3">
          <p className="px-2 pb-1 text-xs font-medium text-white/40">
            Категории
          </p>
          <ul className="flex flex-col gap-0.5">
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat.value;
              return (
                <li key={cat.value}>
                  <button
                    onClick={() => {
                      onSelectCategory(cat.value);
                      onClose();
                    }}
                    className={`
                      group flex w-full items-center gap-2 rounded-lg px-2 py-2
                      text-left text-sm transition-colors
                      ${
                        active
                          ? "bg-[#2f2f2f] text-[#ececec]"
                          : "text-white/80 hover:bg-white/5"
                      }
                    `}
                  >
                    <LayoutGrid
                      size={14}
                      className={`shrink-0 ${
                        active ? "text-white/80" : "text-white/40 group-hover:text-white/60"
                      }`}
                    />
                    <span className="truncate">{cat.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom: profile */}
        <div className="border-t border-white/10 p-3">
          <button
            onClick={onProfileClick}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-white/5 transition-colors"
          >
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
