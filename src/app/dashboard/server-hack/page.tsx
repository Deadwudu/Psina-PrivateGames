import Link from "next/link";
import { ServerHackGame } from "@/components/server-hack/ServerHackGame";

export const dynamic = "force-dynamic";

export default function ServerHackPage() {
  return (
    <div>
      <Link href="/dashboard" className="mb-6 inline-block text-sm text-[var(--muted)] hover:text-[var(--accent)]">
        ← На главный экран
      </Link>
      <h1 className="mb-2 text-2xl font-semibold">Взлом сервера</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        Четыре этапа: перехват токена в логе, повтор последовательности Саймона, «IDS» из переключателей и ламп, сборка
        цепочки эксплойта. Неверные действия не срабатывают; проигрыша нет.
      </p>
      <ServerHackGame />
    </div>
  );
}
