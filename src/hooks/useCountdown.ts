import { useEffect, useState } from "react";
import { getCountdownState, formatRemaining, CountdownState } from "../utils/countdown";
import type { AppSettings } from "../utils/settings";

export function useCountdown(settings: AppSettings): CountdownState & { timeText: string } {
  const [state, setState] = useState(() => {
    const s = getCountdownState(new Date(), settings.daylight, settings.iqamaOffsets);
    return { ...s, timeText: formatRemaining(s.remainingMs) };
  });

  useEffect(() => {
    const tick = () => {
      const s = getCountdownState(new Date(), settings.daylight, settings.iqamaOffsets);
      setState({ ...s, timeText: formatRemaining(s.remainingMs) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [settings.daylight, settings.iqamaOffsets]);

  return state;
}
