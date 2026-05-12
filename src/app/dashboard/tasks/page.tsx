import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { getSession } from "@/lib/auth/session";
import { createUserTask, toggleTaskStatus } from "@/app/dashboard/actions";
import { redirect } from "next/navigation";

export default async function TasksPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const supabase = createServiceClient();
  const { data: tasks } = await supabase
    .from("user_tasks")
    .select("*")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false });

  return (
    <div>
      <Link href="/dashboard" className="mb-6 inline-block text-sm text-[var(--muted)] hover:text-[var(--accent)]">
        ← На главный экран
      </Link>
      <h1 className="mb-6 text-2xl font-semibold">Мои задачи</h1>

      <div className="panel mb-8">
        <h2 className="mb-4 text-sm font-medium text-[var(--muted)]">Новая задача (черновик для мероприятия)</h2>
        <form action={createUserTask} className="space-y-3">
          <input name="title" className="input" placeholder="Название" required />
          <textarea name="description" className="input min-h-[80px]" placeholder="Описание (необязательно)" />
          <button type="submit" className="btn-primary">
            Добавить
          </button>
        </form>
      </div>

      <ul className="space-y-3">
        {(tasks ?? []).length === 0 && (
          <li className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-[var(--muted)]">
            Пока нет задач. Администратор может добавить вам задания в Supabase или вы создаёте свои выше.
          </li>
        )}
        {(tasks ?? []).map((t) => (
          <li key={t.id} className="panel flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{t.title}</p>
              {t.description && (
                <p className="mt-1 text-sm text-[var(--muted)]">{t.description}</p>
              )}
              <p className="mt-2 text-xs uppercase tracking-wide text-[var(--muted)]">
                Статус: {t.status}
              </p>
            </div>
            <form action={toggleTaskStatus}>
              <input type="hidden" name="task_id" value={t.id} />
              <input
                type="hidden"
                name="next_status"
                value={t.status === "done" ? "pending" : "done"}
              />
              <button type="submit" className="btn-secondary text-sm">
                {t.status === "done" ? "Снять «выполнено»" : "Отметить выполненной"}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
