import type { Place } from "../../api/index";

interface PlaceDescriptionProps {
  place: Place;
}

export function PlaceDescription({ place }: PlaceDescriptionProps) {
  const description = place.about || place.ambient_description || place.usp;
  
  if (!description) return null;

  return (
    <div className="mb-8 rounded-xl bg-[#1a1a1a] border border-white/10 p-6">
      <h2 className="text-xl font-semibold text-white mb-3">О заведении</h2>
      <p className="text-white/70 leading-relaxed">{description}</p>
    </div>
  );
}
