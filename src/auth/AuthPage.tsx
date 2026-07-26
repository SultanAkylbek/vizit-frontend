import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../Layout";
import { useAuth } from "../auth/useAuth";
import { AuthError } from "../auth/authApi";

export default function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "err">("idle");
  const [errMsg, setErrMsg] = useState("");
  const [notice, setNotice] = useState("");

  const canSubmit =
    email.trim() !== "" &&
    password.trim() !== "" &&
    (mode === "login" || name.trim() !== "") &&
    status !== "loading";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("loading");
    setErrMsg("");
    setNotice("");

    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, name.trim());
      }
      navigate("/");
    } catch (err) {
      if (err instanceof AuthError && err.status === 202) {
        // Real, non-error outcome: Supabase requires email confirmation.
        setNotice(err.message);
        setStatus("idle");
        return;
      }
      const msg = err instanceof Error ? err.message : "Ошибка авторизации";
      setErrMsg(msg);
      setStatus("err");
    }
  }

  return (
    <Layout>
      <div className="mx-auto max-w-sm px-4 py-16">
        <h1 className="mb-1 text-2xl font-semibold text-[#ececec]">
          {mode === "login" ? "Вход" : "Регистрация"}
        </h1>
        <p className="mb-6 text-sm text-white/50">
          {mode === "login"
            ? "Войдите, чтобы управлять своим заведением в VIZIT AI."
            : "Создайте аккаунт, чтобы добавить своё заведение."}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === "register" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ваше имя"
              autoComplete="name"
              className="rounded-2xl border border-white/10 bg-[#2a2a2a] px-4 py-2.5 text-sm text-[#ececec] placeholder:text-white/40 focus:outline-none focus:border-white/25"
            />
          )}
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            autoComplete="email"
            className="rounded-2xl border border-white/10 bg-[#2a2a2a] px-4 py-2.5 text-sm text-[#ececec] placeholder:text-white/40 focus:outline-none focus:border-white/25"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Пароль"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="rounded-2xl border border-white/10 bg-[#2a2a2a] px-4 py-2.5 text-sm text-[#ececec] placeholder:text-white/40 focus:outline-none focus:border-white/25"
          />

          {notice && (
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white/70">
              {notice}
            </div>
          )}
          {status === "err" && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-200">
              {errMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className={`mt-1 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              canSubmit ? "bg-white text-black hover:bg-white/90" : "bg-white/10 text-white/40"
            }`}
          >
            {status === "loading"
              ? "Секунду..."
              : mode === "login"
                ? "Войти"
                : "Создать аккаунт"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode((m) => (m === "login" ? "register" : "login"));
            setErrMsg("");
            setNotice("");
            setStatus("idle");
          }}
          className="mt-4 text-sm text-white/50 hover:text-white/80 transition-colors"
        >
          {mode === "login" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
        </button>
      </div>
    </Layout>
  );
}
