type BrandMarkProps = {
  /** Размер марки «PG» */
  size?: "sm" | "md";
  /** Показывать текст справа */
  showText?: boolean;
};

export function BrandMark({ size = "md", showText = true }: BrandMarkProps) {
  const box = size === "sm" ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs";
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className={`flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 via-teal-500 to-cyan-600 font-mono font-bold leading-none text-slate-950 shadow-lg shadow-teal-500/30 ring-1 ring-white/20 ${box}`}
        aria-hidden
      >
        PG
      </span>
      {showText && (
        <span className="font-semibold tracking-tight text-[var(--text)]">
          Private Games
        </span>
      )}
    </span>
  );
}
