"use client";

import { useActionState } from "react";
import { adminAssignTaskToSide, type AdminTaskResult } from "@/app/admin/actions";
import type { GameSide } from "@/lib/game-sides";

async function sideAssignAction(
  _prev: AdminTaskResult | null,
  formData: FormData
): Promise<AdminTaskResult | null> {
  return (await adminAssignTaskToSide(formData)) ?? null;
}

type Props = {
  sides: GameSide[];
};

export function AdminAssignSideTaskForm({ sides }: Props) {
  const [state, formAction, pending] = useActionState(sideAssignAction, null);

  return (
    <form action={formAction} className="panel mb-10 space-y-4">
      <h2 className="text-lg font-medium">Выдать задачу всей стороне</h2>
      <p className="text-sm text-[var(--muted)]">
        У каждого игрока выбранной стороны появится такая же личная задача. Рапорт один на всю выдачу: пока не отмечен успех,
        любой участник может отправить или заменить рапорт; после «выполнено» запись закрывается.
      </p>
      <div>
        <span className="mb-2 block text-sm text-[var(--muted)]">Сторона</span>
        {sides.length === 0 ? (
          <p className="text-sm text-amber-200/90">Сначала добавьте стороны в блоке выше.</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {sides.map((s) => (
              <label key={s.id} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="target_side_id"
                  value={s.id}
                  required
                  className="accent-[var(--accent)]"
                />
                {s.display_name}
              </label>
            ))}
          </div>
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm text-[var(--muted)]">Заголовок</label>
        <input name="side_title" className="input w-full" placeholder="Кратко, что сделать" required />
      </div>
      <div>
        <label className="mb-1 block text-sm text-[var(--muted)]">Текст задания</label>
        <textarea
          name="side_description"
          className="input min-h-[120px] w-full"
          placeholder="Полный текст: условия, подсказки, что сдать…"
          required
        />
      </div>
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button type="submit" className="btn-primary" disabled={pending || sides.length === 0}>
        {pending ? "Выдача…" : "Выдать всей стороне"}
      </button>
    </form>
  );
}
