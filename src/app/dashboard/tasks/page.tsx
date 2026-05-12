import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

type RepRow = {
  id: string;
  task_completed: boolean | null;
  rapport_comment: string | null;
};

type BatchRepRow = RepRow & { assignment_batch_id: string };

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  assignment_batch_id: string | null;
};

function repComment(rep: RepRow | null): string | null {
  if (!rep) return null;
  const c = (rep.rapport_comment ?? "").trim();
  if (c) return rep.rapport_comment ?? null;
  return null;
}

export default async function TasksPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const supabase = createServiceClient();
  const { data: tasks } = await supabase
    .from("user_tasks")
    .select("id, title, description, status, assignment_batch_id")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false });

  const list = (tasks as TaskRow[] | null) ?? [];

  const batchIds = [...new Set(list.map((t) => t.assignment_batch_id).filter((b): b is string => !!b))];

  const repByBatch = new Map<string, RepRow>();
  if (batchIds.length > 0) {
    const { data: br } = await supabase
      .from("task_reports")
      .select("id, assignment_batch_id, task_completed, rapport_comment")
      .in("assignment_batch_id", batchIds);
    for (const r of (br as BatchRepRow[] | null) ?? []) {
      if (r.assignment_batch_id) repByBatch.set(r.assignment_batch_id, r);
    }
  }

  const personalIds = list.filter((t) => !t.assignment_batch_id).map((t) => t.id);
  const repByPersonalTask = new Map<string, RepRow>();
  if (personalIds.length > 0) {
    const { data: pr } = await supabase
      .from("task_reports")
      .select("id, user_task_id, task_completed, rapport_comment")
      .in("user_task_id", personalIds);
    for (const r of (pr as (RepRow & { user_task_id: string })[] | null) ?? []) {
      if (r.user_task_id) repByPersonalTask.set(r.user_task_id, r);
    }
  }

  function repFor(t: TaskRow): RepRow | null {
    if (t.assignment_batch_id) return repByBatch.get(t.assignment_batch_id) ?? null;
    return repByPersonalTask.get(t.id) ?? null;
  }

  return (
    <div>
      <Link href="/dashboard" className="mb-6 inline-block text-sm text-[var(--muted)] hover:text-[var(--accent)]">
        ← На главный экран
      </Link>
      <h1 className="mb-2 text-2xl font-semibold">Мои задачи</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        Задания выдаёт администратор. Для личной задачи рапорт только ваш. Для общей задачи стороны статус и текст рапорта
        общие для всех копий у вас в списке.
      </p>

      <ul className="space-y-4">
        {list.length === 0 && (
          <li className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-[var(--muted)]">
            Пока нет задач. Администратор выдаст их в панели «Администратор».
          </li>
        )}
        {list.map((t) => {
          const rep = repFor(t);
          const comment = repComment(rep);
          return (
            <li key={t.id} className="panel flex flex-col gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold leading-snug">{t.title}</h2>
                {t.assignment_batch_id && (
                  <p className="mt-1 text-xs text-amber-400/90">Общая задача стороны — один рапорт на всех до отметки «выполнено».</p>
                )}
                <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text)]">
                  {(t.description as string | null)?.trim() ? (
                    (t.description as string)
                  ) : (
                    <span className="text-[var(--muted)]">Текст задания не указан.</span>
                  )}
                </div>
                <p className="mt-3 text-xs uppercase tracking-wide text-[var(--muted)]">
                  Статус задания: {t.status === "done" ? "выполнено" : "в работе"}
                </p>
                {rep && (
                  <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--panel)]/50 p-3 text-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                      Рапорт{t.assignment_batch_id ? " стороны" : ""}
                    </p>
                    <p className="mt-1 text-[var(--muted)]">
                      Отметка:{" "}
                      <span className="text-[var(--text)]">
                        {rep.task_completed ? "выполнено" : "не выполнено"}
                      </span>
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-[var(--text)]">
                      {comment?.trim() ? (
                        comment
                      ) : (
                        <span className="text-[var(--muted)]">Комментарий пустой</span>
                      )}
                    </p>
                  </div>
                )}
                {!rep && (
                  <p className="mt-3 text-sm text-[var(--muted)]">
                    Рапорт по этой задаче ещё не отправлен — раздел «Рапорт по задаче».
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
