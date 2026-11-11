/** @jest-environment-options {"timezone": "Europe/Madrid"} */
// Spain is east of UTC: an entry at 00:30 local time is still the previous
// day in UTC. The streak and the goals must follow the local day.
import { act } from "react";

import { calculateStreak, useDiaryStore } from "@/lib/store";

// A local time in Madrid, as the ISO timestamp the app stores
const local = (y: number, m: number, d: number, h = 12, min = 0) =>
  new Date(y, m - 1, d, h, min).toISOString();

describe("streak in local days (Europe/Madrid)", () => {
  const now = new Date(2026, 10, 11, 9, 0); // 11 Nov 2026, 09:00

  it("counts an entry at 00:30 for the day it was made", () => {
    const timestamp = local(2026, 11, 11, 0, 30);
    expect(timestamp).toBe("2026-11-10T23:30:00.000Z"); // the UTC date is 10 Nov
    expect(calculateStreak([{ timestamp }], now)).toEqual({
      currentStreak: 1,
      lastActiveDate: "2026-11-11",
    });
  });

  it("counts consecutive local days ending today", () => {
    const entries = [
      { timestamp: local(2026, 11, 9, 23, 45) },
      { timestamp: local(2026, 11, 10, 0, 15) },
      { timestamp: local(2026, 11, 11, 0, 30) },
    ];
    expect(calculateStreak(entries, now)).toEqual({
      currentStreak: 3,
      lastActiveDate: "2026-11-11",
    });
  });

  it("keeps the streak until the end of the day after the last entry", () => {
    const entries = [
      { timestamp: local(2026, 11, 9) },
      { timestamp: local(2026, 11, 10, 23, 30) },
    ];
    expect(calculateStreak(entries, now)).toEqual({
      currentStreak: 2,
      lastActiveDate: "2026-11-10",
    });
  });

  it("is broken after a day without entries", () => {
    expect(calculateStreak([{ timestamp: local(2026, 11, 9) }], now)).toEqual({
      currentStreak: 0,
      lastActiveDate: "2026-11-09",
    });
    expect(calculateStreak([], now)).toEqual({
      currentStreak: 0,
      lastActiveDate: null,
    });
  });

  it("counts across the change to summer time", () => {
    // Clocks go forward on 29 March 2026 in Spain
    const entries = [27, 28, 29, 30].map((d) => ({
      timestamp: local(2026, 3, d, 0, 10),
    }));
    expect(calculateStreak(entries, new Date(2026, 2, 30, 8))).toEqual({
      currentStreak: 4,
      lastActiveDate: "2026-03-30",
    });
  });
});

describe("store actions keep the streak current", () => {
  beforeEach(() => {
    act(() => useDiaryStore.getState().clearAllData());
  });

  it("updates the streak when an entry is deleted or moved to another day", () => {
    const store = useDiaryStore.getState();
    act(() => {
      store.addFluidEntry({ drinkType: "water", amount: 250 });
    });
    const [entry] = useDiaryStore.getState().entries;
    expect(useDiaryStore.getState().streak.currentStreak).toBe(1);

    act(() => {
      store.updateEntry(entry.id, {
        timestamp: new Date(Date.now() - 5 * 86_400_000).toISOString(),
      });
    });
    expect(useDiaryStore.getState().streak.currentStreak).toBe(0);

    act(() => {
      store.deleteEntry(entry.id);
    });
    expect(useDiaryStore.getState().streak).toEqual({
      currentStreak: 0,
      lastActiveDate: null,
    });
  });
});

describe("goals for a local day", () => {
  it("applies a goal change made late in the day to that day", () => {
    useDiaryStore.setState({
      goals: { fluidTarget: 2500 },
      goalHistory: [
        {
          // 23:30 in Madrid on 10 Nov
          changedAt: local(2026, 11, 10, 23, 30),
          goals: { fluidTarget: 2500 },
          changes: { fluidTarget: { from: 1800, to: 2500 } },
        },
      ],
    });
    const { getGoalsForDate } = useDiaryStore.getState();
    expect(getGoalsForDate("2026-11-10")).toEqual({ fluidTarget: 2500 });
    expect(getGoalsForDate("2026-11-09")).toEqual({ fluidTarget: 1800 });
  });
});
