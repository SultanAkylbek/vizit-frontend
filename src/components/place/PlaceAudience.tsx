import { Users } from "lucide-react";
import type { Place } from "../../api/index";

interface PlaceAudienceProps {
  place: Place;
}

export function PlaceAudience({ place }: PlaceAudienceProps) {
  // Support both target_audience (string) and audience (array from generated_content)
  const hasTargetAudience = place.target_audience && place.target_audience.trim().length > 0;
  const hasAudienceArray = place.audience && place.audience.length > 0;
  
  if (!hasTargetAudience && !hasAudienceArray) return null;

  return (
    <div className="mb-8 rounded-xl bg-[#2f2f2f] p-6">
      <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
        <Users size={20} className="text-white/60" />
        Кому подойдет
      </h2>
      
      {hasAudienceArray && (
        <ul className="space-y-2 mb-4">
          {place.audience!.map((item, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="text-green-400 mt-1">✓</span>
              <span className="text-white/80">{item}</span>
            </li>
          ))}
        </ul>
      )}
      
      {hasTargetAudience && (
        <p className="text-white/80 leading-relaxed">{place.target_audience}</p>
      )}
    </div>
  );
}
