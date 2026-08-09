import { ShoppingBag } from "lucide-react";
import type { Place } from "../../api/index";

interface PlaceOfferingsProps {
  place: Place;
}

export function PlaceOfferings({ place }: PlaceOfferingsProps) {
  const hasPageSections = place.page_sections && place.page_sections.length > 0;
  const hasComparisonSections = place.comparison_sections && place.comparison_sections.length > 0;

  if (!hasPageSections && !hasComparisonSections) return null;

  return (
    <div className="mb-8 rounded-xl bg-[#2f2f2f] p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Что мы предлагаем</h2>
      
      {hasPageSections && (
        <div className="space-y-4">
          {place.page_sections!.map((section, index) => (
            <div key={index}>
              <h3 className="text-lg font-medium text-white mb-2">{section.title}</h3>
              <p className="text-white/70 leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>
      )}

      {hasComparisonSections && (
        <div className="space-y-4 mt-6 pt-6 border-t border-white/10">
          {place.comparison_sections!.map((section, index) => (
            <div key={index}>
              <h3 className="text-lg font-medium text-white mb-2">{section.title}</h3>
              <p className="text-white/70 leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
