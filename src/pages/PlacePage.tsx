// src/pages/PlacePage.tsx
// Публичная страница заведения. ДОСТУПНА БЕЗ АВТОРИЗАЦИИ.
// Критично для краулеров (GPTBot, ClaudeBot, Googlebot, PerplexityBot):
// весь текстовый контент рендерится сразу в первый проход — никаких
// долгих async-хуков между mount и появлением текста в DOM.

import { useEffect, useState } from "react";
import type { Place } from "../api/index";

const API_BASE = "https://vizit-backend-vdt2.onrender.com";

// ── Категория → Schema.org @type ───────────────────────────────
// LLM/Google понимают точный тип лучше чем generic LocalBusiness
function schemaType(category: string): string {
  const map: Record<string, string> = {
    cafe: "CafeOrCoffeeShop",
    restaurant: "Restaurant",
    barbershop: "HairSalon",
    sto: "AutoRepair",
    gym: "ExerciseGym",
  };
  return map[category] || "LocalBusiness";
}

// ── Строим JSON-LD объект ───────────────────────────────────────
function buildJsonLd(place: Place, slug: string) {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": schemaType(place.category),
    name: place.name,
    description:
      place.ambient_description ||
      `${place.name} — ${place.category} в районе ${place.district}, Астана`,
    address: {
      "@type": "PostalAddress",
      streetAddress: place.address,
      addressLocality: "Астана",
      addressCountry: "KZ",
    },
    url: `https://vizit-ai.vercel.app/place/${slug}`,
  };

  if (place.lat && place.lng) {
    jsonLd.geo = {
      "@type": "GeoCoordinates",
      latitude: place.lat,
      longitude: place.lng,
    };
  }

  if (place.tags && place.tags.length > 0) {
    jsonLd.keywords = place.tags.join(", ");
  }

  if (place.avg_check_kzt) {
    jsonLd.priceRange = `~${place.avg_check_kzt} ₸`;
  }

  if (place.two_gis_url) {
    jsonLd.hasMap = place.two_gis_url;
  }

  const amenities: Record<string, unknown>[] = [];
  if (place.has_wifi) {
    amenities.push({ "@type": "LocationFeatureSpecification", name: "WiFi", value: true });
  }
  if (place.has_outlets) {
    amenities.push({ "@type": "LocationFeatureSpecification", name: "Power outlets", value: true });
  }
  if (amenities.length > 0) {
    jsonLd.amenityFeature = amenities;
  }

  if (place.is_verified) {
    jsonLd.review = {
      "@type": "Review",
      reviewBody: "Verified by VIZIT AI",
    };
  }

  return jsonLd;
}

// ── Вставка/обновление <head> метатегов и JSON-LD ────────────────
function useHeadTags(place: Place | null, slug: string) {
  useEffect(() => {
    if (!place) return;

    const title = `${place.name} — ${place.category} в Астане | VIZIT AI`;
    const description =
      place.ambient_description ||
      `${place.name}: ${place.address}, ${place.district}. Узнайте больше на VIZIT AI.`;

    document.title = title;

    const setMeta = (attr: "name" | "property", key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", "website");
    setMeta("property", "og:url", `https://vizit-ai.vercel.app/place/${slug}`);

    let script = document.getElementById("place-jsonld") as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = "place-jsonld";
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(buildJsonLd(place, slug));
  }, [place, slug]);
}

// ── Отладочная информация при неудачном запросе ──────────────
// Показывается на экране вместо немой "Заведение не найдено",
// чтобы сразу видеть какой URL/статус подвели, без похода в DevTools.
interface FetchDebugInfo {
  primaryUrl: string;
  primaryStatus: number | "network_error";
  fallbackTried: boolean;
  fallbackUrl?: string;
  fallbackStatus?: number | "network_error";
}

// ── Получение заведения по slug напрямую (без авторизации) ──────
function usePlaceBySlug(slug: string) {
  const [place, setPlace] = useState<Place | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<FetchDebugInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setDebugInfo(null);

    // Нормализация: убираем пробелы по краям и приводим к нижнему
    // регистру — slug в базе всегда lowercase (см. бэкенд get_place()),
    // так что "DrinkIt " и "drinkit" должны резолвиться одинаково.
    const cleanSlug = slug.trim().toLowerCase();

    const primaryUrl = `${API_BASE}/api/v1/places/${encodeURIComponent(cleanSlug)}`;
    const fallbackUrl = `${API_BASE}/api/v1/places/${encodeURIComponent(cleanSlug)}/`;

    async function load() {
      const debug: FetchDebugInfo = {
        primaryUrl,
        primaryStatus: "network_error",
        fallbackTried: false,
      };

      // ── Попытка 1: без слэша на конце ───────────────────────
      try {
        const res = await fetch(primaryUrl);
        debug.primaryStatus = res.status;

        if (res.ok) {
          const data: Place = await res.json();
          if (!cancelled) {
            setPlace(data);
            setLoading(false);
          }
          return;
        }
        // не ok (404 или иное) — пробуем fallback ниже
      } catch {
        // сетевая ошибка — primaryStatus остаётся "network_error"
      }

      // ── Попытка 2 (fallback): со слэшем на конце ────────────
      // Бэкенд сейчас отвечает 200 на оба варианта (см. dual route
      // registration), но это подстраховка на случай редеплоя без
      // этого фикса или другого инстанса/прокси перед FastAPI.
      debug.fallbackTried = true;
      debug.fallbackUrl = fallbackUrl;

      try {
        const res = await fetch(fallbackUrl);
        debug.fallbackStatus = res.status;

        if (res.ok) {
          const data: Place = await res.json();
          if (!cancelled) {
            setPlace(data);
            setLoading(false);
          }
          return;
        }
      } catch {
        debug.fallbackStatus = "network_error";
      }

      // Обе попытки провалились
      if (!cancelled) {
        setDebugInfo(debug);
        setNotFound(true);
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { place, loading, notFound, debugInfo };
}

// ── UI ────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--color-background-tertiary, #f5f5f3)",
    fontFamily: "var(--font-sans, system-ui, sans-serif)",
    padding: "24px 16px 60px",
  },
  back: {
    display: "inline-block",
    color: "#378ADD",
    textDecoration: "none",
    fontSize: 13,
    marginBottom: 20,
  },
  card: {
    background: "#fff",
    border: "1px solid #e3e3e0",
    borderRadius: 16,
    padding: 24,
    maxWidth: 560,
    margin: "0 auto",
  },
  emoji: { fontSize: 36, marginBottom: 8 },
  name: { fontSize: 24, fontWeight: 700, margin: "0 0 4px", color: "#1a1a1a" },
  meta: { fontSize: 13, color: "#777", marginBottom: 16 },
  desc: { fontSize: 15, lineHeight: 1.6, color: "#333", marginBottom: 16 },
  tags: { display: "flex", flexWrap: "wrap" as const, gap: 6, marginBottom: 16 },
  tag: {
    background: "#f0f0ee",
    borderRadius: 20,
    padding: "4px 12px",
    fontSize: 12,
    color: "#555",
  },
  gisBtn: {
    display: "inline-block",
    background: "#378ADD",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: 8,
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 600,
  },
};

export function PlacePage({ slug }: { slug: string }) {
  const { place, loading, notFound, debugInfo } = usePlaceBySlug(slug);
  useHeadTags(place, slug);

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <p style={{ color: "#999", textAlign: "center" }}>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (notFound || !place) {
    return (
      <div style={styles.page}>
        <a href="/" style={styles.back}>← На главную</a>
        <div style={styles.card}>
          <p style={{ marginBottom: debugInfo ? 16 : 0 }}>Заведение не найдено.</p>

          {debugInfo && (
            <div
              style={{
                background: "#f7f7f5",
                border: "1px solid #e3e3e0",
                borderRadius: 8,
                padding: 14,
                fontFamily: "monospace",
                fontSize: 12,
                color: "#555",
                lineHeight: 1.7,
                wordBreak: "break-all",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 8, color: "#333" }}>
                Debug info:
              </div>
              <div>→ Запрос 1: {debugInfo.primaryUrl}</div>
              <div>→ Статус 1: {debugInfo.primaryStatus}</div>
              <div>→ Fallback выполнен: {debugInfo.fallbackTried ? "да" : "нет"}</div>
              {debugInfo.fallbackTried && (
                <>
                  <div>→ Запрос 2: {debugInfo.fallbackUrl}</div>
                  <div>→ Статус 2: {debugInfo.fallbackStatus}</div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <a href="/" style={styles.back}>← VIZIT AI</a>
      <article style={styles.card}>
        <div style={styles.emoji}>{place.emoji || "📍"}</div>
        <h1 style={styles.name}>{place.name}</h1>
        <p style={styles.meta}>
          {place.category} · {place.district} · {place.address}
        </p>

        {place.ambient_description && (
          <p style={styles.desc}>{place.ambient_description}</p>
        )}

        {place.tags && place.tags.length > 0 && (
          <div style={styles.tags}>
            {place.tags.map((tag) => (
              <span key={tag} style={styles.tag}>{tag}</span>
            ))}
          </div>
        )}

        {place.avg_check_kzt && (
          <p style={{ fontSize: 13, color: "#777", marginBottom: 16 }}>
            Средний чек: ~{place.avg_check_kzt.toLocaleString("ru-RU")} ₸
          </p>
        )}

        {place.two_gis_url && (
          <a href={place.two_gis_url} target="_blank" rel="noreferrer" style={styles.gisBtn}>
            🗺️ Открыть в 2GIS
          </a>
        )}
      </article>
    </div>
  );
}
