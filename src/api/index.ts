// src/api/index.ts
// Никаких внешних импортов — все типы определены здесь

const API_BASE = "https://vizit-backend-vdt2.onrender.com";

// ── Типы ─────────────────────────────────────────────────────

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
  current_load?: string;
  has_outlets?: boolean;
  has_wifi?: boolean;
  avg_check_kzt?: number;
  rating?: number;
  two_gis_url?: string;
  lat?: number;
  lng?: number;
  offers: Offer[];
}

export interface Offer {
  id: string;
  title: string;
  bonus_text: string;
  value?: string;
  discount_pct: number;
  is_active: boolean;
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

// ── Ошибка с HTTP-статусом ────────────────────────────────────

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

// ── Базовый запрос ────────────────────────────────────────────

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("vizit_token");

  // 1. Создаем нормальный объект Headers на основе того, что передали в options
  const headers = new Headers(options.headers);

  // 2. Гарантируем, что Content-Type стоит
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // 3. Если токен есть — ЖЕСТКО вшиваем его, никто его уже не сотрет
  if (token) {
    headers.set("Authorization", "Bearer " + token.trim());
  } else {
    console.error("❌ КРИТИЧЕСКАЯ ОШИБКА: Токен 'vizit_token' НЕ НАЙДЕН в localStorage!");
  }

  // 4. Передаем headers напрямую в fetch с поддержкой CORS
  const res = await fetch(API_BASE + path, {
    mode: "cors", // Явно указываем CORS режим
    ...options,
    headers: headers, 
  });

  if (!res.ok) {
    let message = "Server error";
    try {
      const body = await res.json();
      message = body.detail || body.message || message;
    } catch (_) {
      // тело не JSON
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

// ── Places API ────────────────────────────────────────────────

export const placesApi = {
  // GET /api/v1/places — публичный список для лендинга
  list: (): Promise<Place[]> => req("/api/v1/places"),

  // POST /api/v1/search — AI-поиск
  search: (query: string, lang: string, session_id: string | null): Promise<SearchResult> =>
    req("/api/v1/search", {
      method: "POST",
      body: JSON.stringify({ query, lang, session_id }),
    }),

  // POST /api/v1/vendor/place — создать или обновить своё заведение
  upsertMine: (data: VendorPlaceInput, idempotencyKey?: string): Promise<{ status: string; place_id: string }> => {
    const extraHeaders: Record<string, string> = {};
    if (idempotencyKey) {
      extraHeaders["X-Idempotency-Key"] = idempotencyKey;
    }
    return req("/api/v1/vendor/place/", {
      method: "PUT",
      body: JSON.stringify(data),
      headers: extraHeaders,
    });
  },
};

// ── Offers API ────────────────────────────────────────────────

export const offersApi = {
  // PUT /api/v1/vendor/place/{place_id}/offer
  upsert: (
    placeId: string,
    data: { title: string; bonus_text: string; discount_pct: number },
    idempotencyKey?: string
  ): Promise<Offer> => {
    const extraHeaders: Record<string, string> = {};
    if (idempotencyKey) {
      extraHeaders["X-Idempotency-Key"] = idempotencyKey;
    }
    return req("/api/v1/vendor/place/" + placeId + "/offer", {
      method: "PUT",
      body: JSON.stringify(data),
      headers: extraHeaders,
    });
  },
};
