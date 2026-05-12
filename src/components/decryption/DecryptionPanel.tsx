"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitHackResult } from "@/app/dashboard/actions";

const CORRECT_KEY = "3007";

export function DecryptionPanel() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (done) return;
    const trimmed = key.trim();
    if (trimmed !== CORRECT_KEY) {
      setMessage("Неверный ключ.");
      return;
    }
    setBusy(true);
    const fd = new FormData();
    fd.set("success", "true");
    fd.set("notes", "Дешифровка документов (ключ шифрования принят)");
    fd.set("details_json", JSON.stringify({ decryptionMinigame: true, keyOk: true }));
    const res = await submitHackResult("decryption", fd);
    setBusy(false);
    if ("error" in res && res.error) {
      setMessage(res.error);
      return;
    }
    setDone(true);
    setMessage("Дешифровка успешна. Результат записан.");
    setTimeout(() => router.push("/dashboard"), 2200);
  }

  return (
    <div className="panel max-w-md">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="enc-key" className="mb-1 block text-sm text-[var(--muted)]">
            Ключ шифрования
          </label>
          <input
            id="enc-key"
            name="key"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className="input font-mono"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            autoComplete="off"
            disabled={done || busy}
            placeholder="Введите ключ"
          />
        </div>
        {message && (
          <p
            className={`text-sm ${
              message.includes("успеш") ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {message}
          </p>
        )}
        <button type="submit" className="btn-primary" disabled={busy || done}>
          {busy ? "Проверка…" : "Дешифровать"}
        </button>
      </form>
    </div>
  );
}
