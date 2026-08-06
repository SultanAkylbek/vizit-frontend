import { Lightbulb } from "lucide-react";
import type { Place } from "../../api/index";

interface PlaceTipsProps {
  place: Place;
}

export function PlaceTips({ place }: PlaceTipsProps) {
  const hasTips = place.tips && place.tips.length > 0;
  const hasLocalGuides = place.local_guides && place.local_guides.length > 0;
  const hasRecommendations = place.recommendation_snippets && place.recommendation_snippets.length > 0;

  if (!hasTips && !hasLocalGuides && !hasRecommendations) return null;

  return (
    <div className="mb-8 rounded-xl bg-[#2f2f2f] p-6">
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <Lightbulb size={20} />
        Полезные советы
      </h2>
      
      {hasTips && (
        <div className="mb-4">
          <p className="text-white/70 mb-2">Советы посетителям:</p>
          <ul className="list-disc list-inside text-white/70 space-y-1 ml-2">
            {place.tips!.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {hasLocalGuides && (
        <div className="mb-4">
          <p className="text-white/70 mb-2">Локальные гиды рекомендуют:</p>
          <ul className="list-disc list-inside text-white/70 space-y-1 ml-2">
            {place.local_guides!.map((guide, index) => (
              <li key={index}>{guide}</li>
            ))}
          </ul>
        </div>
      )}

      {hasRecommendations && (
        <div>
          <p className="text-white/70 mb-2">Рекомендации:</p>
          <ul className="list-disc list-inside text-white/70 space-y-1 ml-2">
            {place.recommendation_snippets!.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
