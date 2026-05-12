"use client";

import { useState } from "react";
import { submitTaskReport } from "@/app/dashboard/actions";

export type TaskOption = { id: string; title: string };

export function TaskReportForm({ tasks }: { tasks: TaskOption[] }) {
  const [message, setMessage] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    fd.set("task_completed", completed ? "true" : "false");
    const res = await submitTaskReport(fd);
    if ("error" in res && res.error) {
      setMessage(res.error);
      return;
    }
    setMessage("Рапорт сохранён.");
    setCompleted(false);
    (e.target as HTMLFormElement).reset();
  }

  if (tasks.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted)]">
        У вас пока нет выданных задач — рапорт можно отправить после того, как администратор назначит задание.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-4">
      <div>
        <label className="mb-1 block text-sm text-[var(--muted)]">Задача</label>
        <select name="user_task_id" className="input w-full" required defaultValue="">
          <option value="" disabled>
            Выберите задачу…
          </option>
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-lg border border-[var(--border)] px-3 py-2">
        <span className="text-sm">Задание выполнено</span>
        <button
          type="button"
          role="switch"
          aria-checked={completed}
          onClick={() => setCompleted((v) => !v)}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
            completed ? "bg-[var(--accent)]" : "bg-[var(--border)]"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
              completed ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <div>
        <label className="mb-1 block text-sm text-[var(--muted)]">Комментарий</label>
        <textarea
          name="rapport_comment"
          className="input min-h-[120px] w-full"
          placeholder="Сообщение по задаче: что сделано, замечания…"
        />
      </div>

      {message && (
        <p className={`text-sm ${message.includes("сохран") ? "text-emerald-400" : "text-red-400"}`}>{message}</p>
      )}
      <button type="submit" className="btn-primary">
        Отправить рапорт
      </button>
    </form>
  );
}
