import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import * as React from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { TERMS_VERSION } from "@/constants/legal";
import type {
  CreateFluidEntry,
  CreateLeakEntry,
  CreateUrinationEntry,
  DailyGoals,
  DiaryEntry,
  EditRecord,
  GoalHistoryRecord,
  ReminderSettings,
  StreakInfo,
  UpdateFluidEntry,
  UpdateLeakEntry,
  UpdateUrinationEntry,
} from "./types";

// Detect system language on first launch
const getInitialLanguage = (): "en" | "es" | "pt" => {
  const deviceLocale = getLocales()[0]?.languageCode ?? "en";

  // Check if device locale is one of our supported languages
  if (deviceLocale === "en" || deviceLocale === "es" || deviceLocale === "pt") {
    return deviceLocale;
  }

  // Handle pt-BR, pt-PT, etc. -> pt
  if (deviceLocale.startsWith("pt")) {
    return "pt";
  }

  // Handle es-MX, es-AR, etc. -> es
  if (deviceLocale.startsWith("es")) {
    return "es";
  }

  // Default to English
  return "en";
};

const createId = (): string => {
  const cryptoObj = globalThis.crypto as
    | { randomUUID?: () => string }
    | undefined;
  if (cryptoObj?.randomUUID) {
    return cryptoObj.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

// Starting value for the user's own daily fluid target. It is not a medical
// norm; the user can change it at any time in Daily Goals. There is no
// bathroom-visit target: more visits are not better for many bladder
// conditions.
const DEFAULT_GOALS: DailyGoals = {
  fluidTarget: 2000, // ml
};

/**
 * Goals as the app uses them now. Earlier versions also stored a visit target
 * (voidTarget) in the goals and their history; this drops it, so old stored
 * data and old backup files still load.
 */
export const sanitizeGoals = (goals: unknown): DailyGoals => {
  const fluidTarget = (goals as Partial<DailyGoals> | null | undefined)
    ?.fluidTarget;
  return {
    fluidTarget:
      typeof fluidTarget === "number" && fluidTarget > 0
        ? fluidTarget
        : DEFAULT_GOALS.fluidTarget,
  };
};

// Keeps only the fluid target changes of a goal history
export const sanitizeGoalHistory = (history: unknown): GoalHistoryRecord[] => {
  if (!Array.isArray(history)) return [];
  return history.flatMap((record: Partial<GoalHistoryRecord> | null) => {
    const fluidChange = record?.changes?.fluidTarget;
    if (!record?.changedAt || !fluidChange) return [];
    return [
      {
        changedAt: record.changedAt,
        goals: sanitizeGoals(record.goals),
        changes: { fluidTarget: fluidChange },
      },
    ];
  });
};

// Default reminder settings
const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: false,
  intervalHours: 3,
  quietHoursEnabled: true,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
};

// Helper to get today's date as YYYY-MM-DD
const getTodayDateString = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
};

// Helper to calculate streak from entries
const calculateStreak = (
  entries: DiaryEntry[],
  lastActiveDate: string | null
): StreakInfo => {
  if (entries.length === 0) {
    return { currentStreak: 0, lastActiveDate: null };
  }

  const today = getTodayDateString();

  // Get unique dates that have entries
  const datesWithEntries = new Set<string>();
  entries.forEach((entry) => {
    const date = entry.timestamp.split("T")[0];
    datesWithEntries.add(date);
  });

  // Sort dates descending
  const sortedDates = Array.from(datesWithEntries).sort((a, b) =>
    b.localeCompare(a)
  );

  // Check if today or yesterday has entries
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(
    yesterday.getMonth() + 1
  ).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

  const hasEntryToday = datesWithEntries.has(today);
  const hasEntryYesterday = datesWithEntries.has(yesterdayStr);

  // If no entry today or yesterday, streak is broken
  if (!hasEntryToday && !hasEntryYesterday) {
    return { currentStreak: 0, lastActiveDate: sortedDates[0] ?? null };
  }

  // Count consecutive days
  let streak = 0;
  let checkDate = new Date(hasEntryToday ? today : yesterdayStr);

  while (true) {
    const dateStr = `${checkDate.getFullYear()}-${String(
      checkDate.getMonth() + 1
    ).padStart(2, "0")}-${String(checkDate.getDate()).padStart(2, "0")}`;
    if (datesWithEntries.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    currentStreak: streak,
    lastActiveDate: hasEntryToday ? today : yesterdayStr,
  };
};

interface DiaryState {
  entries: DiaryEntry[];
  language: "en" | "es" | "pt";
  goals: DailyGoals;
  goalHistory: GoalHistoryRecord[];
  streak: StreakInfo;
  openAddMenuOnLaunch: boolean;
  hasCompletedOnboarding: boolean;
  // Version and date (ISO) of the Terms of Use last accepted, at the end of
  // onboarding or in the terms-update notice; null until first accepted.
  termsAcceptedVersion: string | null;
  termsAcceptedAt: string | null;
  reminderSettings: ReminderSettings;

  // Actions
  addUrinationEntry: (entry: CreateUrinationEntry) => void;
  addFluidEntry: (entry: CreateFluidEntry) => void;
  addLeakEntry: (entry: CreateLeakEntry) => void;
  updateEntry: (
    id: string,
    updates: UpdateUrinationEntry | UpdateFluidEntry | UpdateLeakEntry
  ) => void;
  deleteEntry: (id: string) => void;
  clearAllData: () => void;
  setLanguage: (language: "en" | "es" | "pt") => void;
  getEntryById: (id: string) => DiaryEntry | undefined;
  updateGoals: (goals: Partial<DailyGoals>) => void;
  getGoalsForDate: (date: string) => DailyGoals;
  refreshStreak: () => void;
  setOpenAddMenuOnLaunch: (enabled: boolean) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  acceptTerms: () => void;
  updateReminderSettings: (settings: Partial<ReminderSettings>) => void;
}

export const useDiaryStore = create<DiaryState>()(
  persist(
    (set, get) => ({
      entries: [],
      language: getInitialLanguage(),
      goals: DEFAULT_GOALS,
      goalHistory: [],
      streak: { currentStreak: 0, lastActiveDate: null },
      openAddMenuOnLaunch: true,
      hasCompletedOnboarding: false,
      termsAcceptedVersion: null,
      termsAcceptedAt: null,
      reminderSettings: DEFAULT_REMINDER_SETTINGS,

      addUrinationEntry: (entry) => {
        const now = new Date().toISOString();
        set((state) => {
          const newEntries = [
            ...state.entries,
            {
              ...entry,
              id: createId(),
              timestamp: entry.timestamp ?? now,
              createdAt: now,
              type: "urination" as const,
            },
          ];
          return {
            entries: newEntries,
            streak: calculateStreak(newEntries, state.streak.lastActiveDate),
          };
        });
      },

      addFluidEntry: (entry) => {
        const now = new Date().toISOString();
        set((state) => {
          const newEntries = [
            ...state.entries,
            {
              ...entry,
              id: createId(),
              timestamp: entry.timestamp ?? now,
              createdAt: now,
              type: "fluid" as const,
            },
          ];
          return {
            entries: newEntries,
            streak: calculateStreak(newEntries, state.streak.lastActiveDate),
          };
        });
      },

      addLeakEntry: (entry) => {
        const now = new Date().toISOString();
        set((state) => {
          const newEntries = [
            ...state.entries,
            {
              ...entry,
              id: createId(),
              timestamp: entry.timestamp ?? now,
              createdAt: now,
              type: "leak" as const,
            },
          ];
          return {
            entries: newEntries,
            streak: calculateStreak(newEntries, state.streak.lastActiveDate),
          };
        });
      },

      updateEntry: (id, updates) =>
        set((state) => ({
          entries: state.entries.map((entry) => {
            if (entry.id !== id) return entry;

            // Track changes for edit history
            const changes: Record<string, { from: unknown; to: unknown }> = {};
            for (const [key, newValue] of Object.entries(updates)) {
              const oldValue = (entry as Record<string, unknown>)[key];
              if (oldValue !== newValue) {
                changes[key] = { from: oldValue, to: newValue };
              }
            }

            // Only add edit record if there were actual changes
            if (Object.keys(changes).length === 0) return entry;

            const editRecord: EditRecord = {
              editedAt: new Date().toISOString(),
              changes,
            };

            return {
              ...entry,
              ...updates,
              editHistory: [...(entry.editHistory ?? []), editRecord],
            };
          }),
        })),

      deleteEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        })),

      // Deletes every diary entry, goal, goal history, streak and setting.
      // The language, the completed onboarding and the record of the accepted
      // Terms of Use are kept, so the app stays in the user's language and on
      // the Today screen.
      clearAllData: () =>
        set({
          entries: [],
          goals: DEFAULT_GOALS,
          goalHistory: [],
          streak: { currentStreak: 0, lastActiveDate: null },
          openAddMenuOnLaunch: true,
          reminderSettings: DEFAULT_REMINDER_SETTINGS,
        }),

      setLanguage: (language) => set({ language }),

      getEntryById: (id) => get().entries.find((e) => e.id === id),

      updateGoals: (newGoals) =>
        set((state) => {
          // Track changes for goal history
          const changes: GoalHistoryRecord["changes"] = {};

          if (
            newGoals.fluidTarget !== undefined &&
            newGoals.fluidTarget !== state.goals.fluidTarget
          ) {
            changes.fluidTarget = {
              from: state.goals.fluidTarget,
              to: newGoals.fluidTarget,
            };
          }

          // Only add history record if there were actual changes
          if (Object.keys(changes).length === 0) {
            return state;
          }

          const updatedGoals = sanitizeGoals({ ...state.goals, ...newGoals });
          const historyRecord: GoalHistoryRecord = {
            changedAt: new Date().toISOString(),
            goals: updatedGoals,
            changes,
          };

          return {
            goals: updatedGoals,
            goalHistory: [...state.goalHistory, historyRecord],
          };
        }),

      getGoalsForDate: (date) => {
        const state = get();

        // If no history, return current goals (they've always been the default)
        if (state.goalHistory.length === 0) {
          return state.goals;
        }

        // Find the most recent goal change that happened before or on the given date
        // Goal history is sorted chronologically (oldest first)
        const targetDate = new Date(date);

        // Find the last record where changedAt is before or equal to the target date
        let applicableGoals = DEFAULT_GOALS;

        for (const record of state.goalHistory) {
          const recordDate = new Date(record.changedAt);
          if (recordDate <= targetDate) {
            applicableGoals = record.goals;
          } else {
            break;
          }
        }

        return applicableGoals;
      },

      refreshStreak: () => {
        const state = get();
        const newStreak = calculateStreak(
          state.entries,
          state.streak.lastActiveDate
        );
        set({ streak: newStreak });
      },

      setOpenAddMenuOnLaunch: (enabled) =>
        set({ openAddMenuOnLaunch: enabled }),

      // Completing onboarding (Get Started on the last page) accepts the Terms
      // of Use shown on that page; record which version and when.
      completeOnboarding: () =>
        set({
          hasCompletedOnboarding: true,
          termsAcceptedVersion: TERMS_VERSION,
          termsAcceptedAt: new Date().toISOString(),
        }),

      resetOnboarding: () => set({ hasCompletedOnboarding: false }),

      // Accept in the notice shown at launch when the Terms of Use changed
      acceptTerms: () =>
        set({
          termsAcceptedVersion: TERMS_VERSION,
          termsAcceptedAt: new Date().toISOString(),
        }),

      updateReminderSettings: (settings) =>
        set((state) => ({
          reminderSettings: { ...state.reminderSettings, ...settings },
        })),
    }),
    {
      name: "pee-diary-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // Stored data from earlier versions may still hold a visit target
      merge: (persisted, current) => {
        const stored = (persisted ?? {}) as Partial<DiaryState>;
        return {
          ...current,
          ...stored,
          goals: sanitizeGoals(stored.goals ?? current.goals),
          goalHistory: sanitizeGoalHistory(
            stored.goalHistory ?? current.goalHistory
          ),
        };
      },
    }
  )
);

// Hydration state check
export const useStoreHydrated = () => {
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    const unsubFinishHydration = useDiaryStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    // Check if already hydrated
    if (useDiaryStore.persist.hasHydrated()) {
      setHydrated(true);
    }

    return () => {
      unsubFinishHydration();
    };
  }, []);

  return hydrated;
};

// Note: Complex selectors that return new objects/arrays on each call
// should NOT be used directly with useDiaryStore() as they cause infinite loops.
// Instead, use useShallow() or compute derived data in useMemo() within components.
// Example: const entries = useDiaryStore(useShallow((state) => state.entries));
