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
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Главный экран</h1>
          <p className="text-[var(--muted)]">
            {session.username} · <span className="text-[var(--text)]">{roleLabel}</span>
          </p>
        </div>
        {session.role === "admin" && (
          <Link href="/admin" className="btn-secondary shrink-0 text-sm">
            Панель администратора
          </Link>
        )}
      </div>
      <DashboardNav />
    </div>
  );
}
