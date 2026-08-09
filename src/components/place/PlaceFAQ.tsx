import { HelpCircle } from "lucide-react";
import type { Place } from "../../api/index";

interface PlaceFAQProps {
  place: Place;
}

export function PlaceFAQ({ place }: PlaceFAQProps) {
  if (!place.faq || place.faq.length === 0) return null;

  return (
    <div className="mb-8 rounded-xl bg-[#2f2f2f] p-6">
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <HelpCircle size={20} />
        Часто задаваемые вопросы
      </h2>
      <div className="space-y-4">
        {place.faq.map((item, index) => (
          <div key={index} className="border-b border-white/10 pb-4 last:border-0 last:pb-0">
            <h3 className="text-white font-medium mb-2">{item.question}</h3>
            <p className="text-white/70 leading-relaxed">{item.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
