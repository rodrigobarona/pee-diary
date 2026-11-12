/**
 * Where and how the diary store is saved on the phone: AsyncStorage, split
 * into chunks (see chunked-storage.ts), with three safeguards so saved data
 * is never lost by accident:
 *
 * 1. Nothing is written until the saved diary has been read. A change made
 *    while the app is still loading would otherwise overwrite the saved diary
 *    with an almost empty one.
 * 2. If reading fails (for example a storage error), nothing is written
 *    until a retry reads it, so a later attempt can still read the saved
 *    diary. The app shows a blocking screen with Try Again meanwhile
 *    (useStoreLoadFailed).
 * 3. Saved data that cannot be parsed or upgraded, entries that fail
 *    validation, and data from a newer version of the app are kept in a
 *    recovery copy on the phone instead of being discarded. "Clear All Data"
 *    deletes the recovery copy too.
 */
import type { PersistStorage, StorageValue } from "zustand/middleware";

import {
  createChunkedStorage,
  type KeyValueStore,
} from "./chunked-storage";
import { STORE_NAME, type PersistedDiaryState } from "./persistence";

/** Key of the recovery copy (only on the phone, never sent anywhere). */
export const RECOVERY_KEY = `${STORE_NAME}.recovery`;

// Keep only the most recent copies, so the recovery data cannot keep growing
const MAX_RECOVERY_RECORDS = 3;

export interface RecoveryRecord {
  savedAt: string;
  reason: "unreadable" | "migrationFailed" | "invalidEntries" | "newerVersion";
  version?: number;
  data: unknown;
}

export function createDiaryStorage(
  store: KeyValueStore,
  options: { onWriteError?: (error: unknown) => void } = {}
) {
  const strings = createChunkedStorage(store);
  let hasRead = false;
  let readFailed = false;

  async function readRecoveryCopies(): Promise<RecoveryRecord[]> {
    const raw = await strings.getItem(RECOVERY_KEY);
    if (raw === null) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as RecoveryRecord[]) : [];
    } catch {
      return [];
    }
  }

  /** Adds a recovery copy. Best effort: it never throws. */
  async function saveRecoveryCopy(
    record: Omit<RecoveryRecord, "savedAt">
  ): Promise<void> {
    try {
      const records = await readRecoveryCopies();
      records.push({ savedAt: new Date().toISOString(), ...record });
      await strings.setItem(
        RECOVERY_KEY,
        JSON.stringify(records.slice(-MAX_RECOVERY_RECORDS))
      );
    } catch {
      // Nothing else to do: the saved diary itself is left untouched.
    }
  }

  const storage: PersistStorage<PersistedDiaryState> = {
    async getItem(name) {
      let raw: string | null;
      try {
        raw = await strings.getItem(name);
      } catch (error) {
        readFailed = true;
        throw error;
      }
      hasRead = true;
      // A retry that reads the diary lifts the write block (safeguard 2)
      readFailed = false;
      if (raw === null) return null;

      try {
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed !== "object" || parsed === null) {
          throw new Error("Saved diary is not an object");
        }
        return parsed as StorageValue<PersistedDiaryState>;
      } catch {
        await saveRecoveryCopy({ reason: "unreadable", data: raw });
        return null;
      }
    },
    async setItem(name, value) {
      if (!hasRead || readFailed) return;
      try {
        await strings.setItem(name, JSON.stringify(value));
      } catch (error) {
        // zustand does not wait for saves: report the failure here
        options.onWriteError?.(error);
      }
    },
    async removeItem(name) {
      await strings.removeItem(name);
    },
  };

  return {
    storage,
    saveRecoveryCopy,
    readRecoveryCopies,
    clearRecoveryCopies: () => strings.removeItem(RECOVERY_KEY),
    /**
     * Moves the saved diary's raw keys (the manifest and every chunk, even
     * when some are missing) into a recovery copy and removes them, so the
     * next read starts an empty diary. For "Start a new diary" after a
     * load failure; nothing is discarded.
     */
    async moveSavedToRecovery(): Promise<void> {
      const keys = store.getAllKeys
        ? (await store.getAllKeys()).filter(
            (key) =>
              key === STORE_NAME ||
              (key.startsWith(`${STORE_NAME}.g`) && !key.startsWith(RECOVERY_KEY))
          )
        : [STORE_NAME];
      const pairs = await store.multiGet(keys);
      await saveRecoveryCopy({
        reason: "unreadable",
        data: Object.fromEntries(pairs),
      });
      await store.multiRemove(keys);
      readFailed = false;
    },
    /** The saved diary as stored, for tests and support. */
    readSaved: async (): Promise<StorageValue<PersistedDiaryState> | null> => {
      const raw = await strings.getItem(STORE_NAME);
      return raw === null ? null : JSON.parse(raw);
    },
  };
}
