import { TOKEN_KEY } from "../auth/authApi";
import { mapBackendPlace, mapBackendPlaces } from "./placeMapper";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://vizit-backend-vdt2.onrender.com";
const LOCAL_PLACES_KEY = "vizit_local_places";
const LOCAL_OFFERS_KEY = "vizit_local_offers";

export interface Place {
  id: string;
  name: string;
  slug: string;
  category: string;
  district: string;
  address: string;
  emoji?: string;
  ambient_description?: string;
  tags: string[];
  is_verified: boolean;
  tier: string;
  avg_check_kzt?: number;
  two_gis_url?: string;
  lat?: number;
  lng?: number;
}

export interface VendorPlaceInput {
  name: string;
  category: string;
  address: string;
  district: string;
  ambient_description: string;
  tags: string[];
  lat: number | null;
  lng: number | null;
  two_gis_url: string;
  avg_check_kzt: number | null;
  has_outlets: boolean;
  has_wifi: boolean;
}

export interface SearchResult {
  matched: boolean;
  rec: string;
  place: Place | null;
  places?: Place[];
  session_id?: string;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  // Token is written exclusively by src/auth/authApi.ts after a real
  // login/register/refresh call — no more scanning localStorage for it.
  const token = localStorage.getItem(TOKEN_KEY);

  const headers = new Headers();

  if (options.headers) {
    const inputHeaders = new Headers(options.headers);
    inputHeaders.forEach((value, key) => {
      headers.set(key, value);
    });
  }

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", "Bearer " + token.trim());
  }

  const fetchOptions: RequestInit = {
    ...options,
    mode: "cors",
    headers: headers
  };

  const res = await fetch(API_BASE + path, fetchOptions);

  if (!res.ok) {
    let message = "Server error";
    try {
      const body = await res.json();
      message = body.detail || body.message || message;
    } catch (_) {}
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function readLocalPlaces(): unknown[] {
  try {
    const raw = localStorage.getItem(LOCAL_PLACES_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeLocalPlaces(arr: unknown[]): void {
  try {
    localStorage.setItem(LOCAL_PLACES_KEY, JSON.stringify(arr));
  } catch {
    /* storage unavailable — nothing more we can do for a local-only fallback */
  }
}

/**
 * BACKEND REALITY CHECK (verified against vizit_ai_backend.py):
 * The real backend does NOT have a "list all places" or "save my place"
 * endpoint. It only has:
 *   POST /api/v1/geo/generate
 *   POST /api/v1/geo/audit
 *   GET  /api/v1/geo/schema        (query params, not a path id)
 *   POST /api/v1/places/from-2gis  (scrape-only, requires a 2GIS URL)
 *   GET  /api/v1/places/{business_id}
 * There is no /api/v1/places (list), /api/v1/vendor/place,
 * /api/v1/vendor/offers, or /api/v1/geo/status anywhere in the backend.
 * Rather than invent endpoints that don't exist, placesApi.list/upsertMine
 * and offersApi below fall back to local-only storage until a real backend
 * endpoint exists for them.
 */
export const placesApi = {
  /** No real list endpoint exists — fallback: locally-saved places only. */
  list: (): Promise<Place[]> => Promise.resolve(mapBackendPlaces(readLocalPlaces())),

  search: async (
    query: string,
    lang: string,
    session_id: string | null,
    local_places?: Place[]
  ): Promise<SearchResult> => {
    const raw = await req<Record<string, unknown>>("/api/v1/search", {
      method: "POST",
      body: JSON.stringify({ query, lang, session_id, local_places }),
    });
    return {
      matched: Boolean(raw?.matched),
      rec: typeof raw?.rec === "string" ? raw.rec : "",
      place: raw?.place ? mapBackendPlace(raw.place) : null,
      places: Array.isArray(raw?.places) ? mapBackendPlaces(raw.places) : undefined,
      session_id: typeof raw?.session_id === "string" ? raw.session_id : undefined,
    };
  },

  /** No real save endpoint exists — fallback: persist locally only, so
   * the rest of the app (search/chat/place page) still sees the place. */
  upsertMine: (data: VendorPlaceInput, idempotencyKey?: string): Promise<{ status: string; place_id: string }> => {
    const place_id = idempotencyKey || genId();
    const mapped = mapBackendPlace({ ...data, id: place_id });
    const filtered = readLocalPlaces().filter((p) => (p as { slug?: string })?.slug !== mapped.slug);
    filtered.unshift(mapped);
    writeLocalPlaces(filtered);
    return Promise.resolve({ status: "saved_locally", place_id });
  },
};

/** A 2GIS import draft is just a Place, mapped from whatever shape the
 * backend returned (old MVP fields or new GEO PlaceRecord fields) — same
 * mapper as everywhere else, so there's only one source of truth. */
export type TwoGisDraft = Place;

export const importApi = {
  /**
   * Calls the existing 2GIS import endpoint: it scrapes the given 2GIS place
   * URL and returns a best-effort draft (OG tags + generated description).
   * The draft is a starting point — the vendor still reviews/edits it before
   * it's actually saved via placesApi.upsertMine.
   */
  fromTwoGis: (twoGisUrl: string): Promise<TwoGisDraft> =>
    req<unknown>("/api/v1/places/from-2gis", {
      method: "POST",
      body: JSON.stringify({ two_gis_url: twoGisUrl, url: twoGisUrl }),
    }).then(mapBackendPlace),
};

/** Real request contract of POST /api/v1/geo/generate (BusinessInput). */
export interface GeoGenerateInput {
  business_name: string;
  niche: string;
  city: string;
  usp: string;
  address_2gis_url: string;
  district?: string;
  payment_methods?: string[];
  phone?: string;
  website?: string;
  social_links?: string[];
  lang?: "ru" | "kz" | "en";
  business_id?: string;
  latitude?: number;
  longitude?: number;
  opening_hours?: string[];
  accepts_reservations?: boolean;
}

/** Real response contract of POST /api/v1/geo/generate (GeoPackageResponse). */
export interface GeoGenerateResult {
  business_name: string;
  city: string;
  generated_at: string;
  business_id: string;
  canonical_url: string;
  indexnow_submitted: boolean;
  llm_attraction_pack: { schema_org: Record<string, unknown>; gis_point_optimization: string; gis_point_char_count: number; llm_faq: { question: string; answer: string }[] };
  nfc_conversion_pack: { multilink_title: string; multilink_description: string; review_prompts: string[] };
  media_proof_pack: { headline: string; press_release_qa: { question: string; answer: string }[]; target_platforms: string[] };
  action_checklist: string[];
}

/** Real request contract of GET /api/v1/geo/schema (query params, not a path id). */
export interface GeoSchemaInput {
  business_name: string;
  niche: string;
  city: string;
  address: string;
  district?: string;
  two_gis_url?: string;
  phone?: string;
  website?: string;
  payment_methods?: string[];
  social_links?: string[];
  latitude?: number;
  longitude?: number;
  opening_hours?: string[];
  accepts_reservations?: boolean;
  business_id?: string;
}

export const geoApi = {
  /** Real endpoint: POST /api/v1/geo/generate (BusinessInput -> GeoPackageResponse). */
  generate: (input: GeoGenerateInput): Promise<GeoGenerateResult> =>
    req("/api/v1/geo/generate", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  /** Real endpoint: GET /api/v1/geo/schema — query params, required fields
   * must be provided (business_name, niche, city, address). */
  schema: (input: GeoSchemaInput): Promise<{ schema_org: Record<string, unknown> }> => {
    const params = new URLSearchParams();
    params.set("business_name", input.business_name);
    params.set("niche", input.niche);
    params.set("city", input.city);
    params.set("address", input.address);
    if (input.district) params.set("district", input.district);
    if (input.two_gis_url) params.set("two_gis_url", input.two_gis_url);
    if (input.phone) params.set("phone", input.phone);
    if (input.website) params.set("website", input.website);
    if (input.payment_methods?.length) params.set("payment_methods", input.payment_methods.join(","));
    if (input.social_links?.length) params.set("social_links", input.social_links.join(","));
    if (input.latitude != null) params.set("latitude", String(input.latitude));
    if (input.longitude != null) params.set("longitude", String(input.longitude));
    if (input.opening_hours?.length) params.set("opening_hours", input.opening_hours.join(","));
    if (input.accepts_reservations != null) params.set("accepts_reservations", String(input.accepts_reservations));
    if (input.business_id) params.set("business_id", input.business_id);
    return req(`/api/v1/geo/schema?${params.toString()}`);
  },

  /** No such endpoint exists on the backend — there is no persisted GEO
   * pipeline status anywhere server-side. Fallback: report "unavailable"
   * locally without making a network call, instead of inventing a route. */
  status: (): Promise<{ available: false; reason: string }> =>
    Promise.resolve({ available: false, reason: "Backend не хранит GEO-статус — эндпоинта не существует" }),
};

function readLocalOffers(): any[] {
  try {
    const raw = localStorage.getItem(LOCAL_OFFERS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeLocalOffers(arr: any[]): void {
  try {
    localStorage.setItem(LOCAL_OFFERS_KEY, JSON.stringify(arr));
  } catch {
    /* storage unavailable */
  }
}

/** No real /api/v1/vendor/offers endpoint exists on the backend — fallback:
 * local-only storage until a real endpoint is implemented. */
export const offersApi = {
  listMine: (): Promise<any[]> => Promise.resolve(readLocalOffers()),

  create: (data: any): Promise<any> => {
    const id = genId();
    const offer = { id, ...data };
    const arr = [offer, ...readLocalOffers()];
    writeLocalOffers(arr);
    return Promise.resolve({ status: "saved_locally", ...offer });
  },

  upsert: (place_id: string, data: any, idempotencyKey?: string): Promise<any> => {
    const id = idempotencyKey || genId();
    const offer = { id, place_id, ...data };
    const arr = readLocalOffers().filter((o) => o?.id !== id);
    arr.unshift(offer);
    writeLocalOffers(arr);
    return Promise.resolve({ status: "saved_locally", id, place_id });
  },

  delete: (id: string): Promise<any> => {
    writeLocalOffers(readLocalOffers().filter((o) => o?.id !== id));
    return Promise.resolve({ status: "deleted_locally", id });
  },
};
