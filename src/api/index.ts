import { TOKEN_KEY } from "../auth/authApi";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://vizit-backend-vdt2.onrender.com";

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

export const placesApi = {
  list: (): Promise<Place[]> => req("/api/v1/places"),

  search: (
    query: string,
    lang: string,
    session_id: string | null,
    local_places?: Place[]
  ): Promise<SearchResult> =>
    req("/api/v1/search", {
      method: "POST",
      body: JSON.stringify({ query, lang, session_id, local_places }),
    }),

  upsertMine: (data: VendorPlaceInput, idempotencyKey?: string): Promise<{ status: string; place_id: string }> => {
    const extraHeaders: Record<string, string> = {};
    if (idempotencyKey) {
      extraHeaders["X-Idempotency-Key"] = idempotencyKey;
    }
    return req("/api/v1/vendor/place", {
      method: "POST",
      body: JSON.stringify(data),
      headers: extraHeaders,
    });
  },
};

export interface TwoGisDraft {
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
}

export const importApi = {
  /**
   * Calls the existing 2GIS import endpoint: it scrapes the given 2GIS place
   * URL and returns a best-effort draft (OG tags + generated description).
   * The draft is a starting point — the vendor still reviews/edits it before
   * it's actually saved via placesApi.upsertMine.
   */
  fromTwoGis: (twoGisUrl: string): Promise<TwoGisDraft> =>
    req("/api/v1/places/from-2gis", {
      method: "POST",
      body: JSON.stringify({ two_gis_url: twoGisUrl }),
    }),
};

export interface GeoFields {
  name: string;
  category: string;
  ambient_description: string;
  address: string;
  district: string;
  tags: string[];
  two_gis_url?: string;
  offers?: unknown[];
  /** Precomputed Schema.org fragment from src/geo/tags — optional so
   * existing callers that don't build one yet still type-check. */
  tags_schema?: unknown;
}

export interface GeoGenerateResult {
  schema_generated?: boolean;
  json_ld?: Record<string, unknown>;
  indexnow_submitted?: boolean;
  indexnow_status?: string;
  [key: string]: unknown;
}

export interface GeoStatusResult {
  schema_generated?: boolean;
  indexed?: boolean;
  ready?: boolean;
  [key: string]: unknown;
}

export const geoApi = {
  /**
   * Sends the full GEO field set for a saved place and asks the backend to
   * (re)generate its Schema.org / JSON-LD markup and, if the backend has an
   * IndexNow integration wired up, submit the place URL for indexing.
   * The exact response shape is backend-defined — every field here is read
   * defensively (see useGeoPipeline) since this endpoint's contract hasn't
   * been confirmed against the live backend.
   */
  generate: (placeId: string, fields: GeoFields): Promise<GeoGenerateResult> =>
    req("/api/v1/geo/generate", {
      method: "POST",
      body: JSON.stringify({ place_id: placeId, ...fields }),
    }),

  /** Fetches the generated Schema.org JSON-LD for a place, if available. */
  schema: (placeId: string): Promise<Record<string, unknown>> =>
    req(`/api/v1/geo/schema/${placeId}`),

  /** Real GEO pipeline status for a place — only used if the backend exposes it. */
  status: (placeId: string): Promise<GeoStatusResult> =>
    req(`/api/v1/geo/status/${placeId}`),
};

export const offersApi = {
  listMine: (): Promise<any[]> => req("/api/v1/vendor/offers"),
  create: (data: any): Promise<any> =>
    req("/api/v1/vendor/offers", { method: "POST", body: JSON.stringify(data) }),
  upsert: (place_id: string, data: any, idempotencyKey?: string): Promise<any> => {
    const extraHeaders: Record<string, string> = {};
    if (idempotencyKey) {
      extraHeaders["X-Idempotency-Key"] = idempotencyKey;
    }
    return req(`/api/v1/vendor/offers`, {
      method: "POST",
      body: JSON.stringify({ place_id, ...data }),
      headers: extraHeaders,
    });
  },
  delete: (id: string): Promise<any> =>
    req(`/api/v1/vendor/offers/${id}`, { method: "DELETE" }),
};
