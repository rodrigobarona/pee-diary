import AsyncStorage from "@react-native-async-storage/async-storage";
import { act } from "react";

import { diaryStorage, useDiaryStore } from "@/lib/store";
import {
  DEFAULT_REMINDER_SETTINGS,
  migratePersistedState,
  STORE_NAME,
  STORE_VERSION,
  type PersistedDiaryState,
} from "@/lib/store/persistence";

const defaults: PersistedDiaryState = {
  entries: [],
  language: "en",
  goals: { fluidTarget: 2000 },
  goalHistory: [],
  streak: { currentStreak: 0, lastActiveDate: null },
  openAddMenuOnLaunch: true,
  hasCompletedOnboarding: false,
  termsAcceptedVersion: null,
  termsAcceptedAt: null,
  reminderSettings: DEFAULT_REMINDER_SETTINGS,
};

const validEntry = {
  id: "a",
  type: "fluid",
  timestamp: "2026-11-10T09:00:00.000Z",
  createdAt: "2026-11-10T09:00:00.000Z",
  drinkType: "coffee",
  amount: 200,
};

// What version 0 of the app saved (no version field in the app, zustand's 0)
const versionZeroSnapshot = {
  state: {
    entries: [
      validEntry,
      { id: "broken", type: "urination", volume: "small" }, // no timestamp
    ],
    language: "pt",
    goals: { fluidTarget: 2500, voidTarget: 8 },
    goalHistory: [
      {
        changedAt: "2026-01-01T10:00:00.000Z",
        goals: { fluidTarget: 2000, voidTarget: 8 },
        changes: { voidTarget: { from: 7, to: 8 } },
      },
      {
        changedAt: "2026-01-02T10:00:00.000Z",
        goals: { fluidTarget: 2500, voidTarget: 8 },
        changes: { fluidTarget: { from: 2000, to: 2500 } },
      },
    ],
    streak: { currentStreak: 2, lastActiveDate: "2026-11-10" },
    openAddMenuOnLaunch: false,
    hasCompletedOnboarding: true,
    termsAcceptedVersion: "2026-11-11",
    termsAcceptedAt: "2026-11-11T10:00:00.000Z",
    reminderSettings: { enabled: true, intervalHours: 4 },
  },
  version: 0,
};

// Waits for the recovery copy written in the background
const waitForRecoveryCopies = async (count: number) => {
  for (let i = 0; i < 50; i++) {
    const copies = await diaryStorage.readRecoveryCopies();
    if (copies.length >= count) return copies;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  return diaryStorage.readRecoveryCopies();
};

const loadSaved = async (saved: unknown) => {
  await AsyncStorage.clear();
  await AsyncStorage.setItem(STORE_NAME, JSON.stringify(saved));
  await act(async () => {
    await useDiaryStore.persist.rehydrate();
  });
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("migratePersistedState", () => {
  it("upgrades version 0: drops the visit target and invalid entries, fills in settings", () => {
    const result = migratePersistedState(versionZeroSnapshot.state, 0, defaults);
    expect(result.state.goals).toEqual({ fluidTarget: 2500 });
    expect(result.state.goalHistory).toEqual([
      {
        changedAt: "2026-01-02T10:00:00.000Z",
        goals: { fluidTarget: 2500 },
        changes: { fluidTarget: { from: 2000, to: 2500 } },
      },
    ]);
    expect(result.state.entries).toEqual([validEntry]);
    expect(result.rejectedEntries).toEqual([
      { id: "broken", type: "urination", volume: "small" },
    ]);
    expect(result.state.reminderSettings).toEqual({
      ...DEFAULT_REMINDER_SETTINGS,
      enabled: true,
      intervalHours: 4,
    });
    expect(result.state.language).toBe("pt");
    expect(result.state.hasCompletedOnboarding).toBe(true);
    expect(result.keepFullCopy).toBe(false);
  });

  it("gives a valid state for any saved value", () => {
    for (const saved of [undefined, null, 42, "text", [], { entries: "x" }]) {
      const { state } = migratePersistedState(saved, 0, defaults);
      expect(state.entries).toEqual([]);
      expect(state.goals).toEqual({ fluidTarget: 2000 });
      expect(state.language).toBe("en");
    }
  });

  it("asks for a full copy of data saved by a newer version", () => {
    expect(
      migratePersistedState(versionZeroSnapshot.state, STORE_VERSION + 1, defaults)
        .keepFullCopy
    ).toBe(true);
  });
});

describe("loading saved data", () => {
  it("upgrades a version 0 diary and saves it as the current version", async () => {
    await loadSaved(versionZeroSnapshot);

    const state = useDiaryStore.getState();
    expect(state.entries.map((e) => e.id)).toEqual(["a"]);
    expect(state.goals).toEqual({ fluidTarget: 2500 });
    expect(state.language).toBe("pt");
    expect(state.reminderSettings.intervalHours).toBe(4);
    expect(state.openAddMenuOnLaunch).toBe(false);

    const saved = await diaryStorage.readSaved();
    expect(saved?.version).toBe(STORE_VERSION);
    expect(saved?.state.goals).toEqual({ fluidTarget: 2500 });
    // Only data is saved, not the store's actions
    expect(Object.keys(saved?.state ?? {})).not.toContain("addFluidEntry");

    // The invalid entry is kept on the phone, not discarded
    const copies = await waitForRecoveryCopies(1);
    expect(copies[0]).toMatchObject({
      reason: "invalidEntries",
      version: 0,
      data: [{ id: "broken", type: "urination", volume: "small" }],
    });
  });

  it("leaves out an entry that would crash a screen and keeps it in the recovery copy", async () => {
    await loadSaved({
      state: { ...versionZeroSnapshot.state, entries: [validEntry, { id: "x", type: "leak" }] },
      version: STORE_VERSION,
    });
    expect(useDiaryStore.getState().entries.map((e) => e.id)).toEqual(["a"]);
    const copies = await waitForRecoveryCopies(1);
    expect(copies[0].data).toEqual([{ id: "x", type: "leak" }]);
  });

  it("keeps a full copy of a diary saved by a newer version of the app", async () => {
    const newer = { state: { ...versionZeroSnapshot.state, mood: "new field" }, version: 9 };
    await loadSaved(newer);
    const copies = await waitForRecoveryCopies(1);
    expect(copies[0]).toMatchObject({ reason: "newerVersion", version: 9 });
    expect((copies[0].data as { mood: string }).mood).toBe("new field");
  });

  it("deletes the recovery copies with Clear All Data", async () => {
    await loadSaved(versionZeroSnapshot);
    await waitForRecoveryCopies(1);
    act(() => useDiaryStore.getState().clearAllData());
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(await diaryStorage.readRecoveryCopies()).toEqual([]);
  });
});
