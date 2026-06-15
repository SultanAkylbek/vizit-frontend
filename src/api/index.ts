// Пытаемся импортировать supabase, если Lovable его создал. 
// Если вылезет ошибка сборки, мы подстрахуемся чистым localStorage.
import { createClient } from '@supabase/supabase-token-v3' // ИИ сборщики часто используют обертки, но мы сделаем проще:

const API_BASE = "https://vizit-backend-vdt2.onrender.com";

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
  // 1. Проверяем твой прямой токен
  let token = localStorage.getItem("vizit_token");

  // 2. БРОНЕБОЙНЫЙ АВТОПОДБОР: если vizit_token нет, выковыриваем JWT из системных хранилищ Supabase
  if (!token) {
    try {
      const keys = Object.keys(localStorage);
      
      // Ищем любую строку, похожую на сохраненную сессию Supabase
      const sbKey = keys.find(key => key.startsWith("sb-") && key.endsWith("-auth-token"));
      
      if (sbKey) {
        const sbData = localStorage.getItem(sbKey);
        if (sbData) {
          const parsed = JSON.parse(sbData);
          token = parsed?.access_token || parsed?.current_session?.access_token || null;
        }
      }
      
      // Если все еще нет, ищем в альтернативных ключах, которые создает Lovable / Vite
      if (!token) {
        const fallbackKey = keys.find(key => key.includes("supabase.auth.token") || key.includes("supabase_session"));
        if (fallbackKey) {
          const fbData = localStorage.getItem(fallbackKey);
          if (fbData) {
            const parsed = JSON.parse(fbData);
            token = parsed?.current_session?.access_token || parsed?.access_token || null;
          }
        }
      }
    } catch (_) {
      // Спокойно глушим ошибки парсинга, чтобы билд не падал
    }
  }

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

  // Если токен нашли — крепим его. Если нет — бэк выдаст 401, но билд хотя бы соберется
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

  search: (query: string, lang: string, session_id: string | null): Promise<SearchResult> =>
    req("/api/v1/search", {
      method: "POST",
      body: JSON.stringify({ query, lang, session_id }),
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

export const offersApi = {
  listMine: (): Promise<any[]> => req("/api/v1/vendor/offers"),
  create: (data: any): Promise<any> => req("/api/v1/vendor/offers", { method: "POST", body: JSON.stringify(data) }),
  delete: (id: string): Promise<any> => req(`/api/v1/vendor/offers/${id}`, { method: "DELETE" })
};
