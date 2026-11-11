import { useDiaryStore } from "@/lib/store";
import type {
  DailyGoals,
  DiaryEntry,
  GoalHistoryRecord,
  StreakInfo,
} from "@/lib/store/types";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import {
  BACKUP_VERSION,
  buildImportedState,
  parseBackupFile,
} from "@/lib/utils/backup-file";
import { deleteExportFiles, EXPORT_FILE_PREFIX } from "@/lib/utils/export";

// Uses the export prefix so deleteExportFiles() removes it.
export const BACKUP_FILENAME = `${EXPORT_FILE_PREFIX}backup.json`;

// Backup data structure
interface BackupData {
  version: number;
  entries: DiaryEntry[];
  goals: DailyGoals;
  goalHistory?: GoalHistoryRecord[];
  language: "en" | "es" | "pt";
  streak: StreakInfo;
  exportedAt: string;
}

// Error codes, not messages: the screens map them to translated text.
export type ExportBackupError = "sharingUnavailable" | "failed";
export type ImportBackupError =
  | "cancelled"
  | "incompatibleVersion"
  | "invalidFormat"
  | "failed";

// ============================================
// Local file backup: the user exports and imports the file themselves
// ============================================

/**
 * Export diary data to a local file and share it
 * Works on both iOS and Android
 */
export async function exportBackupFile(options?: {
  // Title of the Android share sheet, in the user's language
  dialogTitle?: string;
}): Promise<{
  success: boolean;
  error?: ExportBackupError;
}> {
  try {
    const state = useDiaryStore.getState();

    const backupData: BackupData = {
      version: BACKUP_VERSION,
      entries: state.entries,
      goals: state.goals,
      goalHistory: state.goalHistory,
      language: state.language,
      streak: state.streak,
      exportedAt: new Date().toISOString(),
    };

    const jsonData = JSON.stringify(backupData, null, 2);

    // Write to temporary file
    const fileUri = `${FileSystem.cacheDirectory}${BACKUP_FILENAME}`;
    // Remove files from earlier exports before writing a new one
    await deleteExportFiles();

    await FileSystem.writeAsStringAsync(fileUri, jsonData, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      return { success: false, error: "sharingUnavailable" };
    }

    // Share the file
    await Sharing.shareAsync(fileUri, {
      mimeType: "application/json",
      dialogTitle: options?.dialogTitle,
      UTI: "public.json",
    });

    return { success: true };
  } catch {
    return { success: false, error: "failed" };
  }
}

/**
 * Import diary data from a local backup file
 */
export async function importBackupFile(): Promise<{
  success: boolean;
  entriesCount?: number;
  error?: ImportBackupError;
}> {
  try {
    // Open file picker
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/json",
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) {
      return { success: false, error: "cancelled" };
    }

    const fileUri = result.assets[0].uri;

    // Read file contents, then delete the picker's cached copy of it
    let jsonData: string;
    try {
      jsonData = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    } finally {
      await FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(
        () => {}
      );
    }

    // Check the whole file before changing anything
    const parsed = parseBackupFile(jsonData);
    if (!parsed.ok) {
      return { success: false, error: parsed.error };
    }

    // Replace the data in one step. If that fails, put the previous data
    // back, so the diary is never left half replaced.
    const previous = useDiaryStore.getState();
    const imported = buildImportedState(parsed.backup, previous);
    try {
      useDiaryStore.setState(imported);
    } catch {
      useDiaryStore.setState({
        entries: previous.entries,
        goals: previous.goals,
        goalHistory: previous.goalHistory,
        language: previous.language,
        streak: previous.streak,
      });
      return { success: false, error: "failed" };
    }

    return {
      success: true,
      entriesCount: imported.entries.length,
    };
  } catch {
    return { success: false, error: "failed" };
  }
}
