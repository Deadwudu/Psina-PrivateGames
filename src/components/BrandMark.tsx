type BrandMarkProps = {
  /** Размер марки «PG» */
  size?: "sm" | "md";
  /** Показывать текст справа */
  showText?: boolean;
};

export function BrandMark({ size = "md", showText = true }: BrandMarkProps) {
  const box = size === "sm" ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs";
  return (
    <span className="inline-flex items-center gap-3">
      <span
        className={`flex shrink-0 items-center justify-center rounded-sm border border-[#6b7d52] bg-gradient-to-b from-[#4f633e] to-[#354428] font-mono font-bold leading-none text-[#eef2dd] shadow-inner shadow-black/60 ring-1 ring-black/30 ${box}`}
        aria-hidden
      >
        PG
      </span>
      {showText && (
        <span className="font-display text-base font-semibold uppercase tracking-[0.22em] text-[var(--accent)] sm:text-lg">
          Private Games
        </span>
      )}
    </span>
  );
}
