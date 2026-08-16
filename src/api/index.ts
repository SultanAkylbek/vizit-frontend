// src/api/index.ts
// Frontend API client — talks to the backend at Render

const API_BASE = "https://vizit-backend-vdt2.onrender.com";

// ── Errors ──
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ── Types ──
export interface Place {
  id: string;
  slug: string;
  business_id?: string;
  name: string;
  category: string;
  niche?: string;
  city?: string;
  district?: string | null;
  address: string;
  emoji?: string | null;
  ambient_description?: string | null;
  tags?: string[];
  is_verified?: boolean;
  tier?: string;
  avg_check_kzt?: number;
  two_gis_url?: string;
  lat?: number | null;
  lng?: number | null;
  phone?: string | null;
  website?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  working_hours?: string | null;
  rating?: number | null;
  review_count?: number | null;
  payment_methods?: string[];
  usp?: string | string[] | null;
  features?: string[];
  target_audience?: string | null;
  about?: string | null;
  offerings?: string[];
  audience?: string[];
  faq?: { question: string; answer: string }[] | { q: string; a: string }[];
  tips?: string[];
  how_to_get_there?: string | null;
  nearby_landmarks?: string[];
  local_guides?: string[];
  comparison_sections?: { title: string; content: string }[];
  page_sections?: { title: string; content: string }[];
  ai_context?: string;
  business_knowledge?: string;
  entity_json?: Record<string, unknown>;
  semantic_relations?: string[];
  search_intents?: (string | { query: string; intent_type: string })[];
  source_snippets?: string[];
  recommendation_snippets?: string[];
  conversational_answers?: { question: string; answer: string }[];
  breadcrumb?: { name: string; url?: string }[];
  canonical_url?: string;
  entity_summary?: string | null;
  summary?: string | null;
  atmosphere?: string | null;
  amenities?: string[] | null;
  practical_info?: Record<string, unknown> | null;
  semantic_terms?: string[] | null;
  generated_content?: Record<string, unknown> | null;
  photos?: string[];
  has_wifi?: boolean;
  has_outlets?: boolean;
}

export interface SearchResult {
  places?: Place[];
  place?: Place;
  session_id?: string | null;
  rec?: string;
}

// ── HTTP helper ──
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    ...options,
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const errBody = await res.json();
      detail = errBody.detail || errBody.message || JSON.stringify(errBody);
    } catch {
      detail = await res.text().catch(() => `HTTP ${res.status}`);
    }
    throw new ApiError(detail, res.status);
  }

  // Handle empty body (204)
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── places API ──
export const placesApi = {
  /** Load all places (backend first, fallback to localStorage). */
  async list(): Promise<Place[]> {
    try {
      const data = await apiFetch<Place[]>("/api/v1/places?limit=1000");
      return data;
    } catch {
      const raw = localStorage.getItem("vizit_local_places");
      return raw ? (JSON.parse(raw) as Place[]) : [];
    }
  },

  /** Search places via backend AI + local fallback. */
  async search(
    query: string,
    lang: string,
    sessionId: string | null,
    localPlaces: Place[]
  ): Promise<SearchResult> {
    try {
      const data = await apiFetch<SearchResult>("/api/v1/places/search", {
        method: "POST",
        body: JSON.stringify({ query, lang, session_id: sessionId }),
      });
      return data;
    } catch {
      // Client-side fallback when backend is down
      const q = query.trim().toLowerCase();
      const filtered = localPlaces.filter((p) => {
        const hay = [
          p.name,
          p.category,
          p.district,
          p.address,
          p.ambient_description ?? "",
          ...(p.tags ?? []),
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
      return { places: filtered, rec: "" };
    }
  },

  /** Create or update a vendor's place. */
  async upsertMine(payload: Record<string, unknown>, key: string): Promise<Place> {
    return apiFetch<Place>("/api/v1/places", {
      method: "POST",
      body: JSON.stringify({ ...payload, key }),
    });
  },
};

// ── GEO / AI generation API ──
export const geoApi = {
  async generate(payload: Record<string, unknown>) {
    return apiFetch<{ generated_content?: Record<string, unknown> }>("/api/v1/geo/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};

// ── 2GIS import API ──
export const importApi = {
  async from2gis(url: string, business_id?: string, lang = "ru") {
    return apiFetch<Place>("/api/v1/geo/import-2gis", {
      method: "POST",
      body: JSON.stringify({ url, business_id, lang }),
    });
  },
};

// ── Offers API (placeholder) ──
export const offersApi = {
  // Add methods here when needed
};
