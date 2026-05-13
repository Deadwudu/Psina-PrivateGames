import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getSideDisplayNames } from "@/lib/side-display-names";
import { TaskReportForm, type TaskOption } from "@/components/TaskReportForm";

export const dynamic = "force-dynamic";

type ReportEmbed = {
  id: string;
  user_id: string;
  user_task_id: string | null;
  assignment_batch_id: string | null;
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

  const sideNames = await getSideDisplayNames();

  const supabase = createServiceClient();

  const { data: taskRows } = await supabase
    .from("user_tasks")
    .select("id, title, assignment_batch_id")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false });

  const rows = (taskRows as { id: string; title: string; assignment_batch_id: string | null }[] | null) ?? [];

  const batchIds = [...new Set(rows.map((r) => r.assignment_batch_id).filter((b): b is string => !!b))];

  const batchTitle = new Map<string, string>();
  for (const r of rows) {
    if (r.assignment_batch_id && !batchTitle.has(r.assignment_batch_id)) {
      batchTitle.set(r.assignment_batch_id, r.title);
    }
  }

  let batchReportById = new Map<string, { task_completed: boolean }>();
  if (batchIds.length > 0) {
    const { data: br } = await supabase
      .from("task_reports")
      .select("assignment_batch_id, task_completed")
      .in("assignment_batch_id", batchIds);
    for (const row of (br ?? []) as { assignment_batch_id: string; task_completed: boolean }[]) {
      if (row?.assignment_batch_id) {
        batchReportById.set(row.assignment_batch_id, { task_completed: row.task_completed });
      }
    }
  }

  const personalTaskIds = rows.filter((r) => !r.assignment_batch_id).map((r) => r.id);
  const personalReported = new Set<string>();
  if (personalTaskIds.length > 0) {
    const { data: pr } = await supabase
      .from("task_reports")
      .select("user_task_id")
      .in("user_task_id", personalTaskIds);
    for (const row of (pr ?? []) as { user_task_id: string | null }[]) {
      if (row?.user_task_id) personalReported.add(row.user_task_id);
    }
  }

  const tasks: TaskOption[] = [];
  const seenBatch = new Set<string>();
  for (const t of rows) {
    if (!t.assignment_batch_id) {
      if (!personalReported.has(t.id)) {
        tasks.push({ id: t.id, title: t.title });
      }
    } else if (!seenBatch.has(t.assignment_batch_id)) {
      seenBatch.add(t.assignment_batch_id);
      const br = batchReportById.get(t.assignment_batch_id);
      if (!br || br.task_completed === false) {
        tasks.push({
          id: t.id,
          title: `${t.title} (общая задача стороны)`,
        });
      }
    }
  }

  const { data: myRaw } = await supabase
    .from("task_reports")
    .select("id, user_task_id, assignment_batch_id, task_completed, rapport_comment, content, created_at, user_tasks(title)")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false });

  const { data: batchReportsForMe } =
    batchIds.length > 0
      ? await supabase
          .from("task_reports")
          .select(
            "id, user_task_id, assignment_batch_id, task_completed, rapport_comment, content, created_at, user_tasks(title)"
          )
          .in("assignment_batch_id", batchIds)
      : { data: null as ReportEmbed[] | null };

  const byId = new Map<string, ReportEmbed>();
  for (const r of (myRaw as ReportEmbed[] | null) ?? []) {
    byId.set(r.id, r);
  }
  for (const r of (batchReportsForMe as ReportEmbed[] | null) ?? []) {
    if (!byId.has(r.id)) byId.set(r.id, r);
  }
  const myReports = [...byId.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  let sideReports: ReportEmbed[] = [];
  if (session.role === "side_a" || session.role === "side_b") {
    const { data: mates } = await supabase.from("game_users").select("id").eq("role", session.role);
    const ids = mates?.map((m) => m.id) ?? [];
    if (ids.length > 0) {
      const { data: sideRaw } = await supabase
        .from("task_reports")
        .select(
          "id, user_id, user_task_id, assignment_batch_id, task_completed, rapport_comment, content, created_at, game_users(username, role), user_tasks(title)"
        )
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
        Личная задача — один рапорт навсегда. Общая задача стороны — один рапорт на всю группу: пока не отмечен успех, любой
        участник может отправить или обновить рапорт (например, сначала неудача, затем успех). После отметки «выполнено»
        новые сообщения по этой общей задаче невозможны.
      </p>

      <TaskReportForm tasks={tasks} />

      <section className="mt-12">
        <h2 className="mb-4 text-lg font-medium">Мои рапорты и рапорты по общим задачам</h2>
        {myReports.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Вы ещё не отправляли рапортов.</p>
        ) : (
          <ul className="space-y-3">
            {myReports.map((r) => {
              const ut = one(r.user_tasks);
              const title =
                ut?.title ??
                (r.assignment_batch_id ? batchTitle.get(r.assignment_batch_id) : null) ??
                "Задача";
              return (
                <li key={r.id} className="panel text-sm">
                  <p className="text-xs text-[var(--muted)]">{new Date(r.created_at).toLocaleString("ru-RU")}</p>
                  <p className="mt-1 font-medium">
                    {title}
                    {r.assignment_batch_id && (
                      <span className="ml-2 text-xs font-normal text-[var(--muted)]">(общая)</span>
                    )}
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

      {session.role !== "admin" && (session.role === "side_a" || session.role === "side_b") && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-medium">
            Рапорты своей стороны ({session.role === "side_a" ? sideNames.sideA : sideNames.sideB})
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
                const title =
                  ut?.title ??
                  (r.assignment_batch_id ? batchTitle.get(r.assignment_batch_id) : null) ??
                  "Задача";
                return (
                  <li key={r.id} className="panel text-sm">
                    <p className="text-xs text-[var(--muted)]">{new Date(r.created_at).toLocaleString("ru-RU")}</p>
                    <p className="mt-1 font-medium">
                      {gu?.username ?? "—"} · {title}
                      {r.assignment_batch_id && (
                        <span className="ml-2 text-xs font-normal text-[var(--muted)]">(общая)</span>
                      )}
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
