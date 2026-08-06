import type { Place } from "../../api/index";

interface PlaceDescriptionProps {
  place: Place;
}

export function PlaceDescription({ place }: PlaceDescriptionProps) {
  if (!place.ambient_description && !place.usp) return null;

  return (
    <div className="mb-8 rounded-xl bg-[#2f2f2f] p-6">
      <h2 className="text-xl font-semibold text-white mb-3">О заведении</h2>
      {place.ambient_description && (
        <p className="text-white/80 leading-relaxed mb-4">{place.ambient_description}</p>
      )}
      {place.usp && place.ambient_description !== place.usp && (
        <p className="text-white/70 italic">{place.usp}</p>
      )}
    </div>
  );
}
