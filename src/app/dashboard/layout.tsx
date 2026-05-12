import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/SignOutButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--panel)]">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/dashboard" className="font-semibold tracking-tight">
            Private Games
          </Link>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </div>
  );
}
