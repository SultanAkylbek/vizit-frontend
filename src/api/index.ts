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
  // 1. Сначала пытаемся взять токен из твоего localStorage
  let token = localStorage.getItem("vizit_token");
  
  // 2. УНИВЕРСАЛЬНЫЙ ФИКС: Если там пусто, ищем токен, который Supabase оставляет автоматически
  if (!token) {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // Supabase сохраняет ключи с префиксом "sb-"
        if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
          const sbData = localStorage.getItem(key);
          if (sbData) {
            const parsed = JSON.parse(sbData);
            token = parsed?.access_token || null;
            if (token) {
              console.log("ℹ️ Подстраховка: токен успешно взят из хранилища Supabase");
              break;
            }
          }
        }
      }
    } catch (e) {
      console.error("Ошибка автоподбора токена Supabase:", e);
    }
  }

  // Если токена вообще нигде нет — пишем предупреждение в консоль, но запрос не блокируем
  if (!token) {
    console.warn("⚠️ Предупреждение: Токен авторизации не найден ни в vizit_token, ни в Supabase. Запрос уйдет пустым.");
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
