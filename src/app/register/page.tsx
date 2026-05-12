"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Side = "side_a" | "side_b";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [side, setSide] = useState<Side>("side_a");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        /* Не задаём emailRedirectTo по умолчанию: иначе Supabase валидирует URL
           и даёт «Invalid path», если в Dashboard не добавлен точный callback
           или отключено подтверждение email. Редирект после письма — через Site URL в Supabase. */
        data: {
          display_name: displayName || email.split("@")[0],
          role: side,
        },
      },
    });
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
        <h1 className="mb-1 text-xl font-semibold">Регистрация</h1>
        <p className="mb-6 text-sm text-[var(--muted)]">Выберите сторону мероприятия</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-[var(--muted)]">Отображаемое имя</label>
            <input
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Позывной"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--muted)]">Сторона</label>
            <div className="flex gap-3">
              <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 has-[:checked]:border-[var(--accent)]">
                <input
                  type="radio"
                  name="side"
                  checked={side === "side_a"}
                  onChange={() => setSide("side_a")}
                />
                Сторона А
              </label>
              <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 has-[:checked]:border-[var(--accent)]">
                <input
                  type="radio"
                  name="side"
                  checked={side === "side_b"}
                  onChange={() => setSide("side_b")}
                />
                Сторона Б
              </label>
            </div>
          </div>
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Создание…" : "Зарегистрироваться"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-[var(--accent)] hover:underline">
            Вход
          </Link>
        </p>
      </div>
    </div>
  );
}
