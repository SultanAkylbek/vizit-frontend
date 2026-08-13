import { ShoppingBag } from "lucide-react";
import type { Place } from "../../api/index";

interface PlaceOfferingsProps {
  place: Place;
}

export function PlaceOfferings({ place }: PlaceOfferingsProps) {
  const hasPageSections = place.page_sections && place.page_sections.length > 0;
  const hasComparisonSections = place.comparison_sections && place.comparison_sections.length > 0;
  const hasOfferings = place.offerings && place.offerings.length > 0;

  if (!hasPageSections && !hasComparisonSections && !hasOfferings) return null;

  return (
    <div className="mb-8 rounded-xl bg-[#2f2f2f] p-6">
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <ShoppingBag size={20} />
        Что мы предлагаем
      </h2>
      
      {hasOfferings && (
        <ul className="space-y-2 mb-4">
          {place.offerings!.map((offering, index) => (
            <li key={index} className="flex items-start gap-2 text-white/80">
              <span className="text-green-400 mt-1">•</span>
              <span>{offering}</span>
            </li>
          ))}
        </ul>
      )}
      
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
