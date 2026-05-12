"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { submitHackResult } from "@/app/dashboard/actions";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const CHAIN_STEPS = ["SCAN", "ENUM", "ESCALATE", "PERSIST"] as const;
type ChainStep = (typeof CHAIN_STEPS)[number];

const LINE_H = 26;
const VIEW_H = 200;
const TOKEN_LINE_INDEX = 11;

const LOG_LINES: string[] = (() => {
  const noise = [
    "[kernel] tcp_ack",
    "sshd: session opened",
    "nft: rule hit count=8421",
    "systemd: Started update",
    "docker: container health",
    "nginx: 200 GET /api",
    "postgres: connection ok",
    "redis: PING+PONG",
    "ufw: ALLOW IN",
    "cron: job start",
    "rsyslog: imuxsock",
    "audit: syscall=59",
    "kubelet: pod sync",
    "fluent-bit: flush chunk",
    "prometheus: scrape 15s",
    "vault: seal status",
    "consul: serf: EventMember",
    "etcd: compacted revision",
    "coredns: NOERROR",
    "iptables: policy ACCEPT",
    "fail2ban: ban restored",
    "chrony: Selected source",
    "dbus: activation",
    "polkit: auth challenge",
  ];
  const lines: string[] = [];
  for (let i = 0; i < 24; i++) {
    if (i === TOKEN_LINE_INDEX) {
      lines.push('ingress-proxy | AUTH_TOKEN=7c2a9f1e  dst="10.0.4.12:443"');
    } else {
      lines.push(`${noise[i % noise.length]} id=${(1000 + i * 17).toString(16)}`);
    }
  }
  return lines;
})();

/** Lights Out (линия 5): кнопка i переключает лампы по маске. */
const TOGGLE_MASKS: number[][] = [
  [1, 1, 0, 0, 0],
  [1, 1, 1, 0, 0],
  [0, 1, 1, 1, 0],
  [0, 0, 1, 1, 1],
  [0, 0, 0, 1, 1],
];

function xorLamps(lamps: boolean[], btn: number): boolean[] {
  const m = TOGGLE_MASKS[btn];
  return lamps.map((on, j) => on !== Boolean(m[j]));
}

type Phase = "packet" | "simon" | "firewall" | "chain" | "victory";

const SIMON_COLORS = [
  { id: 0, label: "A", className: "bg-rose-500 hover:bg-rose-400" },
  { id: 1, label: "B", className: "bg-sky-500 hover:bg-sky-400" },
  { id: 2, label: "C", className: "bg-amber-400 hover:bg-amber-300" },
  { id: 3, label: "D", className: "bg-emerald-500 hover:bg-emerald-400" },
] as const;

export function ServerHackGame() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("packet");

  const simonSeq = useMemo(() => Array.from({ length: 5 }, () => Math.floor(Math.random() * 4)), []);

  const firewallInit = useMemo(() => {
    let lamps = [true, true, true, true, true];
    for (let k = 0; k < 22; k++) {
      lamps = xorLamps(lamps, Math.floor(Math.random() * 5));
    }
    return lamps;
  }, []);

  const [lamps, setLamps] = useState<boolean[]>(() => firewallInit);

  const [scrollY, setScrollY] = useState(0);
  const rafRef = useRef<number | null>(null);

  const tickPacket = useCallback(() => {
    setScrollY((y) => {
      const total = LOG_LINES.length * LINE_H;
      let n = y + 0.55;
      if (n >= total) n = 0;
      return n;
    });
    rafRef.current = requestAnimationFrame(tickPacket);
  }, []);

  useEffect(() => {
    if (phase !== "packet") return;
    rafRef.current = requestAnimationFrame(tickPacket);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [phase, tickPacket]);

  function tryCapturePacket() {
    const centerY = scrollY + VIEW_H / 2;
    const idx = Math.floor(centerY / LINE_H) % LOG_LINES.length;
    if (idx === TOKEN_LINE_INDEX) setPhase("simon");
  }

  const [simonProgress, setSimonProgress] = useState(0);
  const [simonPlaybackDone, setSimonPlaybackDone] = useState(false);
  const onSimonPlaybackComplete = useCallback(() => {
    setSimonPlaybackDone(true);
  }, []);

  useEffect(() => {
    if (phase === "simon") {
      setSimonPlaybackDone(false);
      setSimonProgress(0);
    }
  }, [phase]);

  function onSimonButton(i: number) {
    if (phase !== "simon" || !simonPlaybackDone) return;
    if (simonSeq[simonProgress] !== i) return;
    const next = simonProgress + 1;
    setSimonProgress(next);
    if (next >= simonSeq.length) setPhase("firewall");
  }

  function onFirewallToggle(btn: number) {
    if (phase !== "firewall") return;
    setLamps((L) => xorLamps(L, btn));
  }

  const firewallDone = lamps.every(Boolean);
  useEffect(() => {
    if (phase === "firewall" && firewallDone) {
      const t = setTimeout(() => setPhase("chain"), 350);
      return () => clearTimeout(t);
    }
  }, [phase, firewallDone]);

  const [chainPool, setChainPool] = useState<ChainStep[]>(() => shuffle([...CHAIN_STEPS]));
  const [chainSlots, setChainSlots] = useState<(ChainStep | null)[]>(() => [null, null, null, null]);
  const [chainPick, setChainPick] = useState<ChainStep | null>(null);

  function onChainCardClick(step: ChainStep) {
    if (phase !== "chain") return;
    setChainPick((p) => (p === step ? null : step));
  }

  function onChainSlotClick(slotIndex: number) {
    if (phase !== "chain") return;
    const pick = chainPick;
    if (!pick) return;
    if (CHAIN_STEPS[slotIndex] !== pick) return;
    if (chainSlots[slotIndex] !== null) return;
    setChainSlots((s) => {
      const n = [...s];
      n[slotIndex] = pick;
      return n;
    });
    setChainPool((p) => p.filter((x) => x !== pick));
    setChainPick(null);
  }

  const chainDone = chainSlots.every((s, i) => s === CHAIN_STEPS[i]);
  const hackSent = useRef(false);

  useEffect(() => {
    if (phase !== "chain" || !chainDone || hackSent.current) return;
    hackSent.current = true;
    let cancelled = false;
    (async () => {
      const fd = new FormData();
      fd.set("success", "true");
      fd.set("notes", "Сервер взломан (мини-игра: перехват, Саймон, IDS, цепочка)");
      fd.set(
        "details_json",
        JSON.stringify({
          serverMinigame: true,
          simonLength: simonSeq.length,
          chain: [...CHAIN_STEPS],
        })
      );
      const res = await submitHackResult("server", fd);
      if (cancelled) return;
      if ("error" in res && res.error) {
        hackSent.current = false;
        return;
      }
      setPhase("victory");
    })();
    return () => {
      cancelled = true;
    };
  }, [phase, chainDone, simonSeq.length]);

  useEffect(() => {
    if (phase !== "victory") return;
    const t = setTimeout(() => router.push("/dashboard"), 2200);
    return () => clearTimeout(t);
  }, [phase, router]);

  const phaseIndex = phase === "packet" ? 0 : phase === "simon" ? 1 : phase === "firewall" ? 2 : phase === "chain" ? 3 : 4;

  return (
    <div className="touch-manipulation select-none [-webkit-tap-highlight-color:transparent]">
      <p className="mb-4 text-sm text-[var(--muted)]">
        Четыре этапа подряд. Ошибки не наказываются: неверное действие просто не срабатывает.
      </p>
      <div className="mb-4 flex gap-2 text-xs text-[var(--muted)]">
        {["Перехват", "Саймон", "IDS", "Цепочка"].map((label, i) => (
          <span
            key={label}
            className={`rounded-full px-2 py-1 ${i === phaseIndex ? "bg-[var(--accent)]/25 text-[var(--accent)]" : ""}`}
          >
            {i + 1}. {label}
          </span>
        ))}
      </div>

      {phase === "packet" && (
        <div className="panel">
          <p className="mb-3 text-sm text-zinc-300">
            Этап 1. Когда строка с <span className="font-mono text-amber-300">AUTH_TOKEN</span> окажется в оранжевой зоне,
            нажмите «Захватить». Промах — просто подождите следующего круга.
          </p>
          <div
            className="relative mx-auto max-w-md overflow-hidden rounded-lg border border-[var(--border)] bg-black/60 font-mono text-xs sm:text-sm"
            style={{ height: VIEW_H }}
          >
            <div
              className="absolute left-0 right-0 top-0 will-change-transform"
              style={{ transform: `translateY(-${scrollY % (LOG_LINES.length * LINE_H)}px)` }}
            >
              {LOG_LINES.map((line, i) => (
                <div
                  key={i}
                  className={`flex items-center px-2 ${i === TOKEN_LINE_INDEX ? "text-amber-300" : "text-zinc-500"}`}
                  style={{ height: LINE_H, minHeight: LINE_H }}
                >
                  <span className="truncate">{line}</span>
                </div>
              ))}
            </div>
            <div
              className="pointer-events-none absolute left-2 right-2 border border-amber-500/60 bg-amber-500/10"
              style={{ top: VIEW_H / 2 - 16, height: 32 }}
              aria-hidden
            />
          </div>
          <button type="button" className="btn-primary mt-4 w-full max-w-md sm:w-auto" onClick={tryCapturePacket}>
            Захватить
          </button>
        </div>
      )}

      {phase === "simon" && (
        <div className="panel">
          <p className="mb-3 text-sm text-zinc-300">
            Этап 2. Запомните вспышки по порядку, затем нажмите те же сегменты A–D. Неверная кнопка не засчитывается.
          </p>
          <SimonPlayback sequence={simonSeq} onPlaybackComplete={onSimonPlaybackComplete} />
          <p className="mb-2 mt-6 text-xs text-[var(--muted)]">
            Ваш ввод: шаг {simonProgress} / {simonSeq.length}
            {!simonPlaybackDone && <span className="text-amber-400/90"> — смотрите подсказку выше</span>}
          </p>
          <div className="grid max-w-xs grid-cols-2 gap-3">
            {SIMON_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-label={`Сегмент ${c.label}`}
                disabled={!simonPlaybackDone}
                onClick={() => onSimonButton(c.id)}
                className={`flex h-16 items-center justify-center rounded-xl text-lg font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-40 ${c.className}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "firewall" && (
        <div className="panel">
          <p className="mb-3 text-sm text-zinc-300">
            Этап 3. Переключатели гасят или зажигают лампы по правилам IDS. Доведите все индикаторы до зелёного — порядок
            нажатий любой.
          </p>
          <div className="mb-4 flex justify-center gap-2">
            {lamps.map((on, i) => (
              <div
                key={i}
                className={`h-10 w-10 rounded-full border-2 shadow-inner sm:h-12 sm:w-12 ${
                  on ? "border-emerald-400 bg-emerald-500 shadow-[0_0_16px_rgba(52,211,153,0.45)]" : "border-zinc-600 bg-zinc-800"
                }`}
                title={on ? "ON" : "OFF"}
              />
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {TOGGLE_MASKS.map((_, i) => (
              <button
                key={i}
                type="button"
                className="btn-secondary min-h-[44px] min-w-[44px] px-4"
                onClick={() => onFirewallToggle(i)}
              >
                T{i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "chain" && (
        <div className="panel">
          <p className="mb-3 text-sm text-zinc-300">
            Этап 4. Расставьте этапы атаки слева направо: SCAN → ENUM → ESCALATE → PERSIST. Сначала нажмите карточку,
            затем нужный слот. Неверная пара не крепится.
          </p>
          <div className="mb-4 flex flex-wrap gap-2">
            {chainSlots.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onChainSlotClick(i)}
                className={`flex min-h-[48px] min-w-[88px] flex-1 items-center justify-center rounded-lg border-2 border-dashed px-2 font-mono text-xs font-semibold sm:text-sm ${
                  s ? "border-emerald-500/70 bg-emerald-950/40 text-emerald-200" : "border-[var(--border)] bg-black/30 text-[var(--muted)]"
                }`}
              >
                {s ?? `— ${i + 1} —`}
              </button>
            ))}
          </div>
          <p className="mb-2 text-xs text-[var(--muted)]">Карточки</p>
          <div className="flex flex-wrap gap-2">
            {chainPool.map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => onChainCardClick(step)}
                className={`rounded-lg border-2 px-3 py-2 font-mono text-sm font-semibold ${
                  chainPick === step ? "border-sky-400 bg-sky-950/50 text-sky-200" : "border-[var(--border)] bg-zinc-900 text-zinc-200"
                }`}
              >
                {step}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "victory" && (
        <div className="panel border-emerald-600/40 bg-emerald-950/30 text-center">
          <p className="text-lg font-semibold text-emerald-300">Сервер скомпрометирован</p>
          <p className="mt-2 text-sm text-[var(--muted)]">Возврат на главный экран…</p>
        </div>
      )}
    </div>
  );
}

function SimonPlayback({
  sequence,
  onPlaybackComplete,
}: {
  sequence: number[];
  onPlaybackComplete: () => void;
}) {
  const [showFlash, setShowFlash] = useState<number | null>(null);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let alive = true;
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.push(setTimeout(resolve, ms));
      });

    const run = async () => {
      await wait(500);
      for (let s = 0; s < sequence.length; s++) {
        if (!alive) return;
        setShowFlash(sequence[s]);
        await wait(420);
        if (!alive) return;
        setShowFlash(null);
        await wait(220);
      }
      if (!alive) return;
      onPlaybackComplete();
    };
    run();
    return () => {
      alive = false;
      timers.forEach(clearTimeout);
      setShowFlash(null);
    };
  }, [sequence, onPlaybackComplete]);

  return (
    <div>
      <p className="mb-2 text-xs text-[var(--muted)]">Подсказка (повторится один раз при входе на этап)</p>
      <div className="grid max-w-xs grid-cols-2 gap-3">
        {SIMON_COLORS.map((c) => (
          <div
            key={c.id}
            className={`flex h-16 items-center justify-center rounded-xl text-lg font-bold text-white shadow-inner transition-all duration-150 ${
              showFlash === c.id ? "scale-105 ring-4 ring-white brightness-125" : ""
            } ${c.className} opacity-90`}
          >
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}
