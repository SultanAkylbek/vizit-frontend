type VizitSession = {
  id?: string;
  role?: string;
  name?: string;
  email?: string;
};

type AuthSnapshot = {
  email: string;
  password: string;
  name: string;
  isRegister: boolean;
};

const SESSION_KEY = "vizit_session";
const TOKEN_KEY = "vizit_token";

let isInstalled = false;
let isSyncing = false;
let lastSnapshot: AuthSnapshot = {
  email: "",
  password: "",
  name: "",
  isRegister: false,
};

function getSupabaseConfig() {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};
  return {
    url: env.VITE_SUPABASE_URL || env.VITE_SUPABASE_PROJECT_URL || "",
    anonKey: env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_KEY || "",
  };
}

function parseSession(value: string): VizitSession | null {
  try {
    return JSON.parse(value) as VizitSession;
  } catch {
    return null;
  }
}

function readAuthSnapshot(): AuthSnapshot {
  const inputs = Array.from(document.querySelectorAll<HTMLInputElement>("input"));
  const emailInput = inputs.find((input) => input.type === "email");
  const passwordInput = inputs.find((input) => input.type === "password");
  const textInputs = inputs.filter((input) => input.type === "text" || input.type === "");
  const nameInput = textInputs.find((input) => input.value.trim());

  if (emailInput?.value) lastSnapshot.email = emailInput.value.trim();
  if (passwordInput?.value) lastSnapshot.password = passwordInput.value;
  if (nameInput?.value) lastSnapshot.name = nameInput.value.trim();

  lastSnapshot.isRegister = Boolean(nameInput) || inputs.length >= 3;
  return { ...lastSnapshot };
}

async function callSupabaseAuth(path: string, body: Record<string, unknown>) {
  const { url, anonKey } = getSupabaseConfig();

  if (!url || !anonKey) {
    throw new Error("Supabase env is missing: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.");
  }

  const res = await fetch(`${url.replace(/\/$/, "")}/auth/v1/${path}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error_description || data?.msg || data?.message || "Supabase auth request failed";
    throw new Error(message);
  }

  return data;
}

function persistRealSession(data: any, fallback: VizitSession) {
  const authUser = data?.user || fallback;
  const token = data?.access_token || data?.session?.access_token || "";
  const metadata = authUser?.user_metadata || {};
  const role = metadata.role || metadata.user_role || fallback.role || "USER";
  const displayName = metadata.name || fallback.name || authUser?.email?.split("@")[0] || fallback.email?.split("@")[0] || "User";
  const email = authUser?.email || fallback.email || "";

  if (!token) {
    throw new Error("Supabase did not return access_token. Check whether email confirmation is enabled for new users.");
  }

  const realSession: VizitSession = {
    id: authUser?.id || fallback.id,
    role,
    name: displayName,
    email,
  };

  isSyncing = true;
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(SESSION_KEY, JSON.stringify(realSession));
  } finally {
    isSyncing = false;
  }

  return realSession;
}

async function syncSupabaseSession(rawValue: string, snapshot: AuthSnapshot) {
  if (isSyncing) return;

  const localSession = parseSession(rawValue);
  if (!localSession || localSession.role === "GUEST" || !localSession.email) return;
  if (!snapshot.password) return;

  isSyncing = true;
  try {
    const role = localSession.role === "VENDOR" ? "VENDOR" : "USER";
    const name = snapshot.name || localSession.name || localSession.email.split("@")[0];
    const isRegister = snapshot.isRegister || role === "VENDOR";

    const data = isRegister
      ? await callSupabaseAuth("signup", {
          email: localSession.email,
          password: snapshot.password,
          data: { role, name },
        })
      : await callSupabaseAuth("token?grant_type=password", {
          email: localSession.email,
          password: snapshot.password,
        });

    isSyncing = false;
    const realSession = persistRealSession(data, { ...localSession, role, name });

    if (realSession.id !== localSession.id || realSession.role !== localSession.role) {
      window.location.reload();
    }
  } catch (error) {
    isSyncing = false;
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
    const message = error instanceof Error ? error.message : "Supabase auth failed";
    window.alert(message);
    window.location.reload();
  }
}

export function installVizitSupabaseAuthBridge() {
  if (isInstalled || typeof window === "undefined") return;
  isInstalled = true;

  document.addEventListener("input", readAuthSnapshot, true);
  document.addEventListener("focusin", readAuthSnapshot, true);
  document.addEventListener("click", readAuthSnapshot, true);

  const originalSetItem = localStorage.setItem.bind(localStorage);
  const originalRemoveItem = localStorage.removeItem.bind(localStorage);

  localStorage.setItem = (key: string, value: string) => {
    const snapshot = readAuthSnapshot();
    originalSetItem(key, value);

    if (key === SESSION_KEY && !isSyncing) {
      void syncSupabaseSession(value, snapshot);
    }
  };

  localStorage.removeItem = (key: string) => {
    originalRemoveItem(key);
    if (key === SESSION_KEY) {
      originalRemoveItem(TOKEN_KEY);
    }
  };

  const existing = localStorage.getItem(SESSION_KEY);
  if (!existing) {
    localStorage.removeItem(TOKEN_KEY);
  }
}
