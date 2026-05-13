/** Цвет индикатора на карте полигона */
export type MarkerColor = "gray" | "green" | "red";

export function cycleMarkerColor(current: MarkerColor): MarkerColor {
  if (current === "gray") return "green";
  if (current === "green") return "red";
  return "gray";
}
