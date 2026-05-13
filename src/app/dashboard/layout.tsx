import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { SignOutButton } from "@/components/SignOutButton";
import { isAppConfigured } from "@/lib/supabase/config";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isAppConfigured()) {
    redirect("/login?missing=config");
  }
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen">
      <header className="site-header">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3.5">
          <Link href="/dashboard" className="flex items-center gap-3 transition-opacity hover:opacity-90">
            <BrandMark size="sm" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="mil-label hidden text-[var(--accent-dim)] sm:inline">
              защищённый канал
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-10">{children}</main>
    </div>
  );
}
