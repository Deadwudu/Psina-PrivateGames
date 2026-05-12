import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/DashboardNav";

const roleLabels: Record<string, string> = {
  side_a: "Сторона А",
  side_b: "Сторона Б",
  admin: "Администратор",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user!.id)
    .single();

  const role = profile?.role ?? "side_a";
  const roleLabel = roleLabels[role] ?? role;

  return (
    <div>
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Главный экран</h1>
          <p className="text-[var(--muted)]">
            {profile?.display_name ?? user?.email} ·{" "}
            <span className="text-[var(--text)]">{roleLabel}</span>
          </p>
        </div>
        {role === "admin" && (
          <Link href="/admin" className="btn-secondary shrink-0 text-sm">
            Панель администратора
          </Link>
        )}
      </div>
      <DashboardNav />
    </div>
  );
}
