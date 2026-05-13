"use client";

import { useActionState } from "react";
import {
  adminCreateSide,
  adminUpdateSide,
  adminDeleteSide,
  type AdminSideMutationResult,
} from "@/app/admin/actions";
import type { GameSide } from "@/lib/game-sides";

async function createSideAct(
  _p: AdminSideMutationResult | null,
  formData: FormData
): Promise<AdminSideMutationResult | null> {
  return (await adminCreateSide(formData)) ?? null;
}

async function updateSideAct(
  _p: AdminSideMutationResult | null,
  formData: FormData
): Promise<AdminSideMutationResult | null> {
  return (await adminUpdateSide(formData)) ?? null;
}

async function deleteSideAct(
  _p: AdminSideMutationResult | null,
  formData: FormData
): Promise<AdminSideMutationResult | null> {
  return (await adminDeleteSide(formData)) ?? null;
}

function SideRowEditor({ s }: { s: GameSide }) {
  const [updState, updAction, updPending] = useActionState(updateSideAct, null);
  const [delState, delAction, delPending] = useActionState(deleteSideAct, null);

  const lineErr =
    updState && "error" in updState
      ? updState.error
      : delState && "error" in delState
        ? delState.error
        : null;

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--panel)]/40 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <form action={updAction} className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-end">
          <input type="hidden" name="side_id" value={s.id} />
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-xs text-[var(--muted)]">Название</label>
            <input
              name="display_name"
              className="input w-full"
              defaultValue={s.display_name}
              required
              maxLength={120}
              autoComplete="off"
            />
          </div>
          <button type="submit" className="btn-secondary shrink-0 px-4 py-2 text-sm" disabled={updPending}>
            {updPending ? "…" : "Сохранить"}
          </button>
        </form>
        <form
          action={delAction}
          className="shrink-0 self-start sm:self-auto"
          onSubmit={(e) => {
            if (
              !confirm(
                `Удалить сторону «${s.display_name}»? Это возможно только если на ней нет игроков.`
              )
            ) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="side_id" value={s.id} />
          <button
            type="submit"
            disabled={delPending}
            className="rounded-lg border border-red-900/60 px-3 py-2 text-sm text-red-300 hover:bg-red-950/50 disabled:opacity-50"
          >
            {delPending ? "…" : "Удалить"}
          </button>
        </form>
      </div>
      {lineErr && <p className="text-sm text-red-400">{lineErr}</p>}
    </li>
  );
}

type Props = {
  initialSides: GameSide[];
};

export function AdminGameSidesPanel({ initialSides }: Props) {
  const [createState, createAction, createPending] = useActionState(createSideAct, null);

  return (
    <section className="panel mb-10 space-y-6">
      <div>
        <h2 className="text-lg font-medium">Стороны</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Названия показываются при регистрации и у игроков. Можно добавить сколько угодно сторон. Удалить сторону можно
          только если на ней нет участников.
        </p>
      </div>

      <ul className="space-y-3">
        {initialSides.map((s) => (
          <SideRowEditor key={s.id} s={s} />
        ))}
      </ul>

      {initialSides.length === 0 && (
        <p className="text-sm text-amber-200/90">Сторон пока нет — добавьте первую ниже.</p>
      )}

      <form action={createAction} className="space-y-3 border-t border-[var(--border)] pt-6">
        <h3 className="text-sm font-medium text-[var(--muted)]">Новая сторона</h3>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label htmlFor="new-side-name" className="mb-1 block text-sm text-[var(--muted)]">
              Название
            </label>
            <input
              id="new-side-name"
              name="display_name"
              className="input w-full"
              placeholder="Например, «Север»"
              maxLength={120}
              autoComplete="off"
            />
          </div>
          <button type="submit" className="btn-primary shrink-0" disabled={createPending}>
            {createPending ? "Добавление…" : "Добавить сторону"}
          </button>
        </div>
        {createState && "error" in createState && <p className="text-sm text-red-400">{createState.error}</p>}
        {createState && "ok" in createState && createState.ok && (
          <p className="text-sm text-emerald-400/90">Сторона добавлена.</p>
        )}
      </form>
    </section>
  );
}
