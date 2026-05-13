"use client";

import { useActionState } from "react";
import { adminPurgeEventData, type AdminPurgeResult } from "@/app/admin/actions";

async function purgeAction(
  _prev: AdminPurgeResult | null,
  formData: FormData
): Promise<AdminPurgeResult | null> {
  return adminPurgeEventData(formData);
}

export function AdminPurgeEventForm() {
  const [state, formAction, pending] = useActionState(purgeAction, null);

  return (
    <section className="mb-12 rounded-sm border-2 border-red-900/70 bg-red-950/20 p-6">
      <h2 className="text-lg font-medium text-red-200/95">Сброс данных мероприятия</h2>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Удаляются только игровые записи из базы. Позывные, пароли, роли игроков и{" "}
        <strong className="text-[var(--text)]">названия сторон</strong> сохраняются. Действие необратимо — используйте после
        окончания смены.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <div className="space-y-3 text-sm">
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" name="purge_reports" className="mt-1 accent-red-500" />
            <span>
              <strong className="text-[var(--text)]">Рапорты</strong> — все записи в разделе рапортов (если не выбрано удаление
              задач ниже).
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" name="purge_tasks" className="mt-1 accent-red-500" />
            <span>
              <strong className="text-[var(--text)]">Выданные задачи</strong> — все строки задач у игроков; при этом{" "}
              <strong>все рапорты</strong> удаляются автоматически (общие и личные).
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" name="purge_hacks" className="mt-1 accent-red-500" />
            <span>
              <strong className="text-[var(--text)]">Взломы и дешифровка</strong> — результаты из hack_results (дверь,
              сервер, дешифровка).
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" name="purge_venue_markers" className="mt-1 accent-red-500" />
            <span>
              <strong className="text-[var(--text)]">Маркеры карты полигона</strong> — все точки на плане (позиции и цвета).
            </span>
          </label>
        </div>

        <div>
          <label htmlFor="purge-confirm" className="mb-1 block text-sm text-red-200/90">
            Введите слово <span className="font-mono font-semibold">УДАЛИТЬ</span> для подтверждения
          </label>
          <input
            id="purge-confirm"
            name="purge_confirm"
            type="text"
            className="input border-red-900/50 bg-black/40 font-mono"
            placeholder="УДАЛИТЬ"
            autoComplete="off"
          />
        </div>

        {state && "error" in state && <p className="text-sm text-red-400">{state.error}</p>}
        {state && "ok" in state && state.ok && (
          <p className="text-sm text-emerald-400/90">
            Очищено: {state.cleared.join(" · ")}
          </p>
        )}

        <button type="submit" className="btn-secondary border-red-800/80 text-red-200 hover:bg-red-950/50" disabled={pending}>
          {pending ? "Удаление…" : "Выполнить очистку"}
        </button>
      </form>
    </section>
  );
}
