import { MapPin, Navigation } from "lucide-react";
import type { Place } from "../../api/index";

interface PlaceDirectionsProps {
  place: Place;
}

export function PlaceDirections({ place }: PlaceDirectionsProps) {
  const hasLandmarks = place.nearby_landmarks && place.nearby_landmarks.length > 0;
  const hasDirections = place.how_to_get_there;

  if (!hasLandmarks && !hasDirections) return null;

  return (
    <div className="mb-8 rounded-xl bg-[#2f2f2f] p-6">
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <Navigation size={20} />
        Как добраться
      </h2>
      
      {hasLandmarks && (
        <div className="mb-4">
          <p className="text-white/70 mb-2 flex items-center gap-2">
            <MapPin size={16} className="text-white/40" />
            Рядом находится:
          </p>
          <ul className="list-disc list-inside text-white/70 space-y-1 ml-2">
            {place.nearby_landmarks!.map((landmark, index) => (
              <li key={index}>{landmark}</li>
            ))}
          </ul>
        </div>
      )}

      {hasDirections && (
        <div>
          <p className="text-white/70 mb-2">Как пройти:</p>
          <p className="text-white/80 leading-relaxed">{place.how_to_get_there}</p>
        </div>
      )}
    </div>
  );
}
