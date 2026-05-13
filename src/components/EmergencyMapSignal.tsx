"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Signal = "green" | "yellow" | "red";

const DURATION_MS = 5000;

/** ~70% зелёный, ~25% жёлтый, ~5% красный (редко). */
function rollSignal(): Signal {
  const r = Math.random();
  if (r < 0.7) return "green";
  if (r < 0.95) return "yellow";
  return "red";
}

const SQUARE_CLASS: Record<Signal, string> = {
  green: "bg-emerald-500 shadow-[0_0_80px_rgba(34,197,94,0.55)]",
  yellow: "bg-amber-400 shadow-[0_0_80px_rgba(251,191,36,0.5)]",
  red: "bg-red-600 shadow-[0_0_80px_rgba(220,38,38,0.55)]",
};

export function EmergencyMapSignal() {
  const [signal, setSignal] = useState<Signal | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const show = useCallback(() => {
    clearTimer();
    setSignal(rollSignal());
    timerRef.current = setTimeout(() => {
      setSignal(null);
      timerRef.current = null;
    }, DURATION_MS);
  }, [clearTimer]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  return (
    <>
      <button
        type="button"
        onClick={show}
        title="Сигнал на 5 секунд (зелёный / жёлтый / красный)"
        aria-label="Показать цветной сигнал на пять секунд"
        className="fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--panel)]/90 text-[var(--accent)] shadow-lg backdrop-blur-sm transition hover:border-[var(--accent-dim)] hover:bg-[var(--panel)] hover:text-[var(--text)]"
      >
        <SquareIcon className="h-5 w-5" />
      </button>

      {signal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-6"
          role="presentation"
          aria-hidden
        >
          <div
            className={`h-[min(42vw,220px)] w-[min(42vw,220px)] max-w-[90vw] rounded-lg border-4 border-white/25 ${SQUARE_CLASS[signal]}`}
          />
        </div>
      )}
    </>
  );
}

function SquareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <rect x="6" y="6" width="12" height="12" rx="1" strokeLinejoin="round" />
    </svg>
  );
}
