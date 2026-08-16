import { CreditCard } from "lucide-react";
import type { Place } from "../../api/index";

interface PlacePaymentProps {
  place: Place;
}

export function PlacePayment({ place }: PlacePaymentProps) {
  if (!place.payment_methods || place.payment_methods.length === 0) return null;

  return (
    <div className="mb-8 rounded-xl bg-[#1a1a1a] border border-white/10 p-6">
      <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
        <CreditCard size={20} className="text-white/40" />
        Способы оплаты
      </h2>
      <div className="flex flex-wrap gap-2">
        {place.payment_methods.map((method, index) => (
          <span
            key={index}
            className="rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-white/70"
          >
            {method}
          </span>
        ))}
      </div>
    </div>
  );
}
