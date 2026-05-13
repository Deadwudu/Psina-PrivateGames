"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { loginAction, type AuthActionResult } from "@/app/auth/actions";
import { BrandMark } from "@/components/BrandMark";

async function loginFormAction(
  _prev: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult | null> {
  return (await loginAction(formData)) ?? null;
}

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginFormAction, null);
  const [banner, setBanner] = useState<"config" | "url" | null>(null);

  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get("missing");
    if (m === "config") setBanner("config");
    else if (m === "supabase" || !process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) setBanner("url");
  }, []);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-14">
      <div className="mb-10 text-center">
        <div className="mb-4 flex justify-center">
          <BrandMark />
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-[var(--muted)]">доступ к мероприятию</p>
      </div>
      <div className="panel">
        <h1 className="mb-1 text-xl font-semibold tracking-tight">Вход</h1>
        <p className="mb-6 text-sm text-[var(--muted)]">Введите позывной и пароль</p>
        {banner === "config" && (
          <div className="mb-4 rounded-lg border border-amber-600/50 bg-amber-950/40 px-3 py-2 text-sm text-amber-100">
            Не заданы серверные переменные. В Vercel (или в <code className="text-xs">.env.local</code>) укажите:{" "}
            <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
            <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code> (Settings → API → service_role) и{" "}
            <code className="text-xs">SESSION_SECRET</code> (случайная строка ≥16 символов), затем{" "}
            <strong>Redeploy</strong>.
          </div>
        )}
        {banner === "url" && (
          <div className="mb-4 rounded-lg border border-amber-600/50 bg-amber-950/40 px-3 py-2 text-sm text-amber-100">
            Не задан <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code>. Добавьте URL проекта Supabase в
            переменные окружения и пересоберите проект.
          </div>
        )}
        <form action={formAction} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-[var(--muted)]">Позывной</label>
            <input
              className="input"
              name="username"
              type="text"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--muted)]">Пароль</label>
            <input
              className="input"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={pending}>
            {pending ? "Вход…" : "Войти"}
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
