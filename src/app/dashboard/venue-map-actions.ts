"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { getSession } from "@/lib/auth/session";
import { cycleMarkerColor, type MarkerColor } from "@/lib/venue-map-markers";

export type VenueMarkerRow = {
  id: string;
  left_pct: number;
  top_pct: number;
  size_pct: number;
  color: MarkerColor;
  created_at: string;
  displayNum: number;
};

function isMarkerColor(s: string): s is MarkerColor {
  return s === "gray" || s === "green" || s === "red";
}

export async function fetchVenueMarkers(): Promise<VenueMarkerRow[]> {
  const session = await getSession();
  if (!session) return [];

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("venue_map_markers")
    .select("id, left_pct, top_pct, size_pct, color, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("fetchVenueMarkers", error.message);
    return [];
  }

  return (data ?? []).map((row, index) => ({
    id: row.id as string,
    left_pct: Number(row.left_pct),
    top_pct: Number(row.top_pct),
    size_pct: Number(row.size_pct ?? 3.4),
    color: isMarkerColor(String(row.color)) ? (row.color as MarkerColor) : "gray",
    created_at: row.created_at as string,
    displayNum: index + 1,
  }));
}

export async function adminAddVenueMarker(
  leftPct: number,
  topPct: number
): Promise<{ ok?: true; error?: string }> {
  const session = await getSession();
  if (!session?.isAdmin) return { error: "Только администратор" };

  const x = Math.min(100, Math.max(0, leftPct));
  const y = Math.min(100, Math.max(0, topPct));

  const supabase = createServiceClient();
  const { error } = await supabase.from("venue_map_markers").insert({
    left_pct: x,
    top_pct: y,
    color: "gray",
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/venue-map");
  return { ok: true as const };
}

export async function adminUpdateVenueMarkerPosition(
  id: string,
  leftPct: number,
  topPct: number
): Promise<{ ok?: true; error?: string }> {
  const session = await getSession();
  if (!session?.isAdmin) return { error: "Только администратор" };

  const x = Math.min(100, Math.max(0, leftPct));
  const y = Math.min(100, Math.max(0, topPct));

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("venue_map_markers")
    .update({ left_pct: x, top_pct: y })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/venue-map");
  return { ok: true as const };
}

export async function adminDeleteVenueMarker(id: string): Promise<{ ok?: true; error?: string }> {
  const session = await getSession();
  if (!session?.isAdmin) return { error: "Только администратор" };

  const supabase = createServiceClient();
  const { error } = await supabase.from("venue_map_markers").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/venue-map");
  return { ok: true as const };
}

export async function adminCycleVenueMarkerColor(id: string): Promise<{ ok?: true; error?: string }> {
  const session = await getSession();
  if (!session?.isAdmin) return { error: "Только администратор" };

  const supabase = createServiceClient();
  const { data: row, error: fetchErr } = await supabase
    .from("venue_map_markers")
    .select("color")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) return { error: fetchErr.message };
  if (!row) return { error: "Маркер не найден" };

  const cur = isMarkerColor(String(row.color)) ? (row.color as MarkerColor) : "gray";
  const next = cycleMarkerColor(cur);

  const { error } = await supabase.from("venue_map_markers").update({ color: next }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/venue-map");
  return { ok: true as const };
}
