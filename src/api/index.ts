// @ts-nocheck

const API_BASE = "https://vizit-backend-vdt2.onrender.com";

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request(path, options = {}) {
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
      message = body.detail ?? body.message ?? message;
    } catch {}
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) {
    return undefined;
  }

  return res.json();
}

export const authApi = {
  login: (payload) => request("/api/v1/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  register: (payload) => request("/api/v1/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  me: () => request("/api/v1/auth/me"),
};

export const placesApi = {
  list: () => request("/api/v1/places"),
  search: (payload) => request("/api/v1/search", { method: "POST", body: JSON.stringify(payload) }),
  upsertMine: (data, idempotencyKey) =>
    request("/api/v1/vendor/place", {
      method: "POST",
      body: JSON.stringify(data),
      headers: idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : undefined,
    }),
};

export const offersApi = {
  upsert: (placeId, offer, idempotencyKey) =>
    request(`/api/v1/vendor/place/${placeId}/offer`, {
      method: "PUT",
      body: JSON.stringify(offer),
      headers: idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : undefined,
    }),
};

export const analyticsApi = {
  vendor: () => request("/api/v1/vendor/analytics"),
};

export { ApiError };
