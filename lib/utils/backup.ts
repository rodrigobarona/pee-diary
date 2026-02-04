import { Platform, NativeModules } from "react-native";
import * as LZString from "lz-string";
import { useDiaryStore } from "@/lib/store";
import type { DiaryEntry, DailyGoals, StreakInfo } from "@/lib/store/types";

const BACKUP_KEY = "pee-diary-backup";

// Check if native module exists at runtime
// ExpoAppleCloudStorage is the native module name for expo-icloud-storage
const ExpoAppleCloudStorage = NativeModules.ExpoAppleCloudStorage as
  | {
      setItem?: (key: string, value: string) => Promise<void>;
      getItem?: (key: string) => Promise<string | null>;
    }
  | undefined;

// iCloud is available only on iOS with the native module (development build, not Expo Go)
const hasNativeModule = Platform.OS === "ios" && !!ExpoAppleCloudStorage;

// Backup data structure
interface BackupData {
  version: number;
  entries: DiaryEntry[];
  goals: DailyGoals;
  language: "en" | "es" | "pt";
  streak: StreakInfo;
  exportedAt: string;
}

/**
 * Check if iCloud is available on the current platform
 */
export function isCloudAvailable(): boolean {
  return hasNativeModule;
}

/**
 * Sync current diary data to iCloud
 * Compresses data with lz-string to fit within 1MB limit
 */
export async function syncToCloud(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!hasNativeModule || !ExpoAppleCloudStorage?.setItem) {
    return { success: false, error: "iCloud not available" };
  }

  try {
    const state = useDiaryStore.getState();

    const backupData: BackupData = {
      version: 1,
      entries: state.entries,
      goals: state.goals,
      language: state.language,
      streak: state.streak,
      exportedAt: new Date().toISOString(),
    };

    const jsonData = JSON.stringify(backupData);

    // Compress to fit within 1MB limit
    const compressed = LZString.compressToUTF16(jsonData);

    // Check compressed size (rough estimate - each UTF-16 char is 2 bytes)
    const estimatedSize = compressed.length * 2;
    if (estimatedSize > 900000) {
      // Leave some margin below 1MB
      return {
        success: false,
        error: "Data too large for iCloud sync. Please export manually.",
      };
    }

    await ExpoAppleCloudStorage.setItem(BACKUP_KEY, compressed);
    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

/**
 * Restore diary data from iCloud
 * Returns the number of entries restored
 */
export async function restoreFromCloud(): Promise<{
  success: boolean;
  entriesCount?: number;
  error?: string;
}> {
  if (!hasNativeModule || !ExpoAppleCloudStorage?.getItem) {
    return { success: false, error: "iCloud not available" };
  }

  try {
    const compressed = await ExpoAppleCloudStorage.getItem(BACKUP_KEY);

    if (!compressed) {
      return { success: false, error: "No backup found in iCloud" };
    }

    const jsonData = LZString.decompressFromUTF16(compressed);

    if (!jsonData) {
      return { success: false, error: "Failed to decompress backup data" };
    }

    const backupData: BackupData = JSON.parse(jsonData);

    // Validate backup version
    if (!backupData.version || backupData.version > 1) {
      return { success: false, error: "Incompatible backup version" };
    }

    // Restore data to store
    const store = useDiaryStore.getState();

    // Replace entries with backup data
    useDiaryStore.setState({
      entries: backupData.entries ?? [],
      goals: backupData.goals ?? store.goals,
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
 * Get the last backup date from iCloud (if available)
 */
export async function getLastBackupInfo(): Promise<{
  hasBackup: boolean;
  exportedAt?: string;
  entriesCount?: number;
}> {
  if (!hasNativeModule || !ExpoAppleCloudStorage?.getItem) {
    return { hasBackup: false };
  }

  try {
    const compressed = await ExpoAppleCloudStorage.getItem(BACKUP_KEY);

    if (!compressed) {
      return { hasBackup: false };
    }

    const jsonData = LZString.decompressFromUTF16(compressed);

    if (!jsonData) {
      return { hasBackup: false };
    }

    const backupData: BackupData = JSON.parse(jsonData);

    return {
      hasBackup: true,
      exportedAt: backupData.exportedAt,
      entriesCount: backupData.entries?.length ?? 0,
    };
  } catch {
    return { hasBackup: false };
  }
}
