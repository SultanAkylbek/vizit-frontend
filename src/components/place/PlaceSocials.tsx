import { Instagram } from "lucide-react";
import type { Place } from "../../api/index";

interface PlaceSocialsProps {
  place: Place;
}

export function PlaceSocials({ place }: PlaceSocialsProps) {
  const hasInstagram = place.instagram && place.instagram.trim().length > 0;
  const hasTiktok = place.tiktok && place.tiktok.trim().length > 0;

  if (!hasInstagram && !hasTiktok) return null;

  return (
    <div className="mb-8 rounded-xl bg-[#1a1a1a] border border-white/10 p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Следите за нами</h2>
      <div className="flex flex-wrap gap-3">
        {hasInstagram && (
          <a
            href={place.instagram!.startsWith("http") ? place.instagram! : `https://instagram.com/${place.instagram!.replace(/^@/, "")}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-white text-black px-5 py-3 text-sm font-semibold hover:bg-white/90 transition-colors"
          >
            <Instagram size={18} />
            Instagram
          </a>
        )}
        {hasTiktok && (
          <a
            href={place.tiktok!.startsWith("http") ? place.tiktok! : `https://tiktok.com/@${place.tiktok!.replace(/^@/, "")}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-white text-black px-5 py-3 text-sm font-semibold hover:bg-white/90 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
            </svg>
            TikTok
          </a>
        )}
      </div>
    </div>
  );
}
