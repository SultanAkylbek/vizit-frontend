// src/auth/AuthContext.tsx
import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { authApi, type AuthSession, type AuthUser } from "./authApi";

export interface AuthContextValue {
  user: AuthUser | null;
  status: "restoring" | "authenticated" | "guest";
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<"restoring" | "authenticated" | "guest">("restoring");

  // Real session restoration: use whatever is on disk if the token hasn't
  // expired yet; otherwise try a real refresh call before giving up.
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      const stored = authApi.getStoredSession();
      if (!stored) {
        if (!cancelled) setStatus("guest");
        return;
      }

      if (!authApi.isStoredTokenExpired()) {
        if (!cancelled) {
          setUser(stored.user);
          setStatus("authenticated");
        }
        return;
      }

      const refreshed = await authApi.refresh();
      if (cancelled) return;
      if (refreshed) {
        setUser(refreshed.user);
        setStatus("authenticated");
      } else {
        setUser(null);
        setStatus("guest");
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const applySession = useCallback((session: AuthSession) => {
    setUser(session.user);
    setStatus("authenticated");
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const session = await authApi.login(email, password);
      applySession(session);
    },
    [applySession]
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const session = await authApi.register(email, password, name);
      applySession(session);
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setStatus("guest");
  }, []);

  const value = useMemo(
    () => ({ user, status, login, register, logout }),
    [user, status, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };

