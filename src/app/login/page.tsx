"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [missingEnv, setMissingEnv] = useState(false);

  useEffect(() => {
    const noPublicEnv =
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    const fromQuery = new URLSearchParams(window.location.search).get("missing") === "supabase";
    if (noPublicEnv || fromQuery) setMissingEnv(true);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (missingEnv) return;
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    window.location.href = "/dashboard";
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <div className="panel">
        <h1 className="mb-1 text-xl font-semibold">Вход</h1>
        <p className="mb-6 text-sm text-[var(--muted)]">Инструмент мероприятия Private Games</p>
        {missingEnv && (
          <div className="mb-4 rounded-lg border border-amber-600/50 bg-amber-950/40 px-3 py-2 text-sm text-amber-100">
            Не заданы переменные Supabase на хостинге. В Vercel откройте{" "}
            <strong>Settings → Environment Variables</strong> и добавьте для{" "}
            <strong>Production</strong>: <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> и{" "}
            <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, затем{" "}
            <strong>Redeploy</strong>.
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-[var(--muted)]">Email</label>
            <input
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--muted)]">Пароль</label>
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading || missingEnv}>
            {loading ? "Вход…" : "Войти"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          Нет аккаунта?{" "}
          <Link href="/register" className="text-[var(--accent)] hover:underline">
            Регистрация
          </Link>
        </p>
      </div>
    </div>
  );
}
