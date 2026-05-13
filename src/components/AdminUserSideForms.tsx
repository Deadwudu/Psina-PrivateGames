"use client";

import { useActionState } from "react";
import { adminSetUserSide, type AdminSetUserSideResult } from "@/app/admin/actions";
import type { GameSide } from "@/lib/game-sides";

export type AdminUserRow = {
  id: string;
  username: string;
  is_admin: boolean;
  side_id: string | null;
};

type Props = {
  users: AdminUserRow[];
  sides: GameSide[];
};

async function setSideAct(
  _prev: AdminSetUserSideResult | null,
  formData: FormData
): Promise<AdminSetUserSideResult | null> {
  return (await adminSetUserSide(formData)) ?? null;
}

function UserSideRow({ u, sides }: { u: AdminUserRow; sides: GameSide[] }) {
  const [state, formAction, pending] = useActionState(setSideAct, null);

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--panel)]/30 p-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="font-medium">{u.username}</span>
      <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <input type="hidden" name="user_id" value={u.id} />
        <select
          name="side_id"
          defaultValue={u.side_id ?? sides[0]?.id}
          required
          className="input min-w-[200px] py-2 text-sm"
          disabled={pending}
        >
          {sides.map((s) => (
            <option key={s.id} value={s.id}>
              {s.display_name}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-secondary px-4 py-2 text-sm" disabled={pending}>
          {pending ? "…" : "Сохранить"}
        </button>
        {state && "error" in state && <p className="w-full text-sm text-red-400 sm:w-auto">{state.error}</p>}
        {state && "ok" in state && state.ok && (
          <p className="w-full text-xs text-emerald-400/90 sm:w-auto">Сохранено. Участнику нужен повторный вход.</p>
        )}
      </form>
    </li>
  );
}

export function AdminUserSideForms({ users, sides }: Props) {
  const players = users.filter((u) => !u.is_admin);

  return (
    <section className="panel mb-10 space-y-4">
      <div>
        <h2 className="text-lg font-medium">Стороны игроков</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Смена стороны в базе не обновляет cookie участника: попросите человека{" "}
          <strong className="font-medium text-[var(--text)]">выйти и войти снова</strong>, иначе в интерфейсе останется
          старая сторона до нового входа.
        </p>
      </div>

      {players.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Нет игроков (только администраторы).</p>
      ) : sides.length === 0 ? (
        <p className="text-sm text-amber-200/90">Сначала создайте хотя бы одну сторону выше.</p>
      ) : (
        <ul className="space-y-3">
          {players.map((u) => (
            <UserSideRow key={u.id} u={u} sides={sides} />
          ))}
        </ul>
      )}
    </section>
  );
}
