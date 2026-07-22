import { Wifi, Zap, CreditCard, MapPin, ArrowUpRight } from "lucide-react";
import { AppShell } from "./AppShell";
import { RecentPlace } from "./Sidebar";

const TAG_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  wifi: Wifi,
  Wifi: Wifi,
  "Wi-Fi": Wifi,
  Розетки: Zap,
  outlets: Zap,
  "Kaspi QR": CreditCard,
  "Kaspi Red": CreditCard,
};

export interface PlaceData {
  slug: string;
  name: string;
  city: string;
  category: string;
  ambientDescription: string;
  tags: string[];
  address: string;
  twoGisUrl: string;
}

export interface PlaceScreenProps {
  place: PlaceData;
  /** The query that led here, shown as the "user turn" above the AI response */
  query: string;
  recentPlaces: RecentPlace[];
  categories: string[];
  user: { name: string; plan?: string };
  onSelectPlace: (slug: string) => void;
  onNewSearch: () => void;
}

export function PlaceScreen({
  place,
  query,
  recentPlaces,
  categories,
  user,
  onSelectPlace,
  onNewSearch,
}: PlaceScreenProps) {
  return (
    <AppShell
      recentPlaces={recentPlaces}
      categories={categories}
      user={user}
      onNewSearch={onNewSearch}
      onSelectPlace={onSelectPlace}
      mobileTitle={place.name}
    >
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {/* User turn */}
        <div className="mb-6 flex justify-end">
          <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-[#2f2f2f] px-4 py-2.5 text-sm text-[#ececec]">
            {query}
          </div>
        </div>

        {/* AI turn */}
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e94848] text-xs font-bold text-white">
            V
          </span>

          <div className="min-w-0 flex-1">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[#8e8e8e]">
              {place.category} · {place.city}
            </p>
            <h1 className="mb-3 text-xl font-semibold text-[#ececec]">{place.name}</h1>

            <p className="text-[15px] leading-7 text-[#d7d7d7]">
              {place.ambientDescription}
            </p>

            {place.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {place.tags?.map((tag) => {
                  const Icon = TAG_ICONS[tag];
                  return (
                    <span
                      key={tag}
                      className="flex items-center gap-1.5 rounded-full border border-[#333333]
                      bg-[#2a2a2a] px-3 py-1 text-xs text-[#d9d9d9]"
                    >
                      {Icon && <Icon size={12} />}
                      {tag}
                    </span>
                  );
                })}
              </div>
            )}

            <p className="mt-4 flex items-center gap-1.5 text-xs text-[#8e8e8e]">
              <MapPin size={12} />
              {place.address}
            </p>

            <a
              href={place.twoGisUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#3a3a3a]
              px-4 py-2 text-sm text-[#ececec] transition-colors hover:bg-[#2a2a2a]"
            >
              Открыть в 2GIS
              <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
