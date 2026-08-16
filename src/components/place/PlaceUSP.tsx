import { CheckCircle } from "lucide-react";
import type { Place } from "../../api/index";

interface PlaceUSPProps {
  place: Place;
}

export function PlaceUSP({ place }: PlaceUSPProps) {
  const uspArray = place.usp 
    ? Array.isArray(place.usp) 
      ? place.usp 
      : [place.usp]
    : [];
  const hasFeatures = place.features && place.features.length > 0;
  const hasUSP = uspArray.length > 0 || hasFeatures;

  if (!hasUSP) return null;

  return (
    <div className="mb-8 rounded-xl bg-[#1a1a1a] border border-white/10 p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Почему выбирают нас</h2>
      
      {uspArray.length > 0 && (
        <ul className="space-y-3 mb-4">
          {uspArray.map((usp, index) => (
            <li key={index} className="flex items-start gap-3 text-white/80">
              <CheckCircle size={18} className="text-white/40 mt-0.5 shrink-0" />
              <span>{usp}</span>
            </li>
          ))}
        </ul>
      )}
      
      {hasFeatures && (
        <ul className="space-y-3">
          {place.features!.map((feature, index) => (
            <li key={index} className="flex items-start gap-3 text-white/70">
              <CheckCircle size={18} className="text-white/40 mt-0.5 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
