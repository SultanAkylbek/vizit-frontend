import { Users } from "lucide-react";
import type { Place } from "../../api/index";

interface PlaceAudienceProps {
  place: Place;
}

export function PlaceAudience({ place }: PlaceAudienceProps) {
  if (!place.target_audience) return null;

  return (
    <div className="mb-8 rounded-xl bg-[#2f2f2f] p-6">
      <h2 className="text-xl font-semibold text-white mb-3">Кому подойдет</h2>
      <p className="text-white/80 leading-relaxed">{place.target_audience}</p>
    </div>
  );
}
