import { PRAYER_NAMES, PRAYER_NAMES_ARABIC } from "./constants.js";
import { nextPrayer } from "./nextPrayer";
import { todayAndTomorrow } from "./prayerTimes";

export type CountdownMode = "prayer" | "iqama";

export interface CountdownState {
  mode: CountdownMode;
  prefix: string;
  target: string;
  remainingMs: number;
  isIqamaWindow: boolean;
}

export function formatRemaining(ms: number): string {
  if (ms <= 0) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${minutes}:${pad(seconds)}`;
}

function comingPrayerIndex(comingPrayer: Date, daylight: boolean): number {
  const { todayPrayers, tomorrowPrayers } = todayAndTomorrow(daylight);
  const idx = todayPrayers.findIndex((t) => t.getTime() === comingPrayer.getTime());
  if (idx >= 0) return idx;
  if (tomorrowPrayers[0]?.getTime() === comingPrayer.getTime()) return 0;
  return -1;
}

function prayerDisplay(
  prayerIndex: number,
  comingIndex: number,
): Pick<CountdownState, "prefix" | "target"> {
  if (prayerIndex === 5 && comingIndex === 0) {
    return { prefix: "المتبقى على", target: "فجر الغد" };
  }
  if (comingIndex === 1) {
    return { prefix: "المتبقى على", target: "الشروق" };
  }
  if (comingIndex >= 0) {
    return { prefix: "المتبقى على", target: PRAYER_NAMES_ARABIC[comingIndex] };
  }
  return { prefix: "—", target: "" };
}

function iqamaDisplay(prayerIndex: number): Pick<CountdownState, "prefix" | "target"> {
  if (prayerIndex === 1) {
    return { prefix: "المتبقى على", target: "الضحى" };
  }
  return { prefix: "المتبقى على إقامة", target: PRAYER_NAMES_ARABIC[prayerIndex] };
}

export function getCountdownState(
  now: Date,
  daylight: boolean,
  iqamaOffsets: number[],
): CountdownState {
  const { currentPrayer, comingPrayer, prayerIndex } = nextPrayer(daylight);
  const isFriday = now.getDay() === 5;

  if (currentPrayer && prayerIndex >= 0) {
    const prayerName = PRAYER_NAMES[prayerIndex];
    const skipIqama = isFriday && prayerName === "dhuhr";
    const offset = iqamaOffsets[prayerIndex] ?? 15;

    if (!skipIqama && offset > 0 && now >= currentPrayer) {
      const iqamaEnd = new Date(currentPrayer.getTime() + offset * 60_000);
      if (now < iqamaEnd) {
        return {
          mode: "iqama",
          ...iqamaDisplay(prayerIndex),
          remainingMs: iqamaEnd.getTime() - now.getTime(),
          isIqamaWindow: true,
        };
      }
    }
  }

  if (comingPrayer) {
    const comingIndex = comingPrayerIndex(comingPrayer, daylight);
    return {
      mode: "prayer",
      ...prayerDisplay(prayerIndex, comingIndex),
      remainingMs: Math.max(0, comingPrayer.getTime() - now.getTime()),
      isIqamaWindow: false,
    };
  }

  return {
    mode: "prayer",
    prefix: "—",
    target: "",
    remainingMs: 0,
    isIqamaWindow: false,
  };
}
