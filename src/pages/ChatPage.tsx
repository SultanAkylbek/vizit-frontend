import { useState, type FormEvent } from "react";
import { Layout } from "../Layout";
import { usePlaces } from "../hooks/usePlaces";
import { placesApi, geoApi } from "../api/index";
import type { Place, SearchResult } from "../api/index";

function formatPlace(place: Place) {
  const tags = place.tags?.length ? ` (${place.tags.join(", ")})` : "";
  const category = place.category ? `[${place.category}] ` : "";
  return `• ${category}${place.name}${tags}${place.address ? ` — ${place.address}` : ""}`;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function getEnrichedPlaceAnswer(place: Place): Promise<string> {
  // Try to get full GEO data if available
  let enrichedPlace = place;
  try {
    // Attempt to fetch full GEO package for this business
    const geoResult = await geoApi.generate({
      business_name: place.name,
      niche: place.category || place.niche || "business",
      city: place.city || place.district || "Астана",
      district: place.district,
      usp: place.usp || place.ambient_description?.slice(0, 100) || place.name,
      address_2gis_url: place.two_gis_url || place.address,
      phone: place.phone,
      website: place.website,
      opening_hours: place.working_hours ? [place.working_hours] : undefined,
      payment_methods: place.payment_methods,
      latitude: place.lat,
      longitude: place.lng,
    });
    
    if (geoResult.generated_content) {
      enrichedPlace = {
        ...place,
        ambient_description: geoResult.generated_content.about || place.ambient_description,
        usp: geoResult.generated_content.usp?.[0] || place.usp,
        faq: geoResult.generated_content.faq || place.faq,
        tips: geoResult.generated_content.tips || place.tips,
      };
    }
  } catch (e) {
    // Fallback to basic place data if GEO generation fails
    console.warn("GEO generation failed for chat answer:", e);
  }

  const lines: string[] = [];
  lines.push(`📍 ${enrichedPlace.name}`);
  if (enrichedPlace.category) lines.push(`Категория: ${enrichedPlace.category}`);
  if (enrichedPlace.address) lines.push(`Адрес: ${enrichedPlace.address}`);
  if (enrichedPlace.ambient_description) lines.push(`\n${enrichedPlace.ambient_description}`);
  if (enrichedPlace.two_gis_url) lines.push(`\n🗺️ 2GIS: ${enrichedPlace.two_gis_url}`);
  if (enrichedPlace.phone) lines.push(`📞 Телефон: ${enrichedPlace.phone}`);
  if (enrichedPlace.website) lines.push(`🌐 Сайт: ${enrichedPlace.website}`);
  if (enrichedPlace.working_hours) lines.push(`⏰ Часы работы: ${enrichedPlace.working_hours}`);
  
  return lines.join("\n");
}

function getChatAnswer(query: string, places: Place[], userLocation?: { lat: number; lng: number } | null) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return "Напишите, что хотите найти: кафе, ресторан, барбершоп или другое место в Астане.";
  }

  const exactMatch = places.filter((place) => {
    const haystack = [
      place.name,
      place.category,
      place.district,
      place.address,
      place.ambient_description ?? "",
      ...(place.tags ?? []),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalized);
  });

  if (exactMatch.length > 0) {
    const scored = exactMatch.map((p) => {
      let dist = Number.POSITIVE_INFINITY;
      if (userLocation && p.lat != null && p.lng != null) {
        dist = haversine(userLocation.lat, userLocation.lng, p.lat, p.lng);
      }
      return { p, dist };
    });
    scored.sort((a, b) => a.dist - b.dist);
    
    // Return just the name and 2GIS link for now - full enrichment happens asynchronously
    const topPlace = scored[0].p;
    const twoGisLink = topPlace.two_gis_url ? `\n\n🗺️ Открыть в 2GIS: ${topPlace.two_gis_url}` : "";
    return `Нашёл место: ${topPlace.name}${topPlace.address ? ` (${topPlace.address})` : ""}.${twoGisLink}\n\nОткройте страницу заведения для подробной информации.`;
  }

  const fallback = places.slice(0, 5).map(formatPlace).join("\n");
  return `Пока не нашёл место, точно соответствующее запросу «${query}». Вот несколько заведений из каталога, которые можно посмотреть:\n${fallback}`;
}

export default function ChatPage() {
  const { places, loading, error } = usePlaces();
  const [query, setQuery] = useState("");
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [history, setHistory] = useState<Array<{ role: "user" | "assistant"; text: string }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const canSend = query.trim().length > 0 && !loading && !isProcessing;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    
    setHistory((prev) => [...prev, { role: "user", text: trimmed }]);
    setIsProcessing(true);

    const localPlaces = places.slice(0, 12);

    try {
      const res = await placesApi.search(trimmed, "ru", null, localPlaces as Place[]);
      
      // If backend returns a specific place with full data
      if (res.place) {
        const answer = await getEnrichedPlaceAnswer(res.place);
        setHistory((prev) => [...prev, { role: "assistant", text: answer }]);
      } else if (res && typeof res.rec === "string" && res.rec.trim()) {
        // Backend returned a recommendation text
        setHistory((prev) => [...prev, { role: "assistant", text: res.rec }]);
      } else {
        // Fallback to client-side answer
        const answer = getChatAnswer(trimmed, places, userLoc);
        setHistory((prev) => [...prev, { role: "assistant", text: answer }]);
      }
    } catch (e) {
      const answer = getChatAnswer(trimmed, places, userLoc);
      setHistory((prev) => [...prev, { role: "assistant", text: answer }]);
    } finally {
      setIsProcessing(false);
      setQuery("");
    }
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLoc(null),
      { enableHighAccuracy: false, timeout: 5000 }
    );
  };

  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-4 text-3xl font-semibold text-[#ececec]">Бесплатный чат</h1>
        <p className="mb-6 text-sm text-white/50">
          В этом чате можно спросить про места в Астане. Новые добавленные точки будут учитываться в ответах.
        </p>

        <div className="space-y-4 rounded-3xl border border-white/10 bg-[#242424] p-4">
          {loading && (
            <p className="text-sm text-white/40">Загружаю каталог заведений...</p>
          )}
          {error && <p className="text-sm text-white/60">{error}</p>}
          {isProcessing && (
            <p className="text-sm text-white/40">Ищу информацию...</p>
          )}

          {history.length === 0 && !loading && !error && !isProcessing && (
            <div className="rounded-2xl border border-white/10 bg-[#2a2a2a] p-4 text-sm text-white/60">
              Спросите, например, «где кофе рядом с Байтереком» или «какое кафе с розетками есть в Есиле».
            </div>
          )}

          {history.map((item, idx) => (
            <div
              key={idx}
              className={`rounded-3xl p-4 text-sm ${
                item.role === "user"
                  ? "self-end bg-[#1f1f1f] text-white"
                  : "bg-[#2f2f2f] text-white/95"
              }`}
            >
              <div className="text-xs uppercase tracking-wide text-white/40 mb-2">
                {item.role === "user" ? "Вы" : "VIZIT AI"}
              </div>
              <div>{item.text.split("\n").map((line, index) => (<p key={index}>{line}</p>))}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleUseLocation} className="rounded-2xl px-3 py-2 text-sm bg-white/5">Использовать моё местоположение</button>
          <div className="text-sm text-white/40">{userLoc ? `Локация включена` : `Локация выключена`}</div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Спросите про место, категорию или район..."
            className="flex-1 rounded-3xl border border-white/10 bg-[#1f1f1f] px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!canSend}
            className={`rounded-3xl px-4 py-3 text-sm font-semibold transition-colors ${
              canSend ? "bg-white text-black hover:bg-white/90" : "bg-white/10 text-white/40"
            }`}
          >
            Отправить
          </button>
        </form>
      </div>
    </Layout>
  );
}
