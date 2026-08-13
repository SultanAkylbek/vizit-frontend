import { MapPin } from "lucide-react";
import type { Place } from "../../api/index";

interface PlaceNearbyProps {
  place: Place;
}

export function PlaceNearby({ place }: PlaceNearbyProps) {
  const hasLandmarks = place.nearby_landmarks && place.nearby_landmarks.length > 0;
  if (!hasLandmarks) return null;

  return (
    <div className="mb-8 rounded-xl bg-[#1a1a1a] border border-white/10 p-6">
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <MapPin size={20} className="text-white/40" />
        Рядом и интересное
      </h2>
      
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {place.nearby_landmarks!.map((landmark, index) => (
          <li 
            key={index} 
            className="rounded-lg bg-white/5 border border-white/5 px-3 py-2 text-sm text-white/70 flex items-center gap-2"
          >
            <MapPin size={14} className="text-white/30 shrink-0" />
            {landmark}
          </li>
        ))}
      </ul>
    </div>
  );
}
