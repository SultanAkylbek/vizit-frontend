// @ts-nocheck
type AuthResponse = any;
type LoginPayload = any;
type RegisterPayload = any;
type Place = any;
type SearchPayload = any;
type SearchResponse = any;
type VendorAnalytics = any;
type Offer = any;

const API_BASE = "https://vizit-backend-vdt2.onrender.com";

// ── Базовый fetch с обработкой ошибок ────────────────────────
class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("vizit_token");

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    let message = "Server error";
    try {
      const body = await res.json();
      // FastAPI обычно возвращает {"detail": "..."}
      message = body.detail ?? body.message ?? message;
    } catch {
      // тело не JSON — оставляем дефолт
    }
    throw new ApiError(res.status, message);
  }

  // 204 No Content — нет тела
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

// ── AUTH ─────────────────────────────────────────────────────
export const authApi = {
  login: (payload: LoginPayload) =>
    request<AuthResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  register: (payload: RegisterPayload) =>
    request<AuthResponse>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  me: () => request<AuthResponse["user"]>("/api/v1/auth/me"),
};

// ── Тип данных для формы вендора — соответствует PlaceCreate на бэкенде ──
export interface VendorPlaceInput {
  name: string;
  category: "cafe" | "barbershop" | "sto" | "restaurant" | "gym" | "other";
  address: string;
  district: string;
  ambient_description: string;
  tags: string[];
  lat?: number | null;
  lng?: number | null;
  two_gis_url?: string | null;
  avg_check_kzt?: number | null;
  has_outlets: boolean;
  has_wifi: boolean;
}

// ── PLACES ───────────────────────────────────────────────────
// ВАЖНО: бэкенд (vizit_ai_backend.py) использует /api/v1/vendor/place
// (единственное число, под /vendor/) для создания и обновления —
// это НЕ то же самое что /api/v1/places (только GET, публичный список)
export const placesApi = {
  // GET /api/v1/places — публичный список (для лендинга, без авторизации)
  list: () => request<Place[]>("/api/v1/places"),

  // POST /api/v1/search — AI-поиск
  search: (payload: SearchPayload) =>
    request<SearchResponse>("/api/v1/search", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // POST /api/v1/vendor/place — создать ИЛИ обновить своё заведение
  // (бэкенд сам решает: если у вендора уже есть place — обновит, иначе создаст)
  // Требует Authorization: Bearer <token> с ролью VENDOR
  upsertMine: (data: VendorPlaceInput, idempotencyKey?: string) =>
    request<{ status: string; place_id: string }>("/api/v1/vendor/place", {
      method: "POST",
      body: JSON.stringify(data),
      headers: idempotencyKey
        ? { "X-Idempotency-Key": idempotencyKey }
        : undefined,
    }),
};

// ── OFFERS ───────────────────────────────────────────────────
// PUT /api/v1/vendor/place/{place_id}/offer
export const offersApi = {
  upsert: (
    placeId: string,
    offer: Partial<Offer> & { discount_pct?: number },
    idempotencyKey?: string
  ) =>
    request<Offer>(`/api/v1/vendor/place/${placeId}/offer`, {
      method: "PUT",
      body: JSON.stringify(offer),
      headers: idempotencyKey
        ? { "X-Idempotency-Key": idempotencyKey }
        : undefined,
    }),
};

// ── ANALYTICS ────────────────────────────────────────────────
// GET /api/v1/vendor/analytics — без параметра place_id,
// бэкенд сам находит заведение текущего вендора по токену
export const analyticsApi = {
  vendor: () => request<VendorAnalytics>("/api/v1/vendor/analytics"),
};

export { ApiError };

