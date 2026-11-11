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

import { EXPORT_FILE_PREFIX } from "@/lib/utils/export";
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

// ============================================
// Local file backup: the user exports and imports the file themselves
// ============================================

/**
 * Export diary data to a local file and share it
 * Works on both iOS and Android
 */
export async function exportBackupFile(): Promise<{
  success: boolean;
  error?: string;
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
    await FileSystem.writeAsStringAsync(fileUri, jsonData, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      return {
        success: false,
        error: "Sharing is not available on this device",
      };
    }

    // Share the file
    await Sharing.shareAsync(fileUri, {
      mimeType: "application/json",
      dialogTitle: "Save Backup File",
      UTI: "public.json",
    });

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

/**
 * Import diary data from a local backup file
 */
export async function importBackupFile(): Promise<{
  success: boolean;
  entriesCount?: number;
  error?: string;
}> {
  try {
    // Open file picker
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/json",
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) {
      return { success: false, error: "File selection cancelled" };
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
      return { success: false, error: "Incompatible backup version" };
    }

    // Validate required fields
    if (!Array.isArray(backupData.entries)) {
      return { success: false, error: "Invalid backup file format" };
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
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

/**
 * Check if local file backup is available
 */
export function isLocalBackupAvailable(): boolean {
  // Available on both platforms as a fallback
  return Platform.OS === "ios" || Platform.OS === "android";
}
