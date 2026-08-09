import { MapPin, Coffee, Utensils, Armchair } from "lucide-react";
import type { Place } from "../../api/index";

interface PlaceNearbyProps {
  place: Place;
}

export function PlaceNearby({ place }: PlaceNearbyProps) {
  const hasLandmarks = place.nearby_landmarks && place.nearby_landmarks.length > 0;
  
  // Check if we have any related/recommendation data
  const hasRelated = place.recommendation_snippets && place.recommendation_snippets.length > 0;
  const hasSemanticRelations = place.semantic_relations && place.semantic_relations.length > 0;

  if (!hasLandmarks && !hasRelated && !hasSemanticRelations) return null;

  return (
    <div className="mb-8 rounded-xl bg-[#2f2f2f] p-6">
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <MapPin size={20} />
        Рядом и интересное
      </h2>
      
      {hasLandmarks && (
        <div className="mb-6">
          <p className="text-white/70 mb-3 flex items-center gap-2">
            <Coffee size={16} className="text-white/40" />
            Ориентиры поблизости:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {place.nearby_landmarks!.map((landmark, index) => (
              <li 
                key={index} 
                className="rounded-lg bg-white/5 px-3 py-2 text-sm text-white/80 flex items-center gap-2"
              >
                <MapPin size={14} className="text-white/40 shrink-0" />
                {landmark}
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasRelated && (
        <div className="mb-6">
          <p className="text-white/70 mb-3 flex items-center gap-2">
            <Utensils size={16} className="text-white/40" />
            Рекомендуем также:
          </p>
          <ul className="space-y-2">
            {place.recommendation_snippets!.map((rec, index) => (
              <li 
                key={index} 
                className="rounded-lg bg-white/5 px-3 py-2 text-sm text-white/80"
              >
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasSemanticRelations && (
        <div>
          <p className="text-white/70 mb-3 flex items-center gap-2">
            <Armchair size={16} className="text-white/40" />
            Связанные темы:
          </p>
          <div className="flex flex-wrap gap-2">
            {place.semantic_relations!.map((relation, index) => (
              <span
                key={index}
                className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/80 hover:bg-white/20 transition-colors cursor-default"
              >
                {relation}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
