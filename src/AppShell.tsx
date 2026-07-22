import { useState, ReactNode } from "react";
import { Menu } from "lucide-react";
import { Sidebar, RecentPlace } from "./Sidebar";

export interface AppShellProps {
  children: ReactNode;
  recentPlaces: RecentPlace[];
  categories: string[];
  user: { name: string; plan?: string };
  onNewSearch: () => void;
  onSelectPlace: (slug: string) => void;
  /** Shown next to the burger icon on mobile only, e.g. place name on /place/[slug] */
  mobileTitle?: string;
}

export function AppShell({
  children,
  recentPlaces,
  categories,
  user,
  onNewSearch,
  onSelectPlace,
  mobileTitle,
}: AppShellProps) {
  const [isMobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-[#212121] text-[#ececec]">
      <Sidebar
        isMobileOpen={isMobileOpen}
        onClose={() => setMobileOpen(false)}
        onNewSearch={() => {
          setMobileOpen(false);
          onNewSearch();
        }}
        recentPlaces={recentPlaces}
        categories={categories}
        user={user}
        onSelectPlace={(slug) => {
          setMobileOpen(false);
          onSelectPlace(slug);
        }}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile-only header: burger opens sidebar as an overlay drawer */}
        <header className="flex items-center gap-3 border-b border-[#2a2a2a] px-3 py-2.5 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Открыть меню"
            className="rounded-lg p-2 text-[#ececec] transition-colors hover:bg-[#2a2a2a]"
          >
            <Menu size={20} />
          </button>
          <span className="truncate text-sm font-medium text-[#ececec]">
            {mobileTitle ?? "VIZIT AI"}
          </span>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
