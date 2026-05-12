import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/SignOutButton";
import { isAppConfigured } from "@/lib/supabase/config";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isAppConfigured()) {
    redirect("/login?missing=config");
  }
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--panel)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="font-semibold">
              Администратор
            </Link>
            <Link href="/dashboard" className="text-sm text-[var(--muted)] hover:text-[var(--accent)]">
              Главный экран
            </Link>
          </div>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
