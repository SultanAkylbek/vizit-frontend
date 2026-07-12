import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sidebar, type RecentPlace } from "./Sidebar";

// Replace with real data from usePlaces() / localStorage history.
const MOCK_RECENT: RecentPlace[] = [
  { slug: "drinkit", name: "Drinkit — тихая кофейня", category: "cafe" },
  { slug: "workhub", name: "WorkHub коворкинг", category: "coworking" },
  { slug: "silent-tea", name: "Silent Tea House", category: "cafe" },
];

export function Layout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-[#212121] text-[#ececec]">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewSearch={() => navigate("/")}
        onSelectPlace={(slug) => navigate(`/place/${slug}`)}
        recentPlaces={MOCK_RECENT}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar — burger only, sidebar hidden below md */}
        <header className="flex items-center gap-3 px-4 py-3 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Открыть меню"
            className="rounded-lg p-2 hover:bg-white/5"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-medium text-white/80">VIZIT AI</span>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
