// src/auth/authApi.ts
// Real authentication against Supabase Auth (the actual identity backend this
// project already ships an anon key for — see .env.example). No mocked
// responses, no localStorage sniffing: every call here hits a live endpoint.

export const TOKEN_KEY = "vizit_token";
const REFRESH_KEY = "vizit_refresh_token";
const EXPIRES_KEY = "vizit_token_expires_at";
export const SESSION_KEY = "vizit_session";

// Prefer env vars (see .env.example). Fall back to the project values that
// were already committed to this repo previously — they are a Supabase
// *anon* key, which is meant to be public/client-side (access is enforced by
// RLS on the Supabase project, not by hiding this value).
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://tmovjmitaxgzondtojbf.supabase.co";
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4eXBkZXduaHBjbGF3ZHNqaGVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MDE5OTAsImV4cCI6MjA5NDA3Nzk5MH0.sVqN8BlrjybDJk1yKTlvSQz4NEwMNITvi0o8x_9Ec-w";

export class AuthError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "AuthError";
  }
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
}

interface SupabaseTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: {
    id: string;
    email?: string;
    user_metadata?: { name?: string; role?: string };
  };
}

async function supabaseAuthRequest(
  path: string,
  body: Record<string, unknown>
): Promise<SupabaseTokenResponse> {
  const res = await fetch(`${SUPABASE_URL.replace(/\/$/, "")}/auth/v1/${path}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      data?.error_description || data?.msg || data?.message || "Ошибка авторизации";
    throw new AuthError(res.status, message);
  }

  return data as SupabaseTokenResponse;
}

function toAuthUser(raw: NonNullable<SupabaseTokenResponse["user"]>): AuthUser {
  return {
    id: raw.id,
    email: raw.email ?? "",
    name: raw.user_metadata?.name || raw.email?.split("@")[0] || "Пользователь",
    role: raw.user_metadata?.role || "USER",
  };
}

function persistSession(data: SupabaseTokenResponse): AuthSession {
  if (!data.access_token || !data.user) {
    // Happens when the Supabase project requires email confirmation before
    // a session is issued — there is no token to store yet.
    throw new AuthError(
      202,
      "Регистрация прошла, но нужно подтвердить email — проверьте почту и войдите после подтверждения."
    );
  }

  const user = toAuthUser(data.user);
  const expiresAt = Date.now() + (data.expires_in ?? 3600) * 1000;

  localStorage.setItem(TOKEN_KEY, data.access_token);
  if (data.refresh_token) localStorage.setItem(REFRESH_KEY, data.refresh_token);
  localStorage.setItem(EXPIRES_KEY, String(expiresAt));
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));

  return { user, accessToken: data.access_token };
}

export const authApi = {
  async register(email: string, password: string, name: string): Promise<AuthSession> {
    const data = await supabaseAuthRequest("signup", {
      email,
      password,
      data: { name, role: "USER" },
    });
    return persistSession(data);
  },

  async login(email: string, password: string): Promise<AuthSession> {
    const data = await supabaseAuthRequest("token?grant_type=password", {
      email,
      password,
    });
    return persistSession(data);
  },

  /** Silently refreshes the access token using the stored refresh token. */
  async refresh(): Promise<AuthSession | null> {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) return null;
    try {
      const data = await supabaseAuthRequest("token?grant_type=refresh_token", {
        refresh_token: refreshToken,
      });
      return persistSession(data);
    } catch {
      return null;
    }
  },

  /** Reads whatever session is currently on disk, without hitting the network. */
  getStoredSession(): AuthSession | null {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const rawUser = localStorage.getItem(SESSION_KEY);
      if (!token || !rawUser) return null;
      return { accessToken: token, user: JSON.parse(rawUser) as AuthUser };
    } catch {
      return null;
    }
  },

  isStoredTokenExpired(): boolean {
    const expiresAt = Number(localStorage.getItem(EXPIRES_KEY) ?? 0);
    return !expiresAt || Date.now() >= expiresAt;
  },

  async logout(): Promise<void> {
    const token = localStorage.getItem(TOKEN_KEY);
    // Best-effort server-side revocation of the refresh token. Logout must
    // still fully clear local state even if this network call fails
    // (offline, token already expired, etc).
    if (token) {
      try {
        await fetch(`${SUPABASE_URL.replace(/\/$/, "")}/auth/v1/logout`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${token}`,
          },
        });
      } catch {
        /* ignore — we clear local state below regardless */
      }
    }

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(EXPIRES_KEY);
    localStorage.removeItem(SESSION_KEY);

    // This app authenticates with a bearer token in the Authorization header,
    // not cookies, so there is no auth cookie to clear. If a future backend
    // change introduces a cookie-based session, clear it here too.
  },
};
