import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { getSession } from "@/lib/auth/session";
import { toggleTaskStatus } from "@/app/dashboard/actions";
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
      <h1 className="mb-2 text-2xl font-semibold">Мои задачи</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        Задания выдаёт администратор. Здесь заголовок и полный текст задачи.
      </p>

      <ul className="space-y-4">
        {(tasks ?? []).length === 0 && (
          <li className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-[var(--muted)]">
            Пока нет задач. Администратор выдаст их в панели «Администратор».
          </li>
        )}
        {(tasks ?? []).map((t) => (
          <li key={t.id} className="panel flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
                Статус: {t.status === "done" ? "выполнено" : "в работе"}
              </p>
            </div>
            <form action={toggleTaskStatus} className="shrink-0">
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
