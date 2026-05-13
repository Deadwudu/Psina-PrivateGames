import Link from "next/link";
import { DashboardNav } from "@/components/DashboardNav";
import { getSession } from "@/lib/auth/session";
import { getSideDisplayNames } from "@/lib/side-display-names";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const names = await getSideDisplayNames();
  const roleLabels: Record<string, string> = {
    side_a: names.sideA,
    side_b: names.sideB,
    admin: "Администратор",
  };

  const roleLabel = roleLabels[session.role] ?? session.role;

  return (
    <div>
      <div className="relative mb-10 overflow-hidden rounded-sm border-2 border-[#4f5844]/95 bg-gradient-to-br from-[#181f14]/98 via-[#12180f]/98 to-[#0d100b]/98 px-5 py-8 sm:px-8">
        <span
          className="pointer-events-none absolute left-3 top-3 h-5 w-5 border-l-2 border-t-2 border-[var(--accent-dim)]"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute right-3 top-3 h-5 w-5 border-r-2 border-t-2 border-[var(--accent-dim)]"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute bottom-3 left-3 h-5 w-5 border-b-2 border-l-2 border-[var(--accent-dim)]"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute bottom-3 right-3 h-5 w-5 border-b-2 border-r-2 border-[var(--accent-dim)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-12 top-0 h-48 w-48 rounded-full bg-[#3d4d2f]/25 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="mil-label text-[var(--accent-dim)]">тактический интерфейс · SECURE</p>
            <h1 className="font-display max-w-xl text-3xl font-semibold uppercase tracking-wide text-[var(--text)] sm:text-4xl">
              Главный экран
            </h1>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[var(--muted)]">
              <span className="font-mono text-sm font-medium text-[var(--text)]">{session.username}</span>
              <span aria-hidden className="text-[var(--muted)]">
                ·
              </span>
              <span className="inline-flex items-center rounded-sm border border-[#5a6348] bg-black/35 px-2.5 py-1 font-mono text-xs uppercase tracking-wider text-[var(--accent)]">
                {roleLabel}
              </span>
            </p>
          </div>
          {session.role === "admin" && (
            <Link href="/admin" className="btn-primary shrink-0 px-5 py-3 text-sm normal-case">
              Панель администратора
            </Link>
          )}
        </div>
      </div>
      <DashboardNav />
    </div>
  );
}
