"use client";

import { useState } from "react";
import { submitHackResult } from "@/app/dashboard/actions";

type Activity = "door" | "server" | "decryption";

const titles: Record<Activity, string> = {
  door: "Взлом двери",
  server: "Взлом сервера",
  decryption: "Дешифровка документов",
};

export function HackResultForm({ activity }: { activity: Activity }) {
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    const res = await submitHackResult(activity, fd);
    if ("error" in res && res.error) {
      setMessage(res.error);
      return;
    }
    setMessage("Результат записан в базу.");
    (e.target as HTMLFormElement).reset();
  }

  return (
    <div className="panel">
      <h2 className="mb-4 text-lg font-medium">{titles[activity]}</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-[var(--muted)]">Исход</label>
          <select name="success" className="input">
            <option value="true">Успех</option>
            <option value="false">Провал</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--muted)]">Заметки / детали</label>
          <textarea name="notes" className="input min-h-[100px]" placeholder="Что сработало, время, коды…" />
        </div>
        {message && (
          <p className={`text-sm ${message.includes("записан") ? "text-emerald-400" : "text-red-400"}`}>
            {message}
          </p>
        )}
        <button type="submit" className="btn-primary">
          Сохранить результат
        </button>
      </form>
    </div>
  );
}
