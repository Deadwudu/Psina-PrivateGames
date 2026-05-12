"use client";

import { useState } from "react";
import { submitTaskReport } from "@/app/dashboard/actions";

export function TaskReportForm() {
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    const res = await submitTaskReport(fd);
    if ("error" in res && res.error) {
      setMessage(res.error);
      return;
    }
    setMessage("Рапорт сохранён в базе.");
    (e.target as HTMLFormElement).reset();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-[var(--muted)]">Ссылка на задачу / ID (необязательно)</label>
        <input name="task_reference" className="input" placeholder="Например: TASK-7" />
      </div>
      <div>
        <label className="mb-1 block text-sm text-[var(--muted)]">Текст рапорта</label>
        <textarea name="content" className="input min-h-[160px]" required placeholder="Содержание рапорта…" />
      </div>
      {message && (
        <p className={`text-sm ${message.includes("сохран") ? "text-emerald-400" : "text-red-400"}`}>{message}</p>
      )}
      <button type="submit" className="btn-primary">
        Сохранить рапорт
      </button>
    </form>
  );
}
