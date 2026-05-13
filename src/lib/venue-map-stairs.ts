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

/**
 * Позиции в % от левого верхнего угла картинки (как в CSS).
 * Четыре полосы сверху вниз (b0 = верхний этаж на схеме).
 * На этаже по описанию: (1) край слева, (2) средний коридор — левая часть полосы,
 * (3–4) два угла правого коридора.
 *
 * Если всё ещё не попадает — проще всего прислать тот же PNG с от руки нанесёнными
 * метками 1–4 или цветными кружками; подгоним проценты по скрину.
 */
function buildStairs(): StairSpot[] {
  const out: StairSpot[] = [];
  for (let b = 0; b < 4; b++) {
    const bandTop = b * 25;
    const floorNum = 4 - b;
    out.push(
      {
        key: `b${b}-left`,
        label: `${floorNum} эт. · слева`,
        leftPct: 10.5,
        topPct: bandTop + 11,
        sizePct: 3.8,
      },
      {
        key: `b${b}-center`,
        label: `${floorNum} эт. · средний коридор (слева от оси)`,
        leftPct: 42,
        topPct: bandTop + 11,
        sizePct: 3.8,
      },
      {
        key: `b${b}-tr`,
        label: `${floorNum} эт. · правый коридор, верх`,
        leftPct: 83,
        topPct: bandTop + 5,
        sizePct: 3.8,
      },
      {
        key: `b${b}-br`,
        label: `${floorNum} эт. · правый коридор, низ`,
        leftPct: 83,
        topPct: bandTop + 18,
        sizePct: 3.8,
      }
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
