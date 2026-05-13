"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { getSession } from "@/lib/auth/session";
import type { StairColor } from "@/lib/venue-map-stairs";
import { STAIR_KEYS } from "@/lib/venue-map-stairs";

export type VenueMapStates = Record<string, StairColor>;

function isStairColor(s: string): s is StairColor {
  return s === "gray" || s === "green" || s === "red";
}

export async function fetchVenueMapStates(): Promise<VenueMapStates> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("venue_stair_states").select("stair_key, color");
  if (error) {
    console.error("fetchVenueMapStates", error.message);
    return Object.fromEntries(STAIR_KEYS.map((k) => [k, "gray" as const]));
  }
  const map: VenueMapStates = Object.fromEntries(STAIR_KEYS.map((k) => [k, "gray" as StairColor]));
  for (const row of data ?? []) {
    const k = row.stair_key as string;
    const c = row.color as string;
    if (STAIR_KEYS.includes(k) && isStairColor(c)) map[k] = c;
  }
  return map;
}

export async function adminSetVenueStairColor(stairKey: string, color: StairColor): Promise<{ ok?: true; error?: string }> {
  const session = await getSession();
  if (!session || session.role !== "admin") return { error: "Только администратор" };
  if (!STAIR_KEYS.includes(stairKey)) return { error: "Неизвестная позиция" };
  if (!isStairColor(color)) return { error: "Неверный цвет" };

  const supabase = createServiceClient();
  const { error } = await supabase.from("venue_stair_states").upsert(
    { stair_key: stairKey, color, updated_at: new Date().toISOString() },
    { onConflict: "stair_key" }
  );
  if (error) return { error: error.message };

  revalidatePath("/dashboard/venue-map");
  return { ok: true as const };
}
