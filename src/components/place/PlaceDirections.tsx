import { MapPin, Navigation, ExternalLink } from "lucide-react";
import type { Place } from "../../api/index";

interface PlaceDirectionsProps {
  place: Place;
}

export function PlaceDirections({ place }: PlaceDirectionsProps) {
  const hasLandmarks = place.nearby_landmarks && place.nearby_landmarks.length > 0;
  const hasDirections = place.how_to_get_there;
  const has2GIS = place.two_gis_url;

  if (!hasLandmarks && !hasDirections && !has2GIS) return null;

  return (
    <div className="mb-8 rounded-xl bg-[#1a1a1a] border border-white/10 p-6">
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <Navigation size={20} className="text-white/40" />
        Как добраться
      </h2>
      
      {has2GIS && (
        <a
          href={place.two_gis_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-[#222] border border-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-[#2a2a2a] transition-colors mb-4"
        >
          <MapPin size={16} />
          Открыть в 2GIS
          <ExternalLink size={14} className="text-white/40" />
        </a>
      )}

      {hasDirections && (
        <div className="mb-4">
          <p className="text-white/60 mb-2">Как пройти:</p>
          <p className="text-white/80 leading-relaxed">{place.how_to_get_there}</p>
        </div>
      )}

      {hasLandmarks && (
        <div>
          <p className="text-white/60 mb-2 flex items-center gap-2">
            <MapPin size={16} className="text-white/30" />
            Рядом находится:
          </p>
          <ul className="list-disc list-inside text-white/70 space-y-1 ml-2">
            {place.nearby_landmarks!.map((landmark, index) => (
              <li key={index}>{landmark}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
