"use client";

import { useState } from "react";
import { submitHackResult } from "@/app/dashboard/actions";
import {
  DECRYPTION_KEY_TO_FILE,
  type DecryptionKey,
  isDecryptionKey,
  pdfUrlForKey,
} from "@/lib/decryption-keys";

export function DecryptionPanel() {
  const [key, setKey] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [resolvedKey, setResolvedKey] = useState<DecryptionKey | null>(null);

  function resetSession() {
    setKey("");
    setMessage(null);
    setDone(false);
    setResolvedKey(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (done) return;
    const trimmed = key.trim();
    if (!isDecryptionKey(trimmed)) {
      setMessage("Неверный ключ.");
      return;
    }
    const pdfPath = pdfUrlForKey(trimmed);
    const fileName = DECRYPTION_KEY_TO_FILE[trimmed];

    setBusy(true);
    const fd = new FormData();
    fd.set("success", "true");
    fd.set("notes", `Дешифровка документов (ключ ${trimmed})`);
    fd.set(
      "details_json",
      JSON.stringify({
        decryptionMinigame: true,
        key: trimmed,
        file: fileName,
      })
    );
    const res = await submitHackResult("decryption", fd);
    setBusy(false);
    if ("error" in res && res.error) {
      setMessage(res.error);
      return;
    }
    setResolvedKey(trimmed);
    setDone(true);
    const opened = window.open(pdfPath, "_blank", "noopener,noreferrer");
    setMessage(
      opened
        ? "Дешифровка успешна. Документ открыт в новой вкладке; результат записан."
        : "Дешифровка успешна. Результат записан. Откройте документ по ссылке ниже (всплывающее окно заблокировано)."
    );
  }

  const pdfHref = resolvedKey ? pdfUrlForKey(resolvedKey) : null;
  const pdfLabel = resolvedKey ? DECRYPTION_KEY_TO_FILE[resolvedKey] : null;

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
        {done && pdfHref && pdfLabel && (
          <p>
            <a
              href={pdfHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-[var(--accent)] underline hover:text-[var(--accent-dim)]"
            >
              {pdfLabel} — открыть снова
            </a>
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn-primary" disabled={busy || done}>
            {busy ? "Проверка…" : "Дешифровать"}
          </button>
          {done && (
            <button type="button" className="btn-secondary" onClick={resetSession}>
              Ввести другой ключ
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
