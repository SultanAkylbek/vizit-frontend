import type { Place } from "../../api/index";

interface PlaceDescriptionProps {
  place: Place;
}

export function PlaceDescription({ place }: PlaceDescriptionProps) {
  // Use about from generated_content, fallback to ambient_description or usp
  const description = place.about || place.ambient_description || place.usp;
  
  if (!description) return null;

  return (
    <div className="mb-8 rounded-xl bg-[#2f2f2f] p-6">
      <h2 className="text-xl font-semibold text-white mb-3">О заведении</h2>
      <p className="text-white/80 leading-relaxed">{description}</p>
    </div>
  );
}
