import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { fetchVenueMapImages, fetchVenueMarkers } from "@/app/dashboard/venue-map-actions";
import { VenueMapClient } from "@/components/venue-map/VenueMapClient";

export const dynamic = "force-dynamic";

export default async function VenueMapPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [images, markers] = await Promise.all([fetchVenueMapImages(), fetchVenueMarkers()]);

  return (
    <div>
      <Link href="/dashboard" className="mb-6 inline-block text-sm text-[var(--muted)] hover:text-[var(--accent)]">
        ← На главный экран
      </Link>
      <h1 className="mb-2 text-2xl font-semibold">Карта полигона</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        Один или несколько планов (этажей): администратор загружает изображения и может менять их порядок перетаскиванием.
        Индикаторы ставятся на выбранном слое кликом по карте.
      </p>
      <VenueMapClient images={images} initialMarkers={markers} isAdmin={session.isAdmin} />
    </div>
  );
}
