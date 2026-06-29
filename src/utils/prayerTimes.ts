import { PRAYER_NAMES, prayers366 } from "./constants.js";

export type PrayerName = (typeof PRAYER_NAMES)[number];

type PrayerRow = (typeof prayers366)[number];

function findDayEntry(date: Date): PrayerRow | undefined {
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  return prayers366.find((p) => p.month_name === month && p.day === day);
}

function parsePrayerTime(date: Date, timeStr: string, daylight: boolean): Date {
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  const year = date.getFullYear();
  const base = new Date(`${month}, ${day}, ${year}, ${timeStr}`);
  if (daylight) {
    return new Date(base.getTime() + 60 * 60 * 1000);
  }
  return base;
}

export function getPrayerTimesForDate(date: Date, daylight: boolean): Date[] {
  const entry = findDayEntry(date);
  if (!entry) return [];
  return PRAYER_NAMES.map((name) =>
    parsePrayerTime(date, entry[name as keyof PrayerRow] as string, daylight),
  );
}

export function todayAndTomorrow(daylight: boolean) {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return {
    today,
    todayPrayers: getPrayerTimesForDate(today, daylight),
    tomorrowPrayers: getPrayerTimesForDate(tomorrow, daylight),
  };
}
