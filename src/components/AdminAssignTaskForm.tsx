"use client";

import { useActionState } from "react";
import { adminAssignTask, type AdminTaskResult } from "@/app/admin/actions";

type UserOption = { id: string; username: string; role: string };

async function assignAction(
  _prev: AdminTaskResult | null,
  formData: FormData
): Promise<AdminTaskResult | null> {
  return (await adminAssignTask(formData)) ?? null;
}

export function AdminAssignTaskForm({ users }: { users: UserOption[] }) {
  const [state, formAction, pending] = useActionState(assignAction, null);

  return (
    <form action={formAction} className="panel mb-10 space-y-4">
      <h2 className="text-lg font-medium">Выдать задачу участнику</h2>
      <p className="text-sm text-[var(--muted)]">
        Задачи создаются только здесь. У участника на странице «Мои задачи» отобразятся заголовок и текст.
      </p>
      <div>
        <label className="mb-1 block text-sm text-[var(--muted)]">Участник</label>
        <select name="user_id" className="input w-full" required defaultValue="">
          <option value="" disabled>
            Выберите позывной…
          </option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.username} ({u.role})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm text-[var(--muted)]">Заголовок</label>
        <input name="title" className="input w-full" placeholder="Кратко, что сделать" required />
      </div>
      <div>
        <label className="mb-1 block text-sm text-[var(--muted)]">Текст задания</label>
        <textarea
          name="description"
          className="input min-h-[120px] w-full"
          placeholder="Полный текст: условия, подсказки, что сдать…"
          required
        />
      </div>
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Сохранение…" : "Выдать задачу"}
      </button>
    </form>
  );
}
