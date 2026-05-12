import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { isAppConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (!isAppConfigured()) {
    redirect("/login?missing=config");
  }
  const session = await getSession();
  if (session) redirect("/dashboard");
  redirect("/login");
}
