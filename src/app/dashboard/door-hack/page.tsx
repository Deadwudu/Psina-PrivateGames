import Link from "next/link";
import { redirect } from "next/navigation";
import { fetchVenueMarkers } from "@/app/dashboard/venue-map-actions";
import { getSession } from "@/lib/auth/session";
import { DoorHackGame } from "@/components/door-hack/DoorHackGame";

export const dynamic = "force-dynamic";

export default async function DoorHackPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const venueMarkers = await fetchVenueMarkers();
  const markers = venueMarkers.map((m) => ({ id: m.id, displayNum: m.displayNum, color: m.color }));

  return (
    <div>
      <Link href="/dashboard" className="mb-6 inline-block text-sm text-[var(--muted)] hover:text-[var(--accent)]">
        ← На главный экран
      </Link>
      <h1 className="mb-2 text-2xl font-semibold">Взлом двери</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        Сначала выберите номер индикатора на карте полигона — после успешного взлома он станет зелёным у всех. Два этапа:
        соединение проводов по подсказке и останов колонок на зелёных буквах кода. Результат уходит администратору.
      </p>
      <DoorHackGame markers={markers} />
    </div>
  );
}
