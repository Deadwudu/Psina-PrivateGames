import { createServiceClient } from "@/lib/supabase/service";

type GameUserRow = {
  id: string;
  username: string;
  role: string;
};

export default async function AdminPage() {
  const supabase = createServiceClient();

  const [{ data: reports }, { data: hacks }, { data: users }] = await Promise.all([
    supabase.from("task_reports").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("hack_results").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("game_users").select("id, username, role"),
  ]);

  const userById = Object.fromEntries(
    (users as GameUserRow[] | null)?.map((u) => [u.id, u]) ?? []
  );

  const activityLabel: Record<string, string> = {
    door: "Взлом двери",
    server: "Взлом сервера",
    decryption: "Дешифровка",
  };

  const roleLabel: Record<string, string> = {
    side_a: "Сторона А",
    side_b: "Сторона Б",
    admin: "Админ",
  };

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Обзор мероприятия</h1>
      <p className="mb-8 text-[var(--muted)]">Рапорты и результаты взломов всех участников.</p>

      <section className="mb-12">
        <h2 className="mb-4 text-lg font-medium">Рапорты по задачам</h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-[var(--panel)] text-[var(--muted)]">
              <tr>
                <th className="p-3 font-medium">Время</th>
                <th className="p-3 font-medium">Участник</th>
                <th className="p-3 font-medium">Сторона</th>
                <th className="p-3 font-medium">Задача</th>
                <th className="p-3 font-medium">Текст</th>
              </tr>
            </thead>
            <tbody>
              {(reports ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-[var(--muted)]">
                    Пока нет записей
                  </td>
                </tr>
              )}
              {(reports ?? []).map((r) => {
                const u = userById[r.user_id as string];
                return (
                  <tr key={r.id} className="border-t border-[var(--border)]">
                    <td className="whitespace-nowrap p-3 text-[var(--muted)]">
                      {new Date(r.created_at).toLocaleString("ru-RU")}
                    </td>
                    <td className="p-3">{u?.username ?? r.user_id}</td>
                    <td className="p-3">{u?.role ? (roleLabel[u.role] ?? u.role) : "—"}</td>
                    <td className="max-w-[140px] truncate p-3 text-[var(--muted)]">
                      {r.task_reference ?? "—"}
                    </td>
                    <td className="max-w-md p-3 whitespace-pre-wrap">{r.content}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Взломы и дешифровка</h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-[var(--panel)] text-[var(--muted)]">
              <tr>
                <th className="p-3 font-medium">Время</th>
                <th className="p-3 font-medium">Участник</th>
                <th className="p-3 font-medium">Сторона</th>
                <th className="p-3 font-medium">Тип</th>
                <th className="p-3 font-medium">Исход</th>
                <th className="p-3 font-medium">Детали</th>
              </tr>
            </thead>
            <tbody>
              {(hacks ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-[var(--muted)]">
                    Пока нет записей
                  </td>
                </tr>
              )}
              {(hacks ?? []).map((h) => {
                const u = userById[h.user_id as string];
                const details = h.details as { notes?: string } | null;
                return (
                  <tr key={h.id} className="border-t border-[var(--border)]">
                    <td className="whitespace-nowrap p-3 text-[var(--muted)]">
                      {new Date(h.created_at).toLocaleString("ru-RU")}
                    </td>
                    <td className="p-3">{u?.username ?? h.user_id}</td>
                    <td className="p-3">{u?.role ? (roleLabel[u.role] ?? u.role) : "—"}</td>
                    <td className="p-3">{activityLabel[h.activity_type as string] ?? h.activity_type}</td>
                    <td className="p-3">{h.success ? "успех" : "провал"}</td>
                    <td className="max-w-md p-3 whitespace-pre-wrap">{details?.notes ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
