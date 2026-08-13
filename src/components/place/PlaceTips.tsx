import { Lightbulb } from "lucide-react";
import type { Place } from "../../api/index";

interface PlaceTipsProps {
  place: Place;
}

export function PlaceTips({ place }: PlaceTipsProps) {
  const hasTips = place.tips && place.tips.length > 0;
  if (!hasTips) return null;

  return (
    <div className="mb-8 rounded-xl bg-[#1a1a1a] border border-white/10 p-6">
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <Lightbulb size={20} className="text-white/40" />
        Полезные советы
      </h2>
      
      <ul className="list-disc list-inside text-white/70 space-y-2 ml-2">
        {place.tips!.map((tip, index) => (
          <li key={index}>{tip}</li>
        ))}
      </ul>
    </div>
  );
}
