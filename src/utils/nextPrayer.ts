import { todayAndTomorrow } from "./prayerTimes";

export interface NextPrayerResult {
  currentPrayer?: Date;
  comingPrayer?: Date;
  prayerIndex: number;
}

export function nextPrayer(daylight: boolean): NextPrayerResult {
  const { today, todayPrayers, tomorrowPrayers } = todayAndTomorrow(daylight);

  if (todayPrayers.length === 0) {
    return { prayerIndex: -1 };
  }

  let currentPrayer: Date | undefined;
  let comingPrayer: Date | undefined;
  let prayerIndex = -1;

  for (let i = 0; i < todayPrayers.length - 1; i++) {
    if (today > todayPrayers[i] && today < todayPrayers[i + 1]) {
      currentPrayer = todayPrayers[i];
      comingPrayer = todayPrayers[i + 1];
      prayerIndex = i;
      break;
    }
  }

  if (!comingPrayer && today > todayPrayers[5] && today < tomorrowPrayers[0]) {
    currentPrayer = todayPrayers[5];
    comingPrayer = tomorrowPrayers[0];
    prayerIndex = 5;
  }

  if (!comingPrayer && today < todayPrayers[0]) {
    comingPrayer = todayPrayers[0];
    currentPrayer = todayPrayers[5];
    prayerIndex = 5;
  }

  return { currentPrayer, comingPrayer, prayerIndex };
}
