"use client";

import { useActionState } from "react";
import { adminAssignTaskToSide, type AdminTaskResult } from "@/app/admin/actions";

async function sideAssignAction(
  _prev: AdminTaskResult | null,
  formData: FormData
): Promise<AdminTaskResult | null> {
  return (await adminAssignTaskToSide(formData)) ?? null;
}

export function AdminAssignSideTaskForm() {
  const [state, formAction, pending] = useActionState(sideAssignAction, null);

  return (
    <form action={formAction} className="panel mb-10 space-y-4">
      <h2 className="text-lg font-medium">Выдать задачу всей стороне</h2>
      <p className="text-sm text-[var(--muted)]">
        У каждого игрока выбранной стороны появится такая же личная задача. Рапорт по ней каждый отправляет сам — повторно по той же задаче нельзя.
      </p>
      <div>
        <span className="mb-2 block text-sm text-[var(--muted)]">Сторона</span>
        <div className="flex flex-wrap gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="radio" name="target_side" value="side_a" required className="accent-[var(--accent)]" />
            Сторона А
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="radio" name="target_side" value="side_b" className="accent-[var(--accent)]" />
            Сторона Б
          </label>
        </div>
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
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Выдача…" : "Выдать всей стороне"}
      </button>
    </form>
  );
}
