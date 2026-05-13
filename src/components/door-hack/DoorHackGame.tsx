"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { submitHackResult } from "@/app/dashboard/actions";
import type { MarkerColor } from "@/lib/venue-map-markers";

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

/** Порядок портов: перестановка тех же цветов, но нигде порт ≠ провод на одной паре (нет «красный в красный»). */
function shuffledDerangementPorts(wires: Letter[]): Letter[] {
  for (let n = 0; n < 48; n++) {
    const p = shuffle([...LETTERS]);
    if (p.every((port, i) => port !== wires[i])) return p;
  }
  return wires.map((_, i) => wires[(i + 1) % wires.length]!);
}

const KEY_LENGTH = 6;

/** Слова кода (ровно KEY_LENGTH латинских букв A–Z). */
const CODE_WORDS = [
  "ACCESS",
  "BYPASS",
  "BREACH",
  "CIPHER",
  "CLIENT",
  "DEVICE",
  "ESCAPE",
  "HANDLE",
  "INSERT",
  "MATRIX",
  "MODULE",
  "OUTPUT",
  "PARSER",
  "PORTAL",
  "REMOTE",
  "SECURE",
  "SERIAL",
  "SERVER",
  "SIGNAL",
  "STATIC",
  "STREAM",
  "STRIKE",
  "SWITCH",
  "SYSTEM",
  "UNLOCK",
  "WYZPAL",
] as const;

function pickCodeWord(): string {
  const ok = CODE_WORDS.filter((w) => w.length === KEY_LENGTH);
  return ok[Math.floor(Math.random() * ok.length)] ?? "ACCESS";
}

/** Смещения (px): провода и порты не в одну линию */
const WIRE_STAGGER_Y = [0, 36, 14];
const WIRE_STAGGER_X = [0, 14, -10];
const PORT_STAGGER_Y = [22, 0, 48];
const PORT_STAGGER_X = [0, -18, 12];

type StripCell = { ch: string; green: boolean };

function randomAz(): string {
  return String.fromCharCode(65 + Math.floor(Math.random() * 26));
}

/** Лента: много случайных букв; все ячейки с буквой цели подсвечиваются (green). */
function buildStrip(targetLetter: string): StripCell[] {
  const len = 48;
  const out: StripCell[] = [];
  for (let i = 0; i < len; i++) {
    const ch = Math.random() < 0.38 ? targetLetter : randomAz();
    out.push({ ch, green: ch === targetLetter });
  }
  while (out.filter((c) => c.ch === targetLetter).length < 6) {
    const idx = out.findIndex((c) => c.ch !== targetLetter);
    if (idx === -1) break;
    out[idx] = { ch: targetLetter, green: true };
  }
  return out;
}

export type DoorHackMarkerChoice = { id: string; displayNum: number; color: MarkerColor };

type DoorGoal = "open" | "close";

type DoorHackGameProps = {
  markers: DoorHackMarkerChoice[];
};

export function DoorHackGame({ markers }: DoorHackGameProps) {
  const router = useRouter();
  const sortedMarkers = useMemo(
    () => [...markers].sort((a, b) => a.displayNum - b.displayNum),
    [markers]
  );
  const [doorGoal, setDoorGoal] = useState<DoorGoal | null>(null);
  const filteredMarkers = useMemo(() => {
    if (!doorGoal) return [];
    if (doorGoal === "close") {
      return sortedMarkers.filter((m) => m.color === "green" || m.color === "gray");
    }
    return sortedMarkers.filter((m) => m.color === "red" || m.color === "gray");
  }, [sortedMarkers, doorGoal]);

  const [selectedMarkerId, setSelectedMarkerId] = useState("");
  const [coarsePointer, setCoarsePointer] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const apply = () => setCoarsePointer(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const linePx = coarsePointer ? 36 : 28;
  const colH = coarsePointer ? 192 : 140;
  const centerY = colH / 2 - linePx / 2;

  const [phase, setPhase] = useState<"panel" | "wires" | "matrix" | "victory">("panel");
  const [panelSlide, setPanelSlide] = useState(false);

  const wirePuzzle = useMemo(() => {
    const wiresOrder = shuffle([...LETTERS]);
    const portsOrder = shuffledDerangementPorts(wiresOrder);
    const hints = wiresOrder.map((w, i) => ({ wire: w, port: portsOrder[i] }));
    const portSlots = wiresOrder.map((_, i) => ({
      portLetter: portsOrder[i],
      expectsWire: wiresOrder[i],
    }));
    const wireVisualOrder = shuffle([...wiresOrder]);
    const portVisualOrder = shuffle([...portSlots]);
    const hintsShuffled = shuffle([...hints]);
    return { wiresOrder, portSlots, hints, wireVisualOrder, portVisualOrder, hintsShuffled };
  }, []);

  const codePuzzle = useMemo(() => {
    const targetKey = pickCodeWord();
    const keyChars = targetKey.split("");
    const strips = keyChars.map((c) => buildStrip(c));
    return { targetKey, keyChars, strips };
  }, []);

  const [wired, setWired] = useState<Record<string, string | null>>({});
  const dragWire = useRef<Letter | null>(null);
  const [tapWire, setTapWire] = useState<Letter | null>(null);

  const { targetKey, keyChars, strips } = codePuzzle;
  const [offsets, setOffsets] = useState(() => codePuzzle.keyChars.map(() => Math.random() * 200));
  const [stopped, setStopped] = useState(() => codePuzzle.keyChars.map(() => false));
  const [picked, setPicked] = useState<(string | null)[]>(() => codePuzzle.keyChars.map(() => null));
  const rafRef = useRef<number | null>(null);
  const [matrixHint, setMatrixHint] = useState<string | null>(null);
  const hackSent = useRef(false);

  const tick = useCallback(() => {
    setOffsets((prev) =>
      prev.map((o, i) => {
        if (stopped[i]) return o;
        const stripLen = strips[i].length * linePx;
        let n = o + (coarsePointer ? 1.6 : 1.2);
        if (n > stripLen) n = 0;
        return n;
      })
    );
    rafRef.current = requestAnimationFrame(tick);
  }, [stopped, strips, linePx, coarsePointer]);

  useEffect(() => {
    if (phase !== "matrix") return;
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [phase, tick]);

  function readCharAtCenter(col: number): string {
    const strip = strips[col];
    const o = offsets[col];
    const idx = Math.floor((o + centerY) / linePx) % strip.length;
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
    const ch = readCharAtCenter(col);
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
      if (!doorGoal) return;
      const fd = new FormData();
      fd.set("success", "true");
      fd.set(
        "notes",
        doorGoal === "close"
          ? "Дверь закрыта (мини-игра: провода + кодовый замок)"
          : "Дверь открыта (мини-игра: провода + кодовый замок)"
      );
      fd.set("door_goal", doorGoal);
      if (selectedMarkerId) fd.set("venue_marker_id", selectedMarkerId);
      fd.set(
        "details_json",
        JSON.stringify({
          doorMinigame: true,
          doorGoal,
          key: targetKey,
          wireHints: wirePuzzle.hints.map((h) => `${h.wire}→${h.port}`).join(", "),
          venueMarkerId: selectedMarkerId || undefined,
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
  }, [phase, matrixDone, wirePuzzle.hints, targetKey, selectedMarkerId, doorGoal]);

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

  const canOpenPanel = doorGoal !== null && filteredMarkers.length > 0 && selectedMarkerId.length > 0;

  function pickDoorGoal(g: DoorGoal) {
    setDoorGoal(g);
    setSelectedMarkerId("");
  }

  function openPanel() {
    if (!canOpenPanel) return;
    setPanelSlide(true);
    setTimeout(() => setPhase("wires"), 650);
  }

  const usedWires = new Set(
    Object.values(wired).filter((v): v is string => typeof v === "string" && v.length > 0)
  );

  const useDrag = !coarsePointer;

  return (
    <div
      className="relative mx-auto max-w-3xl touch-manipulation select-none [-webkit-tap-highlight-color:transparent]"
    >
      {phase === "panel" && (
        <div className="panel relative flex min-h-[min(280px,70dvh)] w-full flex-col overflow-hidden">
          <div className="shrink-0 space-y-4 border-b border-[var(--border)] bg-black/50 px-4 py-3">
            <div>
              <span className="mb-2 block text-xs text-[var(--muted)]">Действие</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => pickDoorGoal("open")}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    doorGoal === "open"
                      ? "border-emerald-500/70 bg-emerald-950/50 text-emerald-200"
                      : "border-[var(--border)] bg-zinc-950 text-zinc-200 hover:border-emerald-600/40"
                  }`}
                >
                  Открыть
                </button>
                <button
                  type="button"
                  onClick={() => pickDoorGoal("close")}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    doorGoal === "close"
                      ? "border-red-500/70 bg-red-950/40 text-red-200"
                      : "border-[var(--border)] bg-zinc-950 text-zinc-200 hover:border-red-600/40"
                  }`}
                >
                  Закрыть
                </button>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
                {doorGoal === null && "Сначала выберите режим — в списке ниже появятся нужные индикаторы (все игроки видят одну и ту же карту)."}
                {doorGoal === "open" &&
                  "Список: закрытые (красные на карте) и серые. Успех — индикатор станет зелёным (открыто) для всех."}
                {doorGoal === "close" &&
                  "Список: открытые (зелёные на карте) и серые. Успех — индикатор станет красным (закрыто) для всех."}
              </p>
            </div>

            <div>
              <label htmlFor="door-venue-marker" className="mb-1.5 block text-xs text-[var(--muted)]">
                Индикатор на карте
              </label>
              {sortedMarkers.length === 0 ? (
                <p className="text-sm text-amber-400/95">
                  На карте нет точек. Попросите администратора добавить их на странице «Карта полигона».
                </p>
              ) : !doorGoal ? (
                <p className="text-sm text-[var(--muted)]">Выберите «Открыть» или «Закрыть», чтобы открыть список.</p>
              ) : filteredMarkers.length === 0 ? (
                <p className="text-sm text-amber-400/95">
                  В этом режиме нет подходящих индикаторов. Смените действие или попросите ведущего обновить статусы на
                  карте.
                </p>
              ) : (
                <select
                  id="door-venue-marker"
                  value={selectedMarkerId}
                  onChange={(e) => setSelectedMarkerId(e.target.value)}
                  className="w-full max-w-sm rounded-lg border border-[var(--border)] bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                >
                  <option value="">Выберите номер…</option>
                  {filteredMarkers.map((m) => (
                    <option key={m.id} value={m.id}>
                      №{m.displayNum}
                      {m.color === "green" ? " · открыта" : m.color === "red" ? " · закрыта" : " · серая"}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={openPanel}
            disabled={!canOpenPanel}
            className={`relative flex min-h-[min(220px,55dvh)] flex-1 flex-col items-center justify-center overflow-hidden text-center ${
              canOpenPanel ? "active:bg-white/[0.04]" : "cursor-not-allowed opacity-60"
            }`}
          >
            <div
              className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center border-b-4 border-[var(--border)] bg-gradient-to-b from-zinc-700 to-zinc-900 transition-transform duration-[650ms] ease-in-out ${
                panelSlide ? "translate-y-[110%]" : "translate-y-0"
              }`}
            >
              <span className="text-sm tracking-[0.3em] text-zinc-400">LOCKED</span>
            </div>
            <p className="relative z-0 mb-2 mt-6 text-sm text-[var(--muted)]">Панель доступа</p>
            <p className="relative z-0 px-3 text-lg font-medium">
              {canOpenPanel
                ? "Нажмите, чтобы снять крышку"
                : sortedMarkers.length === 0
                  ? "Нет индикаторов на карте"
                  : !doorGoal
                    ? "Сначала выберите: открыть или закрыть дверь"
                    : filteredMarkers.length === 0
                      ? "Нет индикаторов для этого действия"
                      : "Выберите номер индикатора выше"}
            </p>
          </button>
        </div>
      )}

      {(phase === "wires" || phase === "matrix" || phase === "victory") && (
        <>
          {phase === "wires" && (
            <div className="panel">
              <p className="mb-3 text-sm text-zinc-300">
                Соедините цветные провода с цветными портами по подсказкам.
                {coarsePointer ? (
                  <span className="mt-1 block font-medium text-zinc-100">
                    На телефоне: нажмите провод (подсветится), затем нужный порт. Перетаскивание отключено — так
                    стабильнее на тачскрине.
                  </span>
                ) : (
                  <span className="mt-1 block">На ПК можно перетащить провод в порт или использовать два клика.</span>
                )}
              </p>
              <div className="mb-8 flex flex-wrap items-center gap-3 sm:gap-4">
                {wirePuzzle.hintsShuffled.map((h) => (
                  <div
                    key={`${h.wire}-${h.port}`}
                    className="flex items-center gap-2 rounded-2xl border-2 border-white/35 bg-zinc-950 px-3 py-2 shadow-xl ring-1 ring-white/15 sm:gap-3 sm:px-4 sm:py-3"
                    title={`${COLOR[h.wire].name} → ${COLOR[h.port].name}`}
                  >
                    <span className="sr-only">
                      {COLOR[h.wire].name} к {COLOR[h.port].name}
                    </span>
                    <span
                      className={`h-11 w-11 shrink-0 rounded-lg border-2 border-white/80 shadow-md sm:h-12 sm:w-12 ${COLOR[h.wire].bg}`}
                      aria-hidden
                    />
                    <span className="select-none text-xl font-bold text-white drop-shadow-md sm:text-2xl">→</span>
                    <span
                      className={`h-11 w-11 shrink-0 rounded-lg border-2 border-white/80 shadow-md sm:h-12 sm:w-12 ${COLOR[h.port].bg}`}
                      aria-hidden
                    />
                  </div>
                ))}
              </div>

              <div className="relative flex min-h-[280px] flex-col gap-10 sm:min-h-[300px] sm:flex-row sm:justify-between sm:gap-10">
                <div className="flex flex-1 flex-col gap-6 sm:max-w-[45%]">
                  <span className="sr-only">Провода</span>
                  <div className="flex flex-col gap-8 sm:gap-10">
                    {wirePuzzle.wireVisualOrder.map((w, i) => {
                      if (usedWires.has(w)) return null;
                      const c = COLOR[w];
                      const sel = tapWire === w;
                      return (
                        <button
                          key={w}
                          type="button"
                          draggable={useDrag}
                          aria-label={`Провод: ${c.name}`}
                          onDragStart={() => {
                            if (!useDrag) return;
                            dragWire.current = w;
                          }}
                          onDragEnd={() => {
                            dragWire.current = null;
                          }}
                          onClick={() => setTapWire((t) => (t === w ? null : w))}
                          style={{
                            marginTop:
                              WIRE_STAGGER_Y[i % WIRE_STAGGER_Y.length] + (w.charCodeAt(0) % 5) * 10,
                            marginLeft: coarsePointer ? 0 : WIRE_STAGGER_X[i % WIRE_STAGGER_X.length],
                          }}
                          className={`h-[52px] w-full max-w-[220px] shrink-0 rounded-2xl border-4 border-white/35 ${c.bg} shadow-lg sm:h-16 sm:w-36 ${
                            useDrag ? "cursor-grab active:cursor-grabbing" : "cursor-pointer active:opacity-90"
                          } ${sel ? "ring-4 ring-sky-400 ring-offset-4 ring-offset-[var(--panel)]" : ""}`}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-1 flex-col items-stretch gap-8 sm:items-end sm:gap-10 sm:max-w-[45%]">
                  <span className="sr-only">Порты</span>
                  <div className="flex w-full flex-col items-stretch gap-8 sm:items-end sm:gap-10">
                    {wirePuzzle.portVisualOrder.map((slot, i) => {
                      const c = COLOR[slot.portLetter];
                      const ok = wired[slot.portLetter] === slot.expectsWire;
                      return (
                        <button
                          key={slot.portLetter}
                          type="button"
                          aria-label={`Порт: ${c.name}`}
                          onDragOver={useDrag ? (e) => e.preventDefault() : undefined}
                          onDrop={
                            useDrag
                              ? (e) => {
                                  e.preventDefault();
                                  tryConnectPort(slot);
                                  dragWire.current = null;
                                }
                              : undefined
                          }
                          onClick={() => tryConnectPort(slot)}
                          style={{
                            marginTop:
                              PORT_STAGGER_Y[i % PORT_STAGGER_Y.length] +
                              (slot.portLetter.charCodeAt(0) % 5) * 10,
                            marginRight: coarsePointer ? 0 : PORT_STAGGER_X[i % PORT_STAGGER_X.length],
                          }}
                          className={`relative h-[52px] w-full max-w-[220px] shrink-0 rounded-2xl border-4 border-dashed transition-colors sm:h-16 sm:w-40 sm:max-w-none ${
                            coarsePointer ? "self-stretch sm:self-end" : "self-end"
                          } ${
                            ok
                              ? "border-emerald-300 bg-emerald-500/25 shadow-[0_0_24px_rgba(52,211,153,0.35)]"
                              : `${c.border} border-opacity-90 bg-black/30 active:bg-white/15 sm:hover:bg-white/10`
                          }`}
                        >
                          {ok && (
                            <span
                              className="pointer-events-none absolute inset-0 flex items-center justify-center text-3xl font-bold text-emerald-200 drop-shadow"
                              aria-hidden
                            >
                              ✓
                            </span>
                          )}
                        </button>
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
                кода <span className="font-mono text-[var(--accent)]">{targetKey}</span>. Неверно — снова нажмите ту
                же колонку, чтобы крутить дальше.
              </p>
              <div className="mt-4 flex flex-wrap items-end justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-black/40 p-3 sm:gap-2 sm:p-4">
                {keyChars.map((_, col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => onColumnClick(col)}
                    className="relative flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center overflow-hidden rounded-lg border border-[var(--border)] bg-zinc-900/80 sm:max-w-[56px] sm:flex-none sm:rounded-md"
                    style={{ height: colH, maxWidth: coarsePointer ? "52px" : undefined }}
                  >
                    <div
                      className="pointer-events-none absolute left-0 top-0 w-full will-change-transform"
                      style={{
                        transform: `translateY(-${offsets[col]}px)`,
                      }}
                    >
                      {strips[col].map((cell, i) => (
                        <div
                          key={i}
                          className={`flex items-center justify-center font-mono font-medium ${
                            cell.green ? "text-emerald-400" : "text-zinc-500"
                          } ${coarsePointer ? "text-base" : "text-sm"}`}
                          style={{ height: linePx, minHeight: linePx }}
                        >
                          {cell.ch}
                        </div>
                      ))}
                    </div>
                    <div className="pointer-events-none absolute left-0 right-0 top-1/2 z-[1] h-0 -translate-y-1/2 border-t-2 border-[var(--accent)]/70" />
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
              <p className="text-lg font-semibold text-emerald-300">
                {doorGoal === "close" ? "Дверь закрыта" : "Дверь открыта"}
              </p>
              {selectedMarkerId ? (
                <p className="mt-2 text-sm text-emerald-200/90">
                  Индикатор №
                  {sortedMarkers.find((m) => m.id === selectedMarkerId)?.displayNum ?? "—"} на карте:{" "}
                  {doorGoal === "close" ? "красный (закрыто)" : "зелёный (открыто)"} для всех.
                </p>
              ) : null}
              <p className="mt-2 text-sm text-[var(--muted)]">Возврат на главный экран…</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
