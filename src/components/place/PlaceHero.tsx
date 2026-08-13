import { Phone, Globe, Instagram, MapPin, ExternalLink } from "lucide-react";
import type { Place } from "../../api/index";

interface PlaceHeroProps {
  place: Place;
}

export function PlaceHero({ place }: PlaceHeroProps) {
  const hasContactInfo = place.phone || place.website || place.instagram || place.two_gis_url;

  return (
    <div className="mb-8">
      <div className="flex items-start gap-3 mb-2">
        <span className="text-4xl">{place.emoji}</span>
        <div>
          <h1 className="text-3xl font-bold text-white">
            {place.name}
            {place.is_verified && (
              <span className="ml-2 inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/70">
                проверено
              </span>
            )}
          </h1>
          <p className="text-lg text-white/50 mt-1 capitalize">{place.category}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-white/60 mt-3 mb-4">
        <MapPin size={18} className="text-white/30" />
        <span>{[place.district, place.address].filter(Boolean).join(", ")}</span>
      </div>

      {/* Главная кнопка 2GIS — белая, заметная */}
      {place.two_gis_url && (
        <a
          href={place.two_gis_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-white text-black px-5 py-3 text-sm font-semibold hover:bg-white/90 transition-colors mb-4"
        >
          <MapPin size={18} />
          Открыть в 2GIS
          <ExternalLink size={14} />
        </a>
      )}

      {hasContactInfo && (
        <div className="flex flex-wrap gap-3 mt-2">
          {place.phone && (
            <a
              href={`tel:${place.phone.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1a1a1a] border border-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-[#222] transition-colors"
            >
              <Phone size={16} />
              Позвонить
            </a>
          )}
          {place.website && (
            <a
              href={place.website.startsWith("http") ? place.website : `https://${place.website}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#1a1a1a] border border-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-[#222] transition-colors"
            >
              <Globe size={16} />
              Сайт
            </a>
          )}
          {place.instagram && (
            <a
              href={place.instagram.startsWith("http") ? place.instagram : `https://instagram.com/${place.instagram.replace(/^@/, "")}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#1a1a1a] border border-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-[#222] transition-colors"
            >
              <Instagram size={16} />
              Instagram
            </a>
          )}
        </div>
      )}
    </div>
  );
}
