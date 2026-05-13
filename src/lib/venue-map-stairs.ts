/** Цвет индикатора лестницы на карте полигона */
export type StairColor = "gray" | "green" | "red";

/** Позиции квадратов в % относительно контейнера с картинкой */
export type StairSpot = {
  /** Уникальный ключ в БД, напр. b0-left */
  key: string;
  /** Уникальный номер на карте (1…12) — три этажа × четыре лестницы */
  displayNum: number;
  label: string;
  leftPct: number;
  topPct: number;
  sizePct: number;
};

/** На актуальной схеме три этажа сверху вниз: 4, 3, 2 */
const FLOOR_BANDS = 3;
const BAND_PCT = 100 / FLOOR_BANDS;

/**
 * Красные круги на вашей разметке: слева | средний коридор (слева от оси) |
 * правый верх | правый низ. Позиции подогнаны под треть высоты изображения на этаж.
 */
function buildStairs(): StairSpot[] {
  const out: StairSpot[] = [];
  let displayNum = 1;
  for (let b = 0; b < FLOOR_BANDS; b++) {
    const bandTop = b * BAND_PCT;
    const floorNum = 4 - b;
    const spots: {
      slot: string;
      label: string;
      leftPct: number;
      topPct: number;
      sizePct: number;
    }[] = [
      {
        slot: "left",
        label: `${floorNum} эт. · слева`,
        leftPct: 9.5,
        topPct: bandTop + 14,
        sizePct: 3.4,
      },
      {
        slot: "center",
        label: `${floorNum} эт. · средний коридор`,
        leftPct: 46,
        topPct: bandTop + 14,
        sizePct: 3.4,
      },
      {
        slot: "tr",
        label: `${floorNum} эт. · правый верх`,
        leftPct: 84,
        topPct: bandTop + 6.5,
        sizePct: 3.4,
      },
      {
        slot: "br",
        label: `${floorNum} эт. · правый низ`,
        leftPct: 84,
        topPct: bandTop + 23.5,
        sizePct: 3.4,
      },
    ];
    for (const s of spots) {
      out.push({
        key: `b${b}-${s.slot}`,
        displayNum,
        label: s.label,
        leftPct: s.leftPct,
        topPct: s.topPct,
        sizePct: s.sizePct,
      });
      displayNum += 1;
    }
  }
  return out;
}

export const VENUE_STAIRS = buildStairs();

export const STAIR_KEYS = VENUE_STAIRS.map((s) => s.key);

export function cycleStairColor(current: StairColor): StairColor {
  if (current === "gray") return "green";
  if (current === "green") return "red";
  return "gray";
}
