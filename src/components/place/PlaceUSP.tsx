import { CheckCircle } from "lucide-react";
import type { Place } from "../../api/index";

interface PlaceUSPProps {
  place: Place;
}

export function PlaceUSP({ place }: PlaceUSPProps) {
  const hasUSP = place.usp || (place.features && place.features.length > 0);

  if (!hasUSP) return null;

  return (
    <div className="mb-8 rounded-xl bg-[#2f2f2f] p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Почему выбирают нас</h2>
      {place.usp && (
        <p className="text-white/80 mb-4">{place.usp}</p>
      )}
      {place.features && place.features.length > 0 && (
        <ul className="space-y-2">
          {place.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-white/70">
              <CheckCircle size={18} className="text-green-500 mt-0.5 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
