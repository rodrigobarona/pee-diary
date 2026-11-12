import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import * as React from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { TERMS_VERSION } from "@/constants/legal";
import { addDaysToKey, getTodayKey, isDayKey, parseDayKey, toDayKey } from "@/lib/utils/day";
import { createDiaryStorage } from "./diary-storage";
import {
  DEFAULT_GOALS,
  DEFAULT_REMINDER_SETTINGS,
  migratePersistedState,
  pickPersistedState,
  sanitizeGoals,
  sanitizePersistedState,
  STORE_NAME,
  STORE_VERSION,
  isValidEntry,
  type PersistedDiaryState,
} from "./persistence";

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

export {
  DEFAULT_GOALS,
  DEFAULT_REMINDER_SETTINGS,
  REMINDER_INTERVAL_OPTIONS,
  sanitizeGoalHistory,
  sanitizeGoals,
} from "./persistence";

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

/**
 * The current streak: the number of consecutive local calendar days, ending
 * today or yesterday, with at least one entry. Days follow the phone's time
 * zone, so an entry at 00:30 counts for the day it was made.
 */
export const calculateStreak = (
  entries: readonly Pick<DiaryEntry, "timestamp">[],
  now: Date = new Date()
): StreakInfo => {
  if (entries.length === 0) {
    return { currentStreak: 0, lastActiveDate: null };
  }

  const datesWithEntries = new Set<string>();
  let latestDate: string | null = null;
  for (const entry of entries) {
    const date = new Date(entry.timestamp);
    if (Number.isNaN(date.getTime())) continue;
    const key = toDayKey(date);
    datesWithEntries.add(key);
    if (latestDate === null || key > latestDate) latestDate = key;
  }

  const today = getTodayKey(now);
  const yesterday = addDaysToKey(today, -1);

  // No entry today or yesterday: the streak is broken
  const lastActiveDate = datesWithEntries.has(today)
    ? today
    : datesWithEntries.has(yesterday)
    ? yesterday
    : null;
  if (lastActiveDate === null) {
    return { currentStreak: 0, lastActiveDate: latestDate };
  }

  // Count consecutive days back from the last active day
  let streak = 0;
  let checkDate = lastActiveDate;
  while (datesWithEntries.has(checkDate)) {
    streak++;
    checkDate = addDaysToKey(checkDate, -1);
  }

  return { currentStreak: streak, lastActiveDate };
};

// Set when reading the saved diary fails; not saved
const useStoreLoadState = create<{ failed: boolean }>()(() => ({
  failed: false,
}));

// The state of a fresh install
const createInitialState = (): PersistedDiaryState => ({
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
});

// Saved data: see diary-storage.ts and persistence.ts
export const diaryStorage = createDiaryStorage(AsyncStorage);

// PersistedDiaryState holds the saved fields: entries, language, goals,
// goalHistory, streak, openAddMenuOnLaunch, hasCompletedOnboarding, the
// version and date (ISO) of the Terms of Use last accepted (at the end of
// onboarding or in the terms-update notice; null until first accepted) and
// reminderSettings.
interface DiaryState extends PersistedDiaryState {

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
      ...createInitialState(),

      addUrinationEntry: (entry) => {
        const now = new Date().toISOString();
        set((state) => {
          const newEntry = {
            ...entry,
            id: createId(),
            timestamp: entry.timestamp ?? now,
            createdAt: now,
            type: "urination" as const,
          };
          // Never store an entry a backup could not restore
          if (!isValidEntry(newEntry)) return state;
          const newEntries = [...state.entries, newEntry];
          return {
            entries: newEntries,
            streak: calculateStreak(newEntries),
          };
        });
      },

      addFluidEntry: (entry) => {
        const now = new Date().toISOString();
        set((state) => {
          const newEntry = {
            ...entry,
            id: createId(),
            timestamp: entry.timestamp ?? now,
            createdAt: now,
            type: "fluid" as const,
          };
          if (!isValidEntry(newEntry)) return state;
          const newEntries = [...state.entries, newEntry];
          return {
            entries: newEntries,
            streak: calculateStreak(newEntries),
          };
        });
      },

      addLeakEntry: (entry) => {
        const now = new Date().toISOString();
        set((state) => {
          const newEntry = {
            ...entry,
            id: createId(),
            timestamp: entry.timestamp ?? now,
            createdAt: now,
            type: "leak" as const,
          };
          if (!isValidEntry(newEntry)) return state;
          const newEntries = [...state.entries, newEntry];
          return {
            entries: newEntries,
            streak: calculateStreak(newEntries),
          };
        });
      },

      updateEntry: (id, updates) =>
        set((state) => {
          let rejected = false;
          const entries = state.entries.map((entry) => {
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

            const updated = {
              ...entry,
              ...updates,
              editHistory: [...(entry.editHistory ?? []), editRecord],
            } as DiaryEntry;
            // An invalid value (an empty amount, say) would break every
            // later backup restore: keep the entry as it was
            if (!isValidEntry(updated)) {
              rejected = true;
              return entry;
            }
            return updated;
          });
          if (rejected) return state;
          // A changed time can move the entry to another day
          return { entries, streak: calculateStreak(entries) };
        }),

      deleteEntry: (id) =>
        set((state) => {
          const entries = state.entries.filter((e) => e.id !== id);
          return { entries, streak: calculateStreak(entries) };
        }),

      // Deletes every diary entry, goal, goal history, streak and setting,
      // and any recovery copy of the saved diary (diary-storage.ts).
      // The language, the completed onboarding and the record of the accepted
      // Terms of Use are kept, so the app stays in the user's language and on
      // the Today screen.
      clearAllData: () => {
        diaryStorage.clearRecoveryCopies().catch(() => {});
        set({
          entries: [],
          goals: DEFAULT_GOALS,
          goalHistory: [],
          streak: { currentStreak: 0, lastActiveDate: null },
          openAddMenuOnLaunch: true,
          reminderSettings: DEFAULT_REMINDER_SETTINGS,
        });
      },

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

        // A "yyyy-MM-dd" day includes changes made at any time that local
        // day; any other value is read as a moment.
        let targetTime: number;
        if (isDayKey(date)) {
          const nextDay = parseDayKey(addDaysToKey(date, 1));
          targetTime = nextDay.getTime() - 1;
        } else {
          targetTime = new Date(date).getTime();
        }

        // Goal history is sorted chronologically (oldest first). Before the
        // first change, the goals were that change's starting value.
        const firstChange = state.goalHistory[0].changes.fluidTarget;
        let applicableGoals: DailyGoals = firstChange
          ? { fluidTarget: firstChange.from }
          : DEFAULT_GOALS;

        for (const record of state.goalHistory) {
          if (new Date(record.changedAt).getTime() <= targetTime) {
            applicableGoals = record.goals;
          } else {
            break;
          }
        }

        return applicableGoals;
      },

      refreshStreak: () => {
        const state = get();
        const newStreak = calculateStreak(state.entries);
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
      name: STORE_NAME,
      version: STORE_VERSION,
      storage: diaryStorage.storage,
      // Save the data only, not the actions
      partialize: (state) => pickPersistedState(state),
      // Upgrade data saved by an earlier version (see persistence.ts). Data
      // that cannot be upgraded is kept in a recovery copy, never discarded.
      migrate: (persisted, version) => {
        try {
          const result = migratePersistedState(
            persisted,
            version,
            createInitialState()
          );
          if (result.keepFullCopy) {
            void diaryStorage.saveRecoveryCopy({
              reason: "newerVersion",
              version,
              data: persisted,
            });
          } else if (result.rejectedEntries.length > 0) {
            void diaryStorage.saveRecoveryCopy({
              reason: "invalidEntries",
              version,
              data: result.rejectedEntries,
            });
          }
          return result.state;
        } catch {
          void diaryStorage.saveRecoveryCopy({
            reason: "migrationFailed",
            version,
            data: persisted,
          });
          return createInitialState();
        }
      },
      // Runs at every launch: fills in missing fields and leaves out entries
      // that would crash a screen (kept in the recovery copy).
      merge: (persisted, current) => {
        const { state, rejectedEntries } = sanitizePersistedState(
          persisted,
          pickPersistedState(current)
        );
        if (rejectedEntries.length > 0) {
          void diaryStorage.saveRecoveryCopy({
            reason: "invalidEntries",
            version: STORE_VERSION,
            data: rejectedEntries,
          });
        }
        // The saved streak can be days old: work it out from the entries
        return {
          ...current,
          ...state,
          streak: calculateStreak(state.entries),
        };
      },
      // A read error leaves the store unhydrated: say so instead of showing
      // an empty diary that cannot save (see diary-storage.ts)
      onRehydrateStorage: () => {
        useStoreLoadState.setState({ failed: false });
        return (_state, error) => {
          if (error) useStoreLoadState.setState({ failed: true });
        };
      },
    }
  )
);

// Whether reading the saved diary failed at launch
export const useStoreLoadFailed = () =>
  useStoreLoadState((state) => state.failed);
export const getStoreLoadFailed = () => useStoreLoadState.getState().failed;

/** Reads the saved diary again after a failure (the Try Again button). */
export const retryStoreLoad = () => useDiaryStore.persist.rehydrate();

// Hydration state check: subscribes to the persist middleware, which says
// both whether it has hydrated and when it finishes
const subscribeToHydration = (onChange: () => void) =>
  useDiaryStore.persist.onFinishHydration(onChange);
const getHydrated = () => useDiaryStore.persist.hasHydrated();

export const useStoreHydrated = () =>
  React.useSyncExternalStore(subscribeToHydration, getHydrated, getHydrated);

// Note: Complex selectors that return new objects/arrays on each call
// should NOT be used directly with useDiaryStore() as they cause infinite loops.
// Instead, use useShallow() or compute derived data in useMemo() within components.
// Example: const entries = useDiaryStore(useShallow((state) => state.entries));
