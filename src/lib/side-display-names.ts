import { createServiceClient } from "@/lib/supabase/service";

export type SideDisplayNames = {
  sideA: string;
  sideB: string;
};

const KEY_SIDE_A = "side_a_display_name";
const KEY_SIDE_B = "side_b_display_name";

export const DEFAULT_SIDE_DISPLAY_NAMES: SideDisplayNames = {
  sideA: "Сторона А",
  sideB: "Сторона Б",
};

/** Подписи для роли участника и таблиц админки (admin — фиксированная строка). */
export async function getSideDisplayNames(): Promise<SideDisplayNames> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", [KEY_SIDE_A, KEY_SIDE_B]);

  if (error) {
    console.error("getSideDisplayNames", error.message);
    return DEFAULT_SIDE_DISPLAY_NAMES;
  }

  const map = Object.fromEntries((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]));

  const sideA = String(map[KEY_SIDE_A] ?? "").trim() || DEFAULT_SIDE_DISPLAY_NAMES.sideA;
  const sideB = String(map[KEY_SIDE_B] ?? "").trim() || DEFAULT_SIDE_DISPLAY_NAMES.sideB;

  return { sideA, sideB };
}

export function roleDisplayLabel(
  role: string,
  names: SideDisplayNames,
  adminLabel = "Администратор"
): string {
  if (role === "side_a") return names.sideA;
  if (role === "side_b") return names.sideB;
  if (role === "admin") return adminLabel;
  return role;
}
