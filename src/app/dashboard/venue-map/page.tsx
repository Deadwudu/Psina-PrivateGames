import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { fetchVenueMarkers } from "@/app/dashboard/venue-map-actions";
import { VenueMapClient } from "@/components/venue-map/VenueMapClient";

export const dynamic = "force-dynamic";

export default async function VenueMapPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const markers = await fetchVenueMarkers();

  return (
    <div>
      <Link href="/dashboard" className="mb-6 inline-block text-sm text-[var(--muted)] hover:text-[var(--accent)]">
        ← На главный экран
      </Link>
      <h1 className="mb-2 text-2xl font-semibold">Карта полигона</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        План этажей: администратор расставляет индикаторы на карте; номер задаётся автоматически по порядку добавления.
      </p>
      <VenueMapClient initialMarkers={markers} isAdmin={session.role === "admin"} />
    </div>
  );
}
