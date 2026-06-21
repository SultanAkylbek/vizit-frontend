// src/pages/PlacePage.tsx
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

export function PlacePage({ slug }: { slug: string }) {
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrorMsg(null);

    const targetUrl = `${API_BASE}/api/v1/places/${encodeURIComponent(slug)}`;
    console.log("Fetching from:", targetUrl);

    fetch(targetUrl)
      .then((r) => {
        if (r.status === 404) throw new Error("404: Заведение реально не найдено на бэкенде");
        if (!r.ok) throw new Error(`Ошибка сервера: ${r.status} ${r.statusText}`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setPlace(data);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Fetch error:", err);
        setErrorMsg(err.message || "Сбой сети / Блокировка CORS");
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    if (!place) return;
    document.title = `${place.name} — VIZIT AI`;
    let script = document.getElementById("place-jsonld") as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = "place-jsonld";
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(buildJsonLd(place, slug));
  }, [place, slug]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", padding: 24, background: "#f5f5f3" }}>
        <div style={{ background: "#fff", padding: 24, borderRadius: 16, maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
          <p style={{ color: "#999" }}>Загрузка данных...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !place) {
    return (
      <div style={{ minHeight: "100vh", padding: 24, background: "#f5f5f3" }}>
        <div style={{ background: "#fff", padding: 24, border: "1px solid #cc0000", borderRadius: 16, maxWidth: 560, margin: "0 auto" }}>
          <a href="/" style={{ color: "#378ADD", textDecoration: "none", fontSize: 13, display: "block", marginBottom: 16 }}>← На главную</a>
          <h3 style={{ color: "#cc0000", margin: "0 0 8px" }}>Ошибка загрузки</h3>
          <p style={{ margin: 0, color: "#333" }}>{errorMsg || "Заведение не найдено или бэк недоступен"}</p>
          <p style={{ fontSize: 11, color: "#999", marginTop: 12 }}>URL: {API_BASE}/api/v1/places/{slug}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", padding: 24, background: "#f5f5f3", fontFamily: "system-ui, sans-serif" }}>
      <a href="/" style={{ color: "#378ADD", textDecoration: "none", fontSize: 13, display: "block", marginBottom: 16 }}>← VIZIT AI</a>
      <article style={{ background: "#fff", border: "1px solid #e3e3e0", borderRadius: 16, padding: 24, maxWidth: 560, margin: "0 auto" }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>{place.emoji || "📍"}</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px", color: "#1a1a1a" }}>{place.name}</h1>
        <p style={{ fontSize: 13, color: "#777", marginBottom: 16 }}>{place.category} · {place.district} · {place.address}</p>
        {place.ambient_description && <p style={{ fontSize: 15, lineHeight: 1.6, color: "#333", marginBottom: 16 }}>{place.ambient_description}</p>}
        {place.two_gis_url && (
          <a href={place.two_gis_url} target="_blank" rel="noreferrer" style={{ display: "inline-block", background: "#378ADD", color: "#fff", padding: "10px 20px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
            🗺️ Открыть в 2GIS
          </a>
        )}
      </article>
    </div>
  );
}
