/** Цвет индикатора лестницы на карте полигона */
export type StairColor = "gray" | "green" | "red";

/** Позиции квадратов в % относительно контейнера с картинкой */
export type StairSpot = {
  key: string;
  label: string;
  leftPct: number;
  topPct: number;
  sizePct: number;
};

function buildStairs(): StairSpot[] {
  const out: StairSpot[] = [];
  for (let b = 0; b < 4; b++) {
    const bandTop = b * 25;
    const floorNum = 4 - b;
    out.push(
      { key: `b${b}-left`, label: `${floorNum} эт. · левая лестница`, leftPct: 17.5, topPct: bandTop + 9.5, sizePct: 4 },
      { key: `b${b}-center`, label: `${floorNum} эт. · центр`, leftPct: 46.5, topPct: bandTop + 9.5, sizePct: 4 },
      { key: `b${b}-tr`, label: `${floorNum} эт. · верх справа`, leftPct: 76, topPct: bandTop + 4.2, sizePct: 4 },
      { key: `b${b}-br`, label: `${floorNum} эт. · низ справа`, leftPct: 76, topPct: bandTop + 17.5, sizePct: 4 }
    );
  }
  return out;
}

/** Четыре полосы сверху вниз (как на схеме), по 4 лестничных узла */
export const VENUE_STAIRS = buildStairs();

export const STAIR_KEYS = VENUE_STAIRS.map((s) => s.key);

export function cycleStairColor(current: StairColor): StairColor {
  if (current === "gray") return "green";
  if (current === "green") return "red";
  return "gray";
}
