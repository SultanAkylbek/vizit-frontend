import { Info } from "lucide-react";
import type { Place } from "../../api/index";

interface PlaceAdditionalProps {
  place: Place;
}

export function PlaceAdditional({ place }: PlaceAdditionalProps) {
  const hasConversationalAnswers = place.conversational_answers && place.conversational_answers.length > 0;
  const hasSemanticRelations = place.semantic_relations && place.semantic_relations.length > 0;
  const hasAIContext = place.ai_context;
  const hasBusinessKnowledge = place.business_knowledge;

  if (!hasConversationalAnswers && !hasSemanticRelations && !hasAIContext && !hasBusinessKnowledge) {
    return null;
  }

  return (
    <div className="mb-8 rounded-xl bg-[#2f2f2f] p-6">
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <Info size={20} />
        Дополнительная информация
      </h2>
      
      {hasAIContext && (
        <div className="mb-4">
          <p className="text-white/70 mb-2">О бизнесе:</p>
          <p className="text-white/80 leading-relaxed">{place.ai_context}</p>
        </div>
      )}

      {hasBusinessKnowledge && (
        <div className="mb-4">
          <p className="text-white/70 mb-2">Экспертная информация:</p>
          <p className="text-white/80 leading-relaxed">{place.business_knowledge}</p>
        </div>
      )}

      {hasConversationalAnswers && (
        <div className="mb-4">
          <p className="text-white/70 mb-2">Популярные вопросы и ответы:</p>
          <div className="space-y-3">
            {place.conversational_answers!.map((item, index) => (
              <div key={index} className="rounded-lg bg-white/5 p-3">
                <p className="text-white font-medium mb-1">{item.question}</p>
                <p className="text-white/70 text-sm">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasSemanticRelations && (
        <div>
          <p className="text-white/70 mb-2">Связанные темы:</p>
          <div className="flex flex-wrap gap-2">
            {place.semantic_relations!.map((relation, index) => (
              <span
                key={index}
                className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/80"
              >
                {relation}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
