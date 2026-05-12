"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { submitHackResult } from "@/app/dashboard/actions";

const COLOR: Record<string, { name: string; bg: string; border: string; text: string }> = {
  З: { name: "Зелёный", bg: "bg-emerald-500", border: "border-emerald-400", text: "text-emerald-950" },
  Ж: { name: "Жёлтый", bg: "bg-amber-400", border: "border-amber-300", text: "text-amber-950" },
  К: { name: "Красный", bg: "bg-red-500", border: "border-red-400", text: "text-red-950" },
};

type Letter = keyof typeof COLOR;

const LETTERS: Letter[] = ["З", "Ж", "К"];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const TARGET_KEY = "WYZPAL";
const LINE = 28;
const COL_H = 140;
const CENTER = COL_H / 2 - LINE / 2;

type StripCell = { ch: string; green: boolean };

function buildStrip(target: string): StripCell[] {
  const len = 48;
  const out: StripCell[] = [];
  for (let i = 0; i < len; i++) {
    if (i === 22) {
      out.push({ ch: target, green: true });
      continue;
    }
    const c = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    out.push({ ch: c, green: false });
  }
  return out;
}

export function DoorHackGame() {
  const router = useRouter();
  const [phase, setPhase] = useState<"panel" | "wires" | "matrix" | "victory">("panel");
  const [panelSlide, setPanelSlide] = useState(false);

  const wirePuzzle = useMemo(() => {
    const wiresOrder = shuffle([...LETTERS]);
    const portsOrder = shuffle([...LETTERS]);
    const hints = wiresOrder.map((w, i) => ({ wire: w, port: portsOrder[i] }));
    const portSlots = wiresOrder.map((_, i) => ({
      portLetter: portsOrder[i],
      expectsWire: wiresOrder[i],
    }));
    return { wiresOrder, portSlots, hints };
  }, []);

  const [wired, setWired] = useState<Record<string, string | null>>({});
  const dragWire = useRef<Letter | null>(null);
  const [tapWire, setTapWire] = useState<Letter | null>(null);

  const keyChars = useMemo(() => TARGET_KEY.split(""), []);
  const strips = useMemo(() => keyChars.map((c) => buildStrip(c)), [keyChars]);
  const [offsets, setOffsets] = useState(() => keyChars.map(() => Math.random() * 200));
  const [stopped, setStopped] = useState(() => keyChars.map(() => false));
  const [picked, setPicked] = useState<(string | null)[]>(() => keyChars.map(() => null));
  const rafRef = useRef<number | null>(null);
  const [matrixHint, setMatrixHint] = useState<string | null>(null);
  const hackSent = useRef(false);

  const tick = useCallback(() => {
    setOffsets((prev) =>
      prev.map((o, i) => {
        if (stopped[i]) return o;
        const stripLen = strips[i].length * LINE;
        let n = o + 1.2;
        if (n > stripLen) n = 0;
        return n;
      })
    );
    rafRef.current = requestAnimationFrame(tick);
  }, [stopped, strips]);

  useEffect(() => {
    if (phase !== "matrix") return;
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [phase, tick]);

  function charAtCenter(col: number): string {
    const strip = strips[col];
    const o = offsets[col];
    const idx = Math.floor((o + CENTER) / LINE) % strip.length;
    return strip[idx]?.ch ?? "?";
  }

  function onColumnClick(col: number) {
    if (stopped[col]) {
      setStopped((s) => {
        const n = [...s];
        n[col] = false;
        return n;
      });
      setPicked((p) => {
        const n = [...p];
        n[col] = null;
        return n;
      });
      setMatrixHint(null);
      return;
    }
    const ch = charAtCenter(col);
    const ok = ch === keyChars[col];
    setStopped((s) => {
      const n = [...s];
      n[col] = true;
      return n;
    });
    setPicked((p) => {
      const n = [...p];
      n[col] = ch;
      return n;
    });
    if (!ok) setMatrixHint(`Колонка ${col + 1}: в центре «${ch}», нужна «${keyChars[col]}». Нажмите колонку ещё раз, чтобы снова крутить.`);
    else setMatrixHint(null);
  }

  const matrixDone = stopped.every(Boolean) && keyChars.every((t, i) => picked[i] === t);

  useEffect(() => {
    if (phase !== "matrix" || !matrixDone || hackSent.current) return;
    hackSent.current = true;
    let cancelled = false;
    (async () => {
      const fd = new FormData();
      fd.set("success", "true");
      fd.set("notes", "Дверь взломана (мини-игра: провода + кодовый замок)");
      fd.set(
        "details_json",
        JSON.stringify({
          doorMinigame: true,
          key: TARGET_KEY,
          wireHints: wirePuzzle.hints.map((h) => `${h.wire}→${h.port}`).join(", "),
        })
      );
      const res = await submitHackResult("door", fd);
      if (cancelled) return;
      if ("error" in res && res.error) {
        setMatrixHint(res.error);
        hackSent.current = false;
        return;
      }
      setPhase("victory");
    })();
    return () => {
      cancelled = true;
    };
  }, [phase, matrixDone, wirePuzzle.hints]);

  useEffect(() => {
    if (phase !== "victory") return;
    const t = setTimeout(() => router.push("/dashboard"), 2200);
    return () => clearTimeout(t);
  }, [phase, router]);

  const wiresComplete = wirePuzzle.portSlots.every((slot) => wired[slot.portLetter] === slot.expectsWire);

  useEffect(() => {
    if (phase === "wires" && wiresComplete) {
      const t = setTimeout(() => setPhase("matrix"), 450);
      return () => clearTimeout(t);
    }
  }, [phase, wiresComplete]);

  function tryConnectPort(slot: { portLetter: Letter; expectsWire: Letter }) {
    const w = dragWire.current ?? tapWire;
    if (!w) return;
    if (w === slot.expectsWire) {
      setWired((m) => ({ ...m, [slot.portLetter]: w }));
      setTapWire(null);
    }
  }

  function openPanel() {
    setPanelSlide(true);
    setTimeout(() => setPhase("wires"), 650);
  }

  const usedWires = new Set(
    Object.values(wired).filter((v): v is string => typeof v === "string" && v.length > 0)
  );

  return (
    <div className="relative mx-auto max-w-3xl">
      {phase === "panel" && (
        <button
          type="button"
          onClick={openPanel}
          className="panel relative flex min-h-[280px] w-full flex-col items-center justify-center overflow-hidden text-center transition-opacity hover:opacity-95"
        >
          <p className="mb-2 text-sm text-[var(--muted)]">Панель доступа</p>
          <p className="text-lg font-medium">Нажмите, чтобы снять крышку</p>
          <div
            className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center border-b-4 border-[var(--border)] bg-gradient-to-b from-zinc-700 to-zinc-900 transition-transform duration-[650ms] ease-in-out ${
              panelSlide ? "translate-y-[110%]" : "translate-y-0"
            }`}
          >
            <span className="text-sm tracking-[0.3em] text-zinc-400">LOCKED</span>
          </div>
        </button>
      )}

      {(phase === "wires" || phase === "matrix" || phase === "victory") && (
        <>
          {phase === "wires" && (
            <div className="panel">
              <p className="mb-4 text-sm text-[var(--muted)]">
                Подсказка: слева буква — цвет провода, справа — цвет порта. Перетащите провод в порт или нажмите
                провод, затем порт.
              </p>
              <div className="mb-6 flex flex-wrap gap-3 text-sm">
                {wirePuzzle.hints.map((h) => (
                  <span
                    key={`${h.wire}-${h.port}`}
                    className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-1 font-mono"
                  >
                    <span className={COLOR[h.wire].text}>{h.wire}</span>
                    <span className="text-[var(--muted)]"> — </span>
                    <span className={COLOR[h.port].text}>{h.port}</span>
                  </span>
                ))}
              </div>

              <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="mb-3 text-xs uppercase tracking-wide text-[var(--muted)]">Провода</p>
                  <div className="flex flex-col gap-4">
                    {wirePuzzle.wiresOrder.map((w) => {
                      if (usedWires.has(w)) return null;
                      const c = COLOR[w];
                      const sel = tapWire === w;
                      return (
                        <div
                          key={w}
                          role="button"
                          tabIndex={0}
                          draggable
                          onDragStart={() => {
                            dragWire.current = w;
                          }}
                          onDragEnd={() => {
                            dragWire.current = null;
                          }}
                          onClick={() => setTapWire((t) => (t === w ? null : w))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setTapWire((t) => (t === w ? null : w));
                            }
                          }}
                          className={`flex cursor-grab items-center gap-2 rounded-lg border-2 ${c.border} ${c.bg} px-4 py-3 shadow-md active:cursor-grabbing ${c.text} ${
                            sel ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg)]" : ""
                          }`}
                        >
                          <span className="font-mono text-lg font-bold">{w}</span>
                          <span className="text-xs opacity-90">{c.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex-1">
                  <p className="mb-3 text-xs uppercase tracking-wide text-[var(--muted)]">Порты</p>
                  <div className="flex flex-col gap-4">
                    {wirePuzzle.portSlots.map((slot) => {
                      const c = COLOR[slot.portLetter];
                      const ok = wired[slot.portLetter] === slot.expectsWire;
                      return (
                        <div
                          key={slot.portLetter}
                          role="button"
                          tabIndex={0}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            tryConnectPort(slot);
                            dragWire.current = null;
                          }}
                          onClick={() => tryConnectPort(slot)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              tryConnectPort(slot);
                            }
                          }}
                          className={`min-h-[56px] cursor-pointer rounded-lg border-2 border-dashed px-4 py-3 transition-colors ${
                            ok ? "border-emerald-400 bg-emerald-500/10" : `${c.border} bg-[var(--bg)] hover:bg-white/5`
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-sm font-medium ${c.text}`}>
                              Порт {slot.portLetter} · {c.name}
                            </span>
                            {ok && <span className="text-xs text-emerald-400">{wired[slot.portLetter]} ✓</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {phase === "matrix" && (
            <div className="panel relative">
              <p className="mb-2 text-sm text-[var(--muted)]">
                Этап 2. Нажмите на колонку, чтобы остановить прокрутку. В центре линии должны оказаться зелёные буквы
                кода <span className="font-mono text-[var(--accent)]">{TARGET_KEY}</span>. Неверно — снова нажмите ту
                же колонку, чтобы крутить дальше.
              </p>
              <div className="mt-4 flex flex-wrap items-end justify-center gap-2 rounded-xl border border-[var(--border)] bg-black/40 p-4">
                {keyChars.map((_, col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => onColumnClick(col)}
                    className="relative flex w-10 flex-col items-center overflow-hidden rounded border border-[var(--border)] bg-zinc-900/80"
                    style={{ height: COL_H }}
                  >
                    <div
                      className="absolute left-0 top-0 w-full will-change-transform"
                      style={{
                        transform: `translateY(-${offsets[col]}px)`,
                      }}
                    >
                      {strips[col].map((cell, i) => (
                        <div
                          key={i}
                          className={`flex h-[28px] items-center justify-center font-mono text-sm ${
                            cell.green ? "font-bold text-emerald-400" : "text-zinc-500"
                          }`}
                        >
                          {cell.ch}
                        </div>
                      ))}
                    </div>
                    <div className="pointer-events-none absolute left-0 right-0 top-1/2 z-[1] h-0 -translate-y-1/2 border-t border-[var(--accent)]/60" />
                  </button>
                ))}
              </div>
              <p className="mt-3 font-mono text-sm">
                В центре: {picked.map((p) => p ?? "·").join(" ")}
              </p>
              {matrixHint && <p className="mt-2 text-sm text-amber-400">{matrixHint}</p>}
            </div>
          )}

          {phase === "victory" && (
            <div className="panel border-emerald-600/40 bg-emerald-950/30 text-center">
              <p className="text-lg font-semibold text-emerald-300">Дверь взломана</p>
              <p className="mt-2 text-sm text-[var(--muted)]">Возврат на главный экран…</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
