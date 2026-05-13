"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { registerAction, type AuthActionResult } from "@/app/auth/actions";
import { BrandMark } from "@/components/BrandMark";

type Side = "side_a" | "side_b";

async function registerFormAction(
  _prev: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult | null> {
  return (await registerAction(formData)) ?? null;
}

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerFormAction, null);
  const [side, setSide] = useState<Side>("side_a");
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
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-[var(--muted)]">новый участник</p>
      </div>
      <div className="panel">
        <h1 className="mb-1 text-xl font-semibold tracking-tight">Регистрация</h1>
        <p className="mb-6 text-sm text-[var(--muted)]">Выберите сторону мероприятия</p>
        {banner === "config" && (
          <div className="mb-4 rounded-lg border border-amber-600/50 bg-amber-950/40 px-3 py-2 text-sm text-amber-100">
            Не заданы серверные переменные. Нужны <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
            <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code> и{" "}
            <code className="text-xs">SESSION_SECRET</code> (≥16 символов).
          </div>
        )}
        {banner === "url" && (
          <div className="mb-4 rounded-lg border border-amber-600/50 bg-amber-950/40 px-3 py-2 text-sm text-amber-100">
            Не задан <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code>.
          </div>
        )}
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="role" value={side} />
          <div>
            <label className="mb-1 block text-sm text-[var(--muted)]">Позывной</label>
            <input
              className="input"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="Уникальный логин"
              required
              minLength={2}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--muted)]">Сторона</label>
            <div className="flex gap-3">
              <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 has-[:checked]:border-[var(--accent)]">
                <input
                  type="radio"
                  name="side_radio"
                  checked={side === "side_a"}
                  onChange={() => setSide("side_a")}
                />
                Сторона А
              </label>
              <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 has-[:checked]:border-[var(--accent)]">
                <input
                  type="radio"
                  name="side_radio"
                  checked={side === "side_b"}
                  onChange={() => setSide("side_b")}
                />
                Сторона Б
              </label>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--muted)]">Пароль</label>
            <input
              className="input"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
            />
          </div>
          {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={pending}>
            {pending ? "Создание…" : "Зарегистрироваться"}
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
