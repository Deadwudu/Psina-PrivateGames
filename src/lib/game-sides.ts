import { createServiceClient } from "@/lib/supabase/service";

export type GameSide = {
  id: string;
  display_name: string;
  sort_order: number;
};

export async function listGameSides(): Promise<GameSide[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("game_sides")
    .select("id, display_name, sort_order")
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("listGameSides", error.message);
    return [];
  }
  return (data ?? []) as GameSide[];
}

export async function getSideLabelMap(): Promise<Map<string, string>> {
  const rows = await listGameSides();
  return new Map(rows.map((r) => [r.id, r.display_name]));
}
