import Link from "next/link";
import { DashboardNav } from "@/components/DashboardNav";
import { getSession } from "@/lib/auth/session";

const roleLabels: Record<string, string> = {
  side_a: "Сторона А",
  side_b: "Сторона Б",
  admin: "Администратор",
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const roleLabel = roleLabels[session.role] ?? session.role;

  return (
    <div>
      <div className="relative mb-10 overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-teal-500/[0.08] via-transparent to-cyan-500/[0.06] px-5 py-8 sm:px-8">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-teal-400/15 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-teal-400/90">оперативный интерфейс</p>
            <h1 className="max-w-xl bg-gradient-to-r from-white via-slate-100 to-teal-200/90 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
              Главный экран
            </h1>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[var(--muted)]">
              <span className="font-medium text-[var(--text)]">{session.username}</span>
              <span aria-hidden className="text-[var(--muted)]">
                ·
              </span>
              <span className="inline-flex items-center rounded-full border border-white/10 bg-black/25 px-3 py-1 text-sm text-teal-100/95">
                {roleLabel}
              </span>
            </p>
          </div>
          {session.role === "admin" && (
            <Link
              href="/admin"
              className="btn-primary shrink-0 px-5 py-3 text-sm shadow-teal-500/30"
            >
              Панель администратора
            </Link>
          )}
        </div>
      </div>
      <DashboardNav />
    </div>
  );
}
