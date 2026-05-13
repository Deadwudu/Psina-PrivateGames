"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { adminSetVenueStairColor, fetchVenueMapStates, type VenueMapStates } from "@/app/dashboard/venue-map-actions";
import { cycleStairColor, VENUE_STAIRS, type StairColor } from "@/lib/venue-map-stairs";

const COLOR_CLASS: Record<StairColor, string> = {
  gray: "bg-zinc-500 ring-2 ring-white/50 shadow-lg",
  green: "bg-emerald-500 ring-2 ring-emerald-200/80 shadow-lg",
  red: "bg-red-600 ring-2 ring-red-300/80 shadow-lg",
};

type Props = {
  initialStates: VenueMapStates;
  isAdmin: boolean;
};

export function VenueMapClient({ initialStates, isAdmin }: Props) {
  const [states, setStates] = useState<VenueMapStates>(initialStates);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const next = await fetchVenueMapStates();
    setStates(next);
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, 2500);
    return () => clearInterval(id);
  }, [refresh]);

  async function onStairClick(key: string, current: StairColor) {
    const next = cycleStairColor(current);
    setPendingKey(key);
    setHint(null);
    const res = await adminSetVenueStairColor(key, next);
    setPendingKey(null);
    if ("error" in res && res.error) {
      setHint(res.error);
      return;
    }
    await refresh();
  }

  return (
    <div className="space-y-4">
      <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-xl border border-[var(--border)] bg-black/40">
        <Image
          src="/venue/building-floor-plans-marked.png"
          alt="План этажей полигона (разметка лестниц)"
          width={1200}
          height={2200}
          className="h-auto w-full select-none"
          priority
          sizes="(max-width: 1024px) 100vw, 1024px"
        />
        {VENUE_STAIRS.map((s) => {
          const c = states[s.key] ?? "gray";
          const common =
            `absolute box-border rounded-sm transition-transform ${COLOR_CLASS[c]} ${pendingKey === s.key ? "opacity-70" : ""}`;
          const style = {
            left: `${s.leftPct}%`,
            top: `${s.topPct}%`,
            width: `${s.sizePct}%`,
            aspectRatio: "1" as const,
          };
          const numLabel = `${s.displayNum}`;
          if (isAdmin) {
            return (
              <button
                key={s.key}
                type="button"
                title={`${s.label} (#${numLabel})`}
                aria-label={`${s.label}, индикатор ${numLabel}`}
                disabled={pendingKey === s.key}
                onClick={() => onStairClick(s.key, c)}
                className={`${common} cursor-pointer hover:scale-110 hover:brightness-110 active:scale-95 disabled:cursor-wait`}
                style={style}
              >
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[clamp(8px,1.6vw,13px)] font-bold leading-none text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                  {numLabel}
                </span>
              </button>
            );
          }
          return (
            <span
              key={s.key}
              title={`${s.label} (#${numLabel})`}
              className={`${common} pointer-events-none`}
              style={style}
              role="img"
              aria-label={`${s.label}, индикатор ${numLabel}`}
            >
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[clamp(8px,1.6vw,13px)] font-bold leading-none text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                {numLabel}
              </span>
            </span>
          );
        })}
      </div>

      {isAdmin && (
        <p className="text-sm text-[var(--muted)]">
          Нажимайте на квадрат: <span className="text-zinc-400">серый</span> →{" "}
          <span className="text-emerald-400">зелёный</span> → <span className="text-red-400">красный</span> → снова серый.
          Изменения видят все игроки (обновление ~2,5 с).
        </p>
      )}
      {!isAdmin && (
        <p className="text-sm text-[var(--muted)]">
          Индикаторы обновляются автоматически. Цвет задаёт только администратор.
        </p>
      )}
      {hint && <p className="text-sm text-red-400">{hint}</p>}
    </div>
  );
}
