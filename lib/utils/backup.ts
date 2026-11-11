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

import { deleteExportFiles, EXPORT_FILE_PREFIX } from "@/lib/utils/export";
import { Platform } from "react-native";

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
      version: 1,
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

    // Parse and validate
    const backupData: BackupData = JSON.parse(jsonData);

    // Validate backup version
    if (!backupData.version || backupData.version > 1) {
      return { success: false, error: "incompatibleVersion" };
    }

    // Validate required fields
    if (!Array.isArray(backupData.entries)) {
      return { success: false, error: "invalidFormat" };
    }

    // Restore data to store
    const store = useDiaryStore.getState();

    useDiaryStore.setState({
      entries: backupData.entries ?? [],
      goals: backupData.goals ?? store.goals,
      goalHistory: backupData.goalHistory ?? store.goalHistory,
      language: backupData.language ?? store.language,
      streak: backupData.streak ?? store.streak,
    });

    // Refresh streak calculation after restore
    useDiaryStore.getState().refreshStreak();

    return {
      success: true,
      entriesCount: backupData.entries?.length ?? 0,
    };
  } catch {
    return { success: false, error: "failed" };
  }
}

/**
 * Check if local file backup is available
 */
export function isLocalBackupAvailable(): boolean {
  // Available on both platforms as a fallback
  return Platform.OS === "ios" || Platform.OS === "android";
}
