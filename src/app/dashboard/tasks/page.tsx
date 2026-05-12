import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

type Rep = { id: string; task_completed: boolean | null; rapport_comment: string | null } | null;

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  task_reports: Rep | Rep[] | null;
};

function firstRep(t: TaskRow): Rep | null {
  const r = t.task_reports;
  if (!r) return null;
  return Array.isArray(r) ? r[0] ?? null : r;
}

function repComment(rep: Rep): string | null {
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
    .select("id, title, description, status, task_reports(id, task_completed, rapport_comment)")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false });

  const list = (tasks as TaskRow[] | null) ?? [];

  return (
    <div>
      <Link href="/dashboard" className="mb-6 inline-block text-sm text-[var(--muted)] hover:text-[var(--accent)]">
        ← На главный экран
      </Link>
      <h1 className="mb-2 text-2xl font-semibold">Мои задачи</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        Задания выдаёт администратор. Статус «выполнено» и комментарий подтягиваются из вашего рапорта по задаче.
      </p>

      <ul className="space-y-4">
        {list.length === 0 && (
          <li className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-[var(--muted)]">
            Пока нет задач. Администратор выдаст их в панели «Администратор».
          </li>
        )}
        {list.map((t) => {
          const rep = firstRep(t);
          const comment = repComment(rep);
          return (
            <li key={t.id} className="panel flex flex-col gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold leading-snug">{t.title}</h2>
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
                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Ваш рапорт</p>
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
