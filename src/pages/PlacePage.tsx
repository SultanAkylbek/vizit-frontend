// src/pages/PlacePage.tsx
// Публичная страница заведения. ДОСТУПНА БЕЗ АВТОРИЗАЦИИ.
// Критично для краулеров (GPTBot, ClaudeBot, Googlebot, PerplexityBot).

import { useEffect, useState } from "react";
import type { Place } from "../api/index";

const API_BASE = "https://vizit-backend-vdt2.onrender.com";

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

function buildJsonLd(place: Place, slug: string) {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": schemaType(place.category),
    name: place.name,
    description: place.ambient_description || `${place.name} — ${place.category} в районе ${place.district}, Астана`,
    address: {
      "@type": "PostalAddress",
      streetAddress: place.address,
      addressLocality: "Астана",
      addressCountry: "KZ",
    },
    url: `https://vizit-ai.vercel.app/place/${slug}`,
  };

  if (place.lat && place.lng) {
    jsonLd.geo = { "@type": "GeoCoordinates", latitude: place.lat, longitude: place.lng };
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
  return jsonLd;
}

function useHeadTags(place: Place | null, slug: string) {
  useEffect(() => {
    if (!place) return;
    const title = `${place.name} — ${place.category} в Астане | VIZIT AI`;
    const description = place.ambient_description || `${place.name}: ${place.address}, ${place.district}.`;

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

interface FetchDebugInfo {
  primaryUrl: string;
  primaryStatus: string;
  fallbackUrl: string;
  fallbackStatus: string;
}

export function PlacePage({ slug }: { slug: string }) {
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [debug, setDebug] = useState<FetchDebugInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    const cleanSlug = slug.trim().toLowerCase();
    const urlWithoutSlash = `${API_BASE}/api/v1/places/${encodeURIComponent(cleanSlug)}`;
    const urlWithSlash = `${API_BASE}/api/v1/places/${encodeURIComponent(cleanSlug)}/`;

    async function fetchData() {
      let currentDebug: FetchDebugInfo = {
        primaryUrl: urlWithoutSlash,
        primaryStatus: "Не вызывался",
        fallbackUrl: urlWithSlash,
        fallbackStatus: "Не вызывался"
      };

      // Попытка 1: Без слэша
      try {
        currentDebug.primaryStatus = "Запрос...";
        const res = await fetch(urlWithoutSlash);
        currentDebug.primaryStatus = `${res.status} ${res.statusText}`;
        if (res.ok) {
          const data = await res.ok ? await res.json() : null;
          if (data && !cancelled) {
            setPlace(data);
            setLoading(false);
            return;
          }
        }
      } catch (e: any) {
        currentDebug.primaryStatus = `Ошибка сети: ${e.message}`;
      }

      // Попытка 2: Со слэшем (Fallback)
      try {
        currentDebug.fallbackStatus = "Запрос...";
        const res = await fetch(urlWithSlash);
        currentDebug.fallbackStatus = `${res.status} ${res.statusText}`;
        if (res.ok) {
          const data = await res.json();
          if (data && !cancelled) {
            setPlace(data);
            setLoading(false);
            return;
          }
        }
      } catch (e: any) {
        currentDebug.fallbackStatus = `Ошибка сети: ${e.message}`;
      }

      // Если дошли сюда — обе попытки обосрались
      if (!cancelled) {
        setDebug(currentDebug);
        setNotFound(true);
        setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [slug]);

  useHeadTags(place, slug);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f5f3", padding: "24px 16px" }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
          <p style={{ color: "#999" }}>Загрузка заведения...</p>
        </div>
      </div>
    );
  }

  if (notFound || !place) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f5f3", padding: "24px 16px" }}>
        <div style={{ background: "#fff", border: "1px solid #e3e3e0", borderRadius: 16, padding: 24, maxWidth: 560, margin: "0 auto" }}>
          <a href="/" style={{ color: "#378ADD", textDecoration: "none", fontSize: 13, display: "block", marginBottom: 16 }}>← На главную</a>
          <h2 style={{ color: "#cc0000", fontSize: 20, margin: "0 0 8px" }}>Заведение не найдено</h2>
          <p style={{ color: "#666", margin: "0 0 16px" }}>Проверьте правильность ссылки или попробуйте позже.</p>
          
          {debug && (
            <div style={{ background: "#fcf8f2", border: "1px solid #f0e4d4", borderRadius: 8, padding: 12, fontFamily: "monospace", fontSize: 11, color: "#665" }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Логи запросов (Отладка):</div>
              <div>1. {debug.primaryUrl} ➡️ {debug.primaryStatus}</div>
              <div>2. {debug.fallbackUrl} ➡️ {debug.fallbackStatus}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f3", fontFamily: "system-ui, sans-serif", padding: "24px 16px" }}>
      <a href="/" style={{ color: "#378ADD", textDecoration: "none", fontSize: 13, display: "block", marginBottom: 16 }}>← VIZIT AI</a>
      <article style={{ background: "#fff", border: "1px solid #e3e3e0", borderRadius: 16, padding: 24, maxWidth: 560, margin: "0 auto" }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>{place.emoji || "📍"}</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px", color: "#1a1a1a" }}>{place.name}</h1>
        <p style={{ fontSize: 13, color: "#777", marginBottom: 16 }}>
          {place.category} · {place.district} · {place.address}
        </p>

        {place.ambient_description && (
          <p style={{ fontSize: 15, lineHeight: 1.6, color: "#333", marginBottom: 16 }}>{place.ambient_description}</p>
        )}

        {place.tags && place.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            {place.tags.map((tag) => (
              <span key={tag} style={{ background: "#f0f0ee", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "#555" }}>{tag}</span>
            ))}
          </div>
        )}

        {place.avg_check_kzt && (
          <p style={{ fontSize: 13, color: "#777", marginBottom: 16 }}>
            Средний чек: ~{place.avg_check_kzt.toLocaleString("ru-RU")} ₸
          </p>
        )}

        {place.two_gis_url && (
          <a href={place.two_gis_url} target="_blank" rel="noreferrer" style={{ display: "inline-block", background: "#378ADD", color: "#fff", padding: "10px 20px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
            🗺️ Открыть в 2GIS
          </a>
        )}
      </article>
    </div>
  );
}
