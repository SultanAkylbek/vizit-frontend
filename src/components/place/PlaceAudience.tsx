import { Users } from "lucide-react";
import type { Place } from "../../api/index";

interface PlaceAudienceProps {
  place: Place;
}

export function PlaceAudience({ place }: PlaceAudienceProps) {
  const hasTargetAudience = place.target_audience && place.target_audience.trim().length > 0;
  const hasAudienceArray = place.audience && place.audience.length > 0;
  
  if (!hasTargetAudience && !hasAudienceArray) return null;

  return (
    <div className="mb-8 rounded-xl bg-[#1a1a1a] border border-white/10 p-6">
      <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
        <Users size={20} className="text-white/40" />
        Кому подойдёт
      </h2>
      
      {hasAudienceArray && (
        <ul className="space-y-2 mb-4">
          {place.audience!.map((item, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="text-white/40 mt-1">✓</span>
              <span className="text-white/80">{item}</span>
            </li>
          ))}
        </ul>
      )}
      
      {hasTargetAudience && (
        <p className="text-white/70 leading-relaxed">{place.target_audience}</p>
      )}
    </div>
  );
}
