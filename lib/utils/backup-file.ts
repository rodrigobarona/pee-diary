/**
 * Reading and checking a backup file before anything in the app changes.
 * Pure functions, so every kind of file can be tested.
 */
import { z } from "zod";

import {
  calculateStreak,
  sanitizeGoalHistory,
  sanitizeGoals,
} from "@/lib/store/diary-store";
import type { PersistedDiaryState } from "@/lib/store/persistence";
import {
  diaryEntrySchema,
  languageSchema,
  storedGoalHistoryRecordSchema,
  storedGoalsSchema,
  streakInfoSchema,
  type DiaryEntry,
} from "@/lib/store/types";

/** Version of the backup file this build writes and the newest it reads. */
export const BACKUP_VERSION = 1;

// The whole file is checked; one invalid entry or field rejects the file.
// Backups of earlier versions may have goals with a visit target (voidTarget),
// which is dropped, and may lack goalHistory, language or streak.
export const backupFileSchema = z.object({
  version: z.number().int().positive(),
  entries: z.array(diaryEntrySchema),
  goals: storedGoalsSchema.optional(),
  goalHistory: z.array(storedGoalHistoryRecordSchema).optional(),
  language: languageSchema.optional(),
  streak: streakInfoSchema.optional(),
  exportedAt: z.string().optional(),
});

export type BackupFile = z.infer<typeof backupFileSchema>;

export type BackupParseResult =
  | { ok: true; backup: BackupFile }
  | { ok: false; error: "incompatibleVersion" | "invalidFormat" };

/** Parses and validates the text of a backup file. Never throws. */
export function parseBackupFile(text: string): BackupParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "invalidFormat" };
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return { ok: false, error: "invalidFormat" };
  }

  const { version } = data as { version?: unknown };
  if (typeof version !== "number" || !Number.isInteger(version) || version < 1) {
    return { ok: false, error: "invalidFormat" };
  }
  if (version > BACKUP_VERSION) {
    return { ok: false, error: "incompatibleVersion" };
  }

  const parsed = backupFileSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: "invalidFormat" };
  }

  // Two entries with the same id would break editing and deleting
  const ids = new Set(parsed.data.entries.map((entry) => entry.id));
  if (ids.size !== parsed.data.entries.length) {
    return { ok: false, error: "invalidFormat" };
  }

  return { ok: true, backup: parsed.data };
}

/** What importing the backup replaces in the store. */
export type ImportedState = Pick<
  PersistedDiaryState,
  "entries" | "goals" | "goalHistory" | "language" | "streak"
>;

/**
 * The store fields that importing `backup` replaces: the entries, and the
 * goals, goal history and language when the file has them. The streak is
 * worked out again from the imported entries.
 */
export function buildImportedState(
  backup: BackupFile,
  current: Pick<PersistedDiaryState, "goals" | "goalHistory" | "language">,
  now: Date = new Date()
): ImportedState {
  const entries = backup.entries as DiaryEntry[];
  return {
    entries,
    goals: backup.goals ? sanitizeGoals(backup.goals) : current.goals,
    goalHistory: backup.goalHistory
      ? sanitizeGoalHistory(backup.goalHistory)
      : current.goalHistory,
    language: backup.language ?? current.language,
    streak: calculateStreak(entries, now),
  };
}
