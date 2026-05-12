"use client";

import { useActionState } from "react";
import { adminUpdateTaskReport } from "@/app/admin/actions";

async function saveReport(_prev: string | null, formData: FormData): Promise<string | null> {
  const res = await adminUpdateTaskReport(formData);
  if (res && "error" in res) return res.error;
  return null;
}

export function AdminReportRowForm({
  reportId,
  defaultCompleted,
  defaultComment,
}: {
  reportId: string;
  defaultCompleted: boolean;
  defaultComment: string;
}) {
  const [error, formAction, pending] = useActionState(saveReport, null);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="report_id" value={reportId} />
      <label className="flex cursor-pointer items-center gap-2 text-xs">
        <input
          type="checkbox"
          name="task_completed"
          value="true"
          defaultChecked={defaultCompleted}
          className="rounded border-[var(--border)]"
        />
        Выполнено
      </label>
      <textarea name="rapport_comment" className="input min-h-[72px] text-xs" defaultValue={defaultComment} />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button type="submit" className="btn-secondary self-start text-xs" disabled={pending}>
        {pending ? "…" : "Сохранить"}
      </button>
    </form>
  );
}
