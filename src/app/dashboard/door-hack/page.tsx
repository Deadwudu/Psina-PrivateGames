import Link from "next/link";
import { DoorHackGame } from "@/components/door-hack/DoorHackGame";

export const dynamic = "force-dynamic";

export default function DoorHackPage() {
  return (
    <div>
      <Link href="/dashboard" className="mb-6 inline-block text-sm text-[var(--muted)] hover:text-[var(--accent)]">
        ← На главный экран
      </Link>
      <h1 className="mb-2 text-2xl font-semibold">Взлом двери</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        Два этапа: соединение проводов по подсказке и останов колонок на зелёных буквах кода. После успеха результат
        уходит администратору.
      </p>
      <DoorHackGame />
    </div>
  );
}
