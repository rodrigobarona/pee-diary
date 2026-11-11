import AsyncStorage from "@react-native-async-storage/async-storage";

import { TERMS_VERSION } from "@/constants/legal";
import { diaryStorage, useDiaryStore } from "@/lib/store";
import { act } from "react";

// Reset store before each test
beforeEach(() => {
  const { clearAllData } = useDiaryStore.getState();
  act(() => {
    clearAllData();
  });
});

describe("DiaryStore", () => {
  describe("addUrinationEntry", () => {
    it("should add a urination entry to the store", () => {
      const { addUrinationEntry } = useDiaryStore.getState();

      act(() => {
        addUrinationEntry({
          volume: "medium",
          urgency: 3,
          hadLeak: false,
          hadPain: false,
        });
      });

      const updatedEntries = useDiaryStore.getState().entries;
      expect(updatedEntries).toHaveLength(1);
      expect(updatedEntries[0].type).toBe("urination");
      expect(updatedEntries[0]).toMatchObject({
        volume: "medium",
        urgency: 3,
        hadLeak: false,
        hadPain: false,
      });
    });

    it("should support optional volumeMl field", () => {
      const { addUrinationEntry } = useDiaryStore.getState();

      act(() => {
        addUrinationEntry({
          volume: "medium",
          volumeMl: 250,
          urgency: 3,
          hadLeak: false,
          hadPain: false,
        });
      });

      const updatedEntries = useDiaryStore.getState().entries;
      expect(updatedEntries[0]).toHaveProperty("volumeMl", 250);
    });
  });

  describe("addFluidEntry", () => {
    it("should add a fluid entry to the store", () => {
      const { addFluidEntry } = useDiaryStore.getState();

      act(() => {
        addFluidEntry({
          drinkType: "water",
          amount: 250,
        });
      });

      const updatedEntries = useDiaryStore.getState().entries;
      expect(updatedEntries).toHaveLength(1);
      expect(updatedEntries[0].type).toBe("fluid");
      expect(updatedEntries[0]).toMatchObject({
        drinkType: "water",
        amount: 250,
      });
    });
  });

  describe("addLeakEntry", () => {
    it("should add a leak entry with activity", () => {
      const { addLeakEntry } = useDiaryStore.getState();

      act(() => {
        addLeakEntry({
          severity: "moderate",
          urgency: 4,
          activity: "coughing",
        });
      });

      const updatedEntries = useDiaryStore.getState().entries;
      expect(updatedEntries).toHaveLength(1);
      expect(updatedEntries[0].type).toBe("leak");
      expect(updatedEntries[0]).toMatchObject({
        severity: "moderate",
        urgency: 4,
        activity: "coughing",
      });
    });
  });

  describe("updateGoals", () => {
    it("should update daily goals", () => {
      const { updateGoals, goals: initialGoals } = useDiaryStore.getState();

      expect(initialGoals.fluidTarget).toBe(2000);

      act(() => {
        updateGoals({ fluidTarget: 2500 });
      });

      const { goals: updatedGoals } = useDiaryStore.getState();
      expect(updatedGoals).toEqual({ fluidTarget: 2500 });
    });

    it("has only a fluid goal, with no bathroom-visit target", () => {
      expect(useDiaryStore.getInitialState().goals).toEqual({
        fluidTarget: 2000,
      });
    });

    it("should track goal history", () => {
      const { updateGoals } = useDiaryStore.getState();

      act(() => {
        updateGoals({ fluidTarget: 2500 });
      });

      const { goalHistory } = useDiaryStore.getState();
      expect(goalHistory).toHaveLength(1);
      expect(goalHistory[0].changes).toHaveProperty("fluidTarget");
      expect(goalHistory[0].changes.fluidTarget).toMatchObject({
        from: 2000,
        to: 2500,
      });
    });
  });

  describe("data from earlier versions with a visit target", () => {
    it("loads stored goals and goal history, dropping the visit target", async () => {
      const goalHistory = [
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
      ];
      await AsyncStorage.setItem(
        "pee-diary-storage",
        JSON.stringify({
          state: { goals: { fluidTarget: 2500, voidTarget: 8 }, goalHistory },
          version: 0,
        })
      );

      await act(async () => {
        await useDiaryStore.persist.rehydrate();
      });

      const state = useDiaryStore.getState();
      expect(state.goals).toEqual({ fluidTarget: 2500 });
      expect(state.goalHistory).toEqual([
        {
          changedAt: "2026-01-02T10:00:00.000Z",
          goals: { fluidTarget: 2500 },
          changes: { fluidTarget: { from: 2000, to: 2500 } },
        },
      ]);
      expect(state.getGoalsForDate("2026-01-03T00:00:00.000Z")).toEqual({
        fluidTarget: 2500,
      });
    });

    it("ignores a visit target passed to updateGoals", () => {
      act(() => {
        useDiaryStore
          .getState()
          .updateGoals({ voidTarget: 9 } as unknown as { fluidTarget: number });
      });

      const state = useDiaryStore.getState();
      expect(state.goals).toEqual({ fluidTarget: 2000 });
      expect(state.goalHistory).toEqual([]);
    });
  });

  describe("deleteEntry", () => {
    it("should delete an entry by id", () => {
      const { addUrinationEntry, deleteEntry } = useDiaryStore.getState();

      act(() => {
        addUrinationEntry({
          volume: "small",
          urgency: 2,
          hadLeak: false,
          hadPain: false,
        });
      });

      let entries = useDiaryStore.getState().entries;
      expect(entries).toHaveLength(1);

      const entryId = entries[0].id;

      act(() => {
        deleteEntry(entryId);
      });

      entries = useDiaryStore.getState().entries;
      expect(entries).toHaveLength(0);
    });
  });

  describe("language", () => {
    it("should set language preference", () => {
      const { setLanguage } = useDiaryStore.getState();

      act(() => {
        setLanguage("es");
      });

      const { language } = useDiaryStore.getState();
      expect(language).toBe("es");
    });
  });

  describe("onboarding", () => {
    it("should track onboarding completion", () => {
      const { hasCompletedOnboarding, completeOnboarding } =
        useDiaryStore.getState();

      expect(hasCompletedOnboarding).toBe(false);

      act(() => {
        completeOnboarding();
      });

      const { hasCompletedOnboarding: completed } = useDiaryStore.getState();
      expect(completed).toBe(true);
    });

    it("starts with no accepted terms", () => {
      const initial = useDiaryStore.getInitialState();
      expect(initial.termsAcceptedVersion).toBeNull();
      expect(initial.termsAcceptedAt).toBeNull();
    });

    it("records the accepted terms version and date when onboarding completes", () => {
      act(() => {
        useDiaryStore.setState({
          hasCompletedOnboarding: false,
          termsAcceptedVersion: null,
          termsAcceptedAt: null,
        });
      });
      const before = Date.now();

      act(() => {
        useDiaryStore.getState().completeOnboarding();
      });

      const state = useDiaryStore.getState();
      expect(state.termsAcceptedVersion).toBe(TERMS_VERSION);
      expect(state.termsAcceptedAt).not.toBeNull();
      const acceptedAt = state.termsAcceptedAt as string;
      expect(new Date(acceptedAt).toISOString()).toBe(acceptedAt);
      expect(new Date(acceptedAt).getTime()).toBeGreaterThanOrEqual(before);
      expect(new Date(acceptedAt).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it("keeps the accepted terms when the tutorial is replayed", () => {
      act(() => {
        useDiaryStore.getState().completeOnboarding();
      });
      const { termsAcceptedAt } = useDiaryStore.getState();

      act(() => {
        useDiaryStore.getState().resetOnboarding();
      });

      const state = useDiaryStore.getState();
      expect(state.hasCompletedOnboarding).toBe(false);
      expect(state.termsAcceptedVersion).toBe(TERMS_VERSION);
      expect(state.termsAcceptedAt).toBe(termsAcceptedAt);
    });

    it("records the current terms version and date when the terms-update notice is accepted", () => {
      act(() => {
        useDiaryStore.setState({
          hasCompletedOnboarding: true,
          termsAcceptedVersion: "2000-01-01",
          termsAcceptedAt: "2000-01-01T00:00:00.000Z",
        });
      });
      const before = Date.now();

      act(() => {
        useDiaryStore.getState().acceptTerms();
      });

      const state = useDiaryStore.getState();
      expect(state.termsAcceptedVersion).toBe(TERMS_VERSION);
      const acceptedAt = state.termsAcceptedAt as string;
      expect(new Date(acceptedAt).getTime()).toBeGreaterThanOrEqual(before);
      // Accepting does not touch onboarding
      expect(state.hasCompletedOnboarding).toBe(true);
    });

    it("persists the accepted terms with the rest of the diary", async () => {
      act(() => {
        useDiaryStore.getState().completeOnboarding();
      });
      const stored = await diaryStorage.readSaved();
      expect(stored?.state.termsAcceptedVersion).toBe(TERMS_VERSION);
      expect(stored?.state.termsAcceptedAt).toBe(
        useDiaryStore.getState().termsAcceptedAt
      );
    });
  });

  describe("clearAllData", () => {
    it("deletes entries, goals, goal history, streak and settings, keeping language, onboarding and accepted terms", () => {
      const state = useDiaryStore.getState();
      act(() => {
        state.addUrinationEntry({
          timestamp: new Date().toISOString(),
          volume: "medium",
          urgency: 3,
          hadLeak: false,
          hadPain: false,
        });
        state.updateGoals({ fluidTarget: 2500 });
        state.updateReminderSettings({
          enabled: true,
          intervalHours: 2,
          quietHoursEnabled: false,
          quietHoursStart: "23:00",
          quietHoursEnd: "06:00",
        });
        state.setOpenAddMenuOnLaunch(false);
        state.setLanguage("pt");
        state.completeOnboarding();
      });
      const { termsAcceptedAt } = useDiaryStore.getState();
      expect(termsAcceptedAt).not.toBeNull();

      act(() => {
        useDiaryStore.getState().clearAllData();
      });

      const cleared = useDiaryStore.getState();
      expect(cleared.entries).toEqual([]);
      expect(cleared.goals).toEqual({ fluidTarget: 2000 });
      expect(cleared.goalHistory).toEqual([]);
      expect(cleared.streak).toEqual({ currentStreak: 0, lastActiveDate: null });
      expect(cleared.reminderSettings).toEqual({
        enabled: false,
        intervalHours: 3,
        quietHoursEnabled: true,
        quietHoursStart: "22:00",
        quietHoursEnd: "07:00",
      });
      expect(cleared.openAddMenuOnLaunch).toBe(true);
      // Kept, so the app stays in the user's language and on Today
      expect(cleared.language).toBe("pt");
      expect(cleared.hasCompletedOnboarding).toBe(true);
      // Kept, as the record of which Terms of Use were accepted and when
      expect(cleared.termsAcceptedVersion).toBe(TERMS_VERSION);
      expect(cleared.termsAcceptedAt).toBe(termsAcceptedAt);
    });
  });

  describe("reminder settings", () => {
    it("should update reminder settings", () => {
      const { updateReminderSettings, reminderSettings } =
        useDiaryStore.getState();

      expect(reminderSettings.enabled).toBe(false);

      act(() => {
        updateReminderSettings({ enabled: true, intervalHours: 2 });
      });

      const { reminderSettings: updated } = useDiaryStore.getState();
      expect(updated.enabled).toBe(true);
      expect(updated.intervalHours).toBe(2);
    });
  });
});
