import { Clock } from "lucide-react";
import type { Place } from "../../api/index";

interface PlaceHoursProps {
  place: Place;
}

export function PlaceHours({ place }: PlaceHoursProps) {
  if (!place.working_hours) return null;

  return (
    <div className="mb-8 rounded-xl bg-[#1a1a1a] border border-white/10 p-6">
      <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
        <Clock size={20} className="text-white/40" />
        Часы работы
      </h2>
      <p className="text-white/70">{place.working_hours}</p>
    </div>
  );
}
