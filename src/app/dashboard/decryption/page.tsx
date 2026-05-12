import Link from "next/link";
import { DecryptionPanel } from "@/components/decryption/DecryptionPanel";

export const dynamic = "force-dynamic";

export default function DecryptionPage() {
  return (
    <div>
      <Link href="/dashboard" className="mb-6 inline-block text-sm text-[var(--muted)] hover:text-[var(--accent)]">
        ← На главный экран
      </Link>
      <h1 className="mb-2 text-2xl font-semibold">Дешифровка документов</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        Введите ключ шифрования. При верном значении результат фиксируется в системе.
      </p>
      <DecryptionPanel />
    </div>
  );
}
