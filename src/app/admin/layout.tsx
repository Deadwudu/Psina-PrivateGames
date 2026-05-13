import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
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
  if (!session.isAdmin) redirect("/dashboard");

  return (
    <div className="min-h-screen">
      <header className="site-header">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3.5">
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/admin" className="flex items-center gap-3">
              <BrandMark size="sm" showText={false} />
              <span className="font-display text-base font-semibold uppercase tracking-wide text-[var(--text)]">
                Администратор
              </span>
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
            >
              ← Главный экран
            </Link>
          </div>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>
    </div>
  );
}
