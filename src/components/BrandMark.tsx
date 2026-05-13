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
        className={`flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 via-orange-500 to-red-800 font-mono font-bold leading-none text-stone-950 shadow-lg shadow-amber-600/35 ring-1 ring-white/15 ${box}`}
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
