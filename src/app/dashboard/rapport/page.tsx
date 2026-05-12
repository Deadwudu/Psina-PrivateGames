import Link from "next/link";
import { TaskReportForm } from "@/components/TaskReportForm";

export default function RapportPage() {
  return (
    <div>
      <Link href="/dashboard" className="mb-6 inline-block text-sm text-[var(--muted)] hover:text-[var(--accent)]">
        ← На главный экран
      </Link>
      <h1 className="mb-6 text-2xl font-semibold">Рапорт по задаче</h1>
      <p className="mb-6 text-[var(--muted)]">
        Текст сохраняется в Supabase и доступен администратору на панели обзора.
      </p>
      <TaskReportForm />
    </div>
  );
}
