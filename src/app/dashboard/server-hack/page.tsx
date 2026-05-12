import Link from "next/link";
import { HackResultForm } from "@/components/HackResultForm";

export default function ServerHackPage() {
  return (
    <div>
      <Link href="/dashboard" className="mb-6 inline-block text-sm text-[var(--muted)] hover:text-[var(--accent)]">
        ← На главный экран
      </Link>
      <h1 className="mb-6 text-2xl font-semibold">Взлом сервера</h1>
      <HackResultForm activity="server" />
    </div>
  );
}
