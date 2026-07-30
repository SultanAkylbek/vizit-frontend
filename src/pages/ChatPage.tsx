import { useState, type FormEvent } from "react";
import { Layout } from "../Layout";
import { usePlaces } from "../hooks/usePlaces";
import { placesApi } from "../api/index";
import type { Place } from "../api/index";

function formatPlace(place: Place) {
  const tags = place.tags?.length ? ` (${place.tags.join(", ")})` : "";
  return `• ${place.name}${tags}${place.address ? ` — ${place.address}` : ""}`;
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
    // usePlaces() now returns only local-fallback places (no real "list"
    // endpoint exists on the backend), so there's no local-vs-remote
    // distinction left to prioritise — just sort by proximity.
    const scored = exactMatch.map((p) => {
      let dist = Number.POSITIVE_INFINITY;
      if (userLocation && p.lat != null && p.lng != null) {
        dist = haversine(userLocation.lat, userLocation.lng, p.lat, p.lng);
      }
      return { p, dist };
    });
    scored.sort((a, b) => a.dist - b.dist);
    const answers = scored.slice(0, 5).map((s) => formatPlace(s.p)).join("\n");
    return `Нашёл подходящие места по запросу «${query}»:\n${answers}`;
  }

  const fallback = places.slice(0, 5).map(formatPlace).join("\n");
  return `Пока не нашёл место, точно соответствующее запросу «${query}». Вот несколько заведений из каталога, которые можно посмотреть:\n${fallback}`;
}

export default function ChatPage() {
  const { places, loading, error } = usePlaces();
  const [query, setQuery] = useState("");
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [history, setHistory] = useState<Array<{ role: "user" | "assistant"; text: string }>>([]);

  const canSend = query.trim().length > 0 && !loading;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setHistory((prev) => [...prev, { role: "user", text: trimmed }]);

    // usePlaces() returns only local-fallback places (no real "list"
    // endpoint exists on the backend), so all of them are eligible here.
    const localPlaces = places.slice(0, 12);

    try {
      const res = await placesApi.search(trimmed, "ru", null, localPlaces as Place[]);
      if (res && typeof res.rec === "string" && res.rec.trim()) {
        setHistory((prev) => [...prev, { role: "assistant", text: res.rec }]);
      } else {
        // fallback to client-side answer
        const answer = getChatAnswer(trimmed, places, userLoc);
        setHistory((prev) => [...prev, { role: "assistant", text: answer }]);
      }
    } catch (e) {
      const answer = getChatAnswer(trimmed, places, userLoc);
      setHistory((prev) => [...prev, { role: "assistant", text: answer }]);
    }

    setQuery("");
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

          {history.length === 0 && !loading && !error && (
            <div className="rounded-2xl border border-white/10 bg-[#2a2a2a] p-4 text-sm text-white/60">
              Спросите, например, «где кофе рядом с Нур-Султан» или «какое кафе с розетками есть в Есиле».
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
