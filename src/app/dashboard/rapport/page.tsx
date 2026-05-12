import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { TaskReportForm, type TaskOption } from "@/components/TaskReportForm";

export const dynamic = "force-dynamic";

type ReportEmbed = {
  id: string;
  user_id: string;
  user_task_id: string | null;
  task_completed: boolean | null;
  rapport_comment: string | null;
  content: string | null;
  task_reference: string | null;
  created_at: string;
  game_users: { username: string; role?: string } | { username: string; role?: string }[] | null;
  user_tasks: { title: string } | { title: string }[] | null;
};

function one<T>(rel: T | T[] | null | undefined): T | null {
  if (!rel) return null;
  return Array.isArray(rel) ? rel[0] ?? null : rel;
}

function reportComment(r: ReportEmbed): string {
  const c = r.rapport_comment?.trim();
  if (c) return r.rapport_comment ?? "";
  return (r.content ?? "").trim();
}

export default async function RapportPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const supabase = createServiceClient();

  const { data: taskRows } = await supabase
    .from("user_tasks")
    .select("id, title")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false });

  const allTasks =
    (taskRows as { id: string; title: string }[] | null)?.map((t) => ({
      id: t.id,
      title: t.title,
    })) ?? [];

  const { data: reportedRows } = await supabase
    .from("task_reports")
    .select("user_task_id")
    .eq("user_id", session.userId)
    .not("user_task_id", "is", null);

  const reportedIds = new Set(
    (reportedRows as { user_task_id: string | null }[] | null)
      ?.map((r) => r.user_task_id)
      .filter((id): id is string => !!id) ?? []
  );

  const tasks: TaskOption[] = allTasks.filter((t) => !reportedIds.has(t.id));

  const { data: myRaw } = await supabase
    .from("task_reports")
    .select("id, task_completed, rapport_comment, content, created_at, user_tasks(title)")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false });

  const myReports = (myRaw as ReportEmbed[] | null) ?? [];

  let sideReports: ReportEmbed[] = [];
  if (session.role === "side_a" || session.role === "side_b") {
    const { data: mates } = await supabase.from("game_users").select("id").eq("role", session.role);
    const ids = mates?.map((m) => m.id) ?? [];
    if (ids.length > 0) {
      const { data: sideRaw } = await supabase
        .from("task_reports")
        .select("id, user_id, task_completed, rapport_comment, content, created_at, game_users(username, role), user_tasks(title)")
        .in("user_id", ids)
        .order("created_at", { ascending: false })
        .limit(150);
      sideReports = (sideRaw as ReportEmbed[] | null) ?? [];
    }
  }

  return (
    <div>
      <Link href="/dashboard" className="mb-6 inline-block text-sm text-[var(--muted)] hover:text-[var(--accent)]">
        ← На главный экран
      </Link>
      <h1 className="mb-2 text-2xl font-semibold">Рапорт по задаче</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        Выберите задачу без рапорта, отметьте выполнение и добавьте комментарий. По одной задаче можно отправить только один рапорт — повторно выбрать её не получится.
      </p>

      <TaskReportForm tasks={tasks} />

      <section className="mt-12">
        <h2 className="mb-4 text-lg font-medium">Мои рапорты</h2>
        {myReports.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Вы ещё не отправляли рапортов.</p>
        ) : (
          <ul className="space-y-3">
            {myReports.map((r) => {
              const ut = one(r.user_tasks);
              return (
                <li key={r.id} className="panel text-sm">
                  <p className="text-xs text-[var(--muted)]">{new Date(r.created_at).toLocaleString("ru-RU")}</p>
                  <p className="mt-1 font-medium">{ut?.title ?? "Задача"}</p>
                  <p className="mt-2 text-[var(--muted)]">
                    Выполнение:{" "}
                    <span className="text-[var(--text)]">{r.task_completed ? "выполнено" : "не выполнено"}</span>
                  </p>
                  <p className="mt-2 whitespace-pre-wrap">{reportComment(r) || "—"}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {session.role !== "admin" && (session.role === "side_a" || session.role === "side_b") && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-medium">
            Рапорты своей стороны ({session.role === "side_a" ? "А" : "Б"})
          </h2>
          <p className="mb-4 text-sm text-[var(--muted)]">
            Видны только участники вашей стороны. Все рапорты, в том числе ваши.
          </p>
          {sideReports.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Пока нет рапортов.</p>
          ) : (
            <ul className="space-y-3">
              {sideReports.map((r) => {
                const gu = one(r.game_users);
                const ut = one(r.user_tasks);
                return (
                  <li key={r.id} className="panel text-sm">
                    <p className="text-xs text-[var(--muted)]">{new Date(r.created_at).toLocaleString("ru-RU")}</p>
                    <p className="mt-1 font-medium">
                      {gu?.username ?? "—"} · {ut?.title ?? "Задача"}
                    </p>
                    <p className="mt-2 text-[var(--muted)]">
                      Выполнение:{" "}
                      <span className="text-[var(--text)]">{r.task_completed ? "выполнено" : "не выполнено"}</span>
                    </p>
                    <p className="mt-2 whitespace-pre-wrap">{reportComment(r) || "—"}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
