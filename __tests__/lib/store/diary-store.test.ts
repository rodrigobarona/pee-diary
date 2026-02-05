import { useDiaryStore } from "@/lib/store";
import { act } from "react";

// Reset store before each test
beforeEach(() => {
  const { clearAllEntries } = useDiaryStore.getState();
  act(() => {
    clearAllEntries();
  });
});

describe("DiaryStore", () => {
  describe("addUrinationEntry", () => {
    it("should add a urination entry to the store", () => {
      const { addUrinationEntry, entries } = useDiaryStore.getState();

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
      expect(updatedGoals.fluidTarget).toBe(2500);
      expect(updatedGoals.voidTarget).toBe(7); // unchanged
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
