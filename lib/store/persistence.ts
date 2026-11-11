/**
 * The shape of the diary saved on the phone, its version and the upgrades
 * between versions. Pure functions, so every upgrade path can be tested.
 *
 * Version history of the saved data ("pee-diary-storage"):
 * - 0: everything saved before versioning (no `version`, or zustand's default
 *   0). Goals and their history may still hold a visit target (voidTarget).
 * - 1: the current shape (PersistedDiaryState). Same fields as 0, without the
 *   visit target, and with every entry valid.
 *
 * To change the shape: bump STORE_VERSION, add a step to migratePersistedState
 * that turns the previous version into the new one, and add a test that loads
 * a saved copy of the previous version.
 */
import {
  diaryEntrySchema,
  languageSchema,
  type DailyGoals,
  type DiaryEntry,
  type GoalHistoryRecord,
  type ReminderSettings,
  type StreakInfo,
} from "./types";

/** AsyncStorage key of the saved diary (kept from the app's first name). */
export const STORE_NAME = "pee-diary-storage";

/** Version of the saved diary that this build writes. */
export const STORE_VERSION = 1;

export type Language = "en" | "es" | "pt";

/** The part of the store saved on the phone. */
export interface PersistedDiaryState {
  entries: DiaryEntry[];
  language: Language;
  goals: DailyGoals;
  goalHistory: GoalHistoryRecord[];
  streak: StreakInfo;
  openAddMenuOnLaunch: boolean;
  hasCompletedOnboarding: boolean;
  termsAcceptedVersion: string | null;
  termsAcceptedAt: string | null;
  reminderSettings: ReminderSettings;
}

// Starting value for the user's own daily fluid target. It is not a medical
// norm; the user can change it at any time in Daily Goals. There is no
// bathroom-visit target: more visits are not better for many bladder
// conditions.
export const DEFAULT_GOALS: DailyGoals = {
  fluidTarget: 2000, // ml
};

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: false,
  intervalHours: 3,
  quietHoursEnabled: true,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
};

/** The reminder intervals the Settings screen offers, in hours. */
export const REMINDER_INTERVAL_OPTIONS = [2, 3, 4, 6] as const;

const PERSISTED_KEYS: readonly (keyof PersistedDiaryState)[] = [
  "entries",
  "language",
  "goals",
  "goalHistory",
  "streak",
  "openAddMenuOnLaunch",
  "hasCompletedOnboarding",
  "termsAcceptedVersion",
  "termsAcceptedAt",
  "reminderSettings",
];

/** The saved fields of the store, without its actions. */
export function pickPersistedState(
  state: PersistedDiaryState
): PersistedDiaryState {
  const picked = {} as Record<string, unknown>;
  for (const key of PERSISTED_KEYS) {
    picked[key] = state[key];
  }
  return picked as unknown as PersistedDiaryState;
}

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

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Reminder settings with every field valid, falling back to the defaults. */
export function sanitizeReminderSettings(value: unknown): ReminderSettings {
  const stored = (value ?? {}) as Partial<ReminderSettings>;
  const defaults = DEFAULT_REMINDER_SETTINGS;
  return {
    enabled:
      typeof stored.enabled === "boolean" ? stored.enabled : defaults.enabled,
    intervalHours:
      typeof stored.intervalHours === "number" &&
      Number.isInteger(stored.intervalHours) &&
      stored.intervalHours >= 1 &&
      stored.intervalHours <= 24
        ? stored.intervalHours
        : defaults.intervalHours,
    quietHoursEnabled:
      typeof stored.quietHoursEnabled === "boolean"
        ? stored.quietHoursEnabled
        : defaults.quietHoursEnabled,
    quietHoursStart:
      typeof stored.quietHoursStart === "string" &&
      TIME_PATTERN.test(stored.quietHoursStart)
        ? stored.quietHoursStart
        : defaults.quietHoursStart,
    quietHoursEnd:
      typeof stored.quietHoursEnd === "string" &&
      TIME_PATTERN.test(stored.quietHoursEnd)
        ? stored.quietHoursEnd
        : defaults.quietHoursEnd,
  };
}

const ENTRY_TYPES = new Set(["urination", "fluid", "leak"]);

/**
 * Quick check, run at every launch, that an entry can be shown without
 * crashing a screen: an id, a known type and a readable timestamp. The full
 * schema check (diaryEntrySchema) runs on upgrades and on backup import,
 * where its cost is paid once.
 */
export function isUsableEntry(value: unknown): value is DiaryEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Partial<DiaryEntry>;
  return (
    typeof entry.id === "string" &&
    typeof entry.type === "string" &&
    ENTRY_TYPES.has(entry.type) &&
    typeof entry.timestamp === "string" &&
    !Number.isNaN(Date.parse(entry.timestamp))
  );
}

/** Full schema check of an entry. */
export function isValidEntry(value: unknown): value is DiaryEntry {
  return diaryEntrySchema.safeParse(value).success;
}

export interface SanitizeResult {
  state: PersistedDiaryState;
  // Entries that failed the check and were left out of the state. They are
  // kept in a recovery copy (see recovery.ts), never silently discarded.
  rejectedEntries: unknown[];
}

/**
 * Turns saved data of the current shape into a valid state, field by field,
 * using `defaults` for anything missing or invalid. Never throws.
 */
export function sanitizePersistedState(
  stored: unknown,
  defaults: PersistedDiaryState,
  checkEntry: (value: unknown) => boolean = isUsableEntry
): SanitizeResult {
  const raw = (
    typeof stored === "object" && stored !== null ? stored : {}
  ) as Partial<Record<keyof PersistedDiaryState, unknown>>;

  const entries: DiaryEntry[] = [];
  const rejectedEntries: unknown[] = [];
  const seenIds = new Set<string>();
  if (Array.isArray(raw.entries)) {
    for (const entry of raw.entries) {
      if (checkEntry(entry) && !seenIds.has((entry as DiaryEntry).id)) {
        seenIds.add((entry as DiaryEntry).id);
        entries.push(entry as DiaryEntry);
      } else {
        rejectedEntries.push(entry);
      }
    }
  } else if (raw.entries === undefined) {
    entries.push(...defaults.entries);
  } else {
    // Not a list: keep whatever it is in the recovery copy
    rejectedEntries.push(raw.entries);
  }

  const language = languageSchema.safeParse(raw.language);
  const streak = raw.streak as Partial<StreakInfo> | undefined;
  const isNullableString = (value: unknown): value is string | null =>
    value === null || typeof value === "string";

  return {
    state: {
      entries,
      language: language.success ? language.data : defaults.language,
      goals:
        raw.goals === undefined ? defaults.goals : sanitizeGoals(raw.goals),
      goalHistory:
        raw.goalHistory === undefined
          ? defaults.goalHistory
          : sanitizeGoalHistory(raw.goalHistory),
      streak:
        typeof streak?.currentStreak === "number" &&
        isNullableString(streak.lastActiveDate)
          ? {
              currentStreak: streak.currentStreak,
              lastActiveDate: streak.lastActiveDate,
            }
          : defaults.streak,
      openAddMenuOnLaunch:
        typeof raw.openAddMenuOnLaunch === "boolean"
          ? raw.openAddMenuOnLaunch
          : defaults.openAddMenuOnLaunch,
      hasCompletedOnboarding:
        typeof raw.hasCompletedOnboarding === "boolean"
          ? raw.hasCompletedOnboarding
          : defaults.hasCompletedOnboarding,
      termsAcceptedVersion: isNullableString(raw.termsAcceptedVersion)
        ? raw.termsAcceptedVersion
        : defaults.termsAcceptedVersion,
      termsAcceptedAt: isNullableString(raw.termsAcceptedAt)
        ? raw.termsAcceptedAt
        : defaults.termsAcceptedAt,
      reminderSettings:
        raw.reminderSettings === undefined
          ? defaults.reminderSettings
          : sanitizeReminderSettings(raw.reminderSettings),
    },
    rejectedEntries,
  };
}

export interface MigrationResult extends SanitizeResult {
  // True when the saved data came from a newer version of the app (after a
  // downgrade): fields this build does not know are lost when it saves, so
  // a full copy of the saved data is kept first.
  keepFullCopy: boolean;
}

/**
 * Upgrades saved data from `fromVersion` to STORE_VERSION. Each version step
 * runs in order; the last step validates everything with the full schemas.
 */
export function migratePersistedState(
  persisted: unknown,
  fromVersion: number,
  defaults: PersistedDiaryState
): MigrationResult {
  // Version 0 -> 1: drop the visit target from the goals and their history,
  // and check every entry against the full schema. Both happen in
  // sanitizePersistedState, so no separate step is needed.
  const result = sanitizePersistedState(persisted, defaults, isValidEntry);
  return {
    ...result,
    keepFullCopy: fromVersion > STORE_VERSION,
  };
}
