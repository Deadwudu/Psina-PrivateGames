"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { registerAction, type AuthActionResult } from "@/app/auth/actions";
import { BrandMark } from "@/components/BrandMark";
import type { GameSide } from "@/lib/game-sides";

async function registerFormAction(
  _prev: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult | null> {
  return (await registerAction(formData)) ?? null;
}

type Props = {
  sides: GameSide[];
};

export function RegisterForm({ sides }: Props) {
  const firstId = sides[0]?.id ?? "";
  const [sideId, setSideId] = useState(firstId);
  const [state, formAction, pending] = useActionState(registerFormAction, null);
  const [banner, setBanner] = useState<"config" | "url" | null>(null);

  useEffect(() => {
    if (firstId && !sideId) setSideId(firstId);
  }, [firstId, sideId]);

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
        <p className="mil-label text-[var(--accent-dim)]">регистрация участника</p>
      </div>
      <div className="panel">
        <h1 className="font-display mb-1 text-xl font-semibold uppercase tracking-wide">Регистрация</h1>
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
        {sides.length === 0 ? (
          <p className="text-sm text-amber-200/90">
            Пока нет ни одной стороны. Попросите администратора открыть панель администратора и добавить стороны.
          </p>
        ) : (
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="side_id" value={sideId} />
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
              <div className="flex flex-col gap-2">
                {sides.map((s) => (
                  <label
                    key={s.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 has-[:checked]:border-[var(--accent)]"
                  >
                    <input
                      type="radio"
                      name="side_radio"
                      checked={sideId === s.id}
                      onChange={() => setSideId(s.id)}
                    />
                    {s.display_name}
                  </label>
                ))}
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
            <button type="submit" className="btn-primary w-full" disabled={pending || !sideId}>
              {pending ? "Создание…" : "Зарегистрироваться"}
            </button>
          </form>
        )}
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
