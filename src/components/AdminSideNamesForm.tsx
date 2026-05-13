"use client";

import { useActionState } from "react";
import {
  adminSetSideDisplayNames,
  type AdminSideNamesResult,
} from "@/app/admin/actions";

async function saveSideNames(
  _prev: AdminSideNamesResult | null,
  formData: FormData
): Promise<AdminSideNamesResult | null> {
  return adminSetSideDisplayNames(formData);
}

type Props = {
  initialSideA: string;
  initialSideB: string;
};

export function AdminSideNamesForm({ initialSideA, initialSideB }: Props) {
  const [state, formAction, pending] = useActionState(saveSideNames, null);

  return (
    <form action={formAction} className="panel mb-10 space-y-4">
      <div>
        <h2 className="text-lg font-medium">Названия сторон</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Отображаются при регистрации, на главном экране, в рапортах и в таблицах. В базе по-прежнему используются роли{" "}
          <span className="font-mono text-xs text-[var(--accent-dim)]">side_a</span> и{" "}
          <span className="font-mono text-xs text-[var(--accent-dim)]">side_b</span>.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="side-a-name" className="mb-1 block text-sm text-[var(--muted)]">
            Сторона A (<span className="font-mono text-xs">side_a</span>)
          </label>
          <input
            id="side-a-name"
            name="side_a_name"
            className="input"
            defaultValue={initialSideA}
            required
            maxLength={80}
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="side-b-name" className="mb-1 block text-sm text-[var(--muted)]">
            Сторона B (<span className="font-mono text-xs">side_b</span>)
          </label>
          <input
            id="side-b-name"
            name="side_b_name"
            className="input"
            defaultValue={initialSideB}
            required
            maxLength={80}
            autoComplete="off"
          />
        </div>
      </div>
      {state && "error" in state && <p className="text-sm text-red-400">{state.error}</p>}
      {state && "ok" in state && state.ok && (
        <p className="text-sm text-[var(--accent)]/95">
          Сохранено. Названия обновятся на экранах при следующей загрузке страницы.
        </p>
      )}
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Сохранение…" : "Сохранить названия"}
      </button>
    </form>
  );
}
