import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useRecentPlaces } from "./hooks/useRecentPlaces";

export function Layout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { recentPlaces } = useRecentPlaces();

  // Read directly from the URL so the active category highlights correctly
  // no matter which page (Home, PlacePage, ...) is currently rendered.
  const activeCategory = searchParams.get("category");

  return (
    <div className="flex h-screen bg-[#212121] text-[#ececec]">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewSearch={() => navigate("/")}
        onChatOpen={() => navigate("/chat")}
        onProfileClick={() => navigate("/vendor")}
        onSelectCategory={(category: string) => {
          setSidebarOpen(false);
          navigate(`/?category=${category}`);
        }}
        onSelectPlace={(slug: string) => {
          setSidebarOpen(false);
          navigate(`/place/${slug}`);
        }}
        activeCategory={activeCategory}
        recentPlaces={recentPlaces}
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
