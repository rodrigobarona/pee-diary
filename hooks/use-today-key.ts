import * as React from "react";
import { AppState } from "react-native";

import {
  getTodayKey,
  msUntilNextLocalMidnight,
  type DayKey,
} from "@/lib/utils/day";

/**
 * Today's local calendar day ("yyyy-MM-dd"). It changes at local midnight
 * while the app is open, and when the app returns to the foreground on a new
 * day (timers do not run in the background) or after a time-zone change.
 */
export function useTodayKey(): DayKey {
  const [todayKey, setTodayKey] = React.useState(() => getTodayKey());

  React.useEffect(() => {
    // Re-arms itself after every change of day
    const timer = setTimeout(
      () => setTodayKey(getTodayKey()),
      msUntilNextLocalMidnight() + 1000
    );
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") setTodayKey(getTodayKey());
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [todayKey]);

  return todayKey;
}
