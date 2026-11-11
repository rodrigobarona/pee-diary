/**
 * Where and how the diary store is saved on the phone: AsyncStorage, split
 * into chunks (see chunked-storage.ts), with three safeguards so saved data
 * is never lost by accident:
 *
 * 1. Nothing is written until the saved diary has been read. A change made
 *    while the app is still loading would otherwise overwrite the saved diary
 *    with an almost empty one.
 * 2. If reading fails (for example a storage error), nothing is written for
 *    the rest of the session, so a later version or a restart can still read
 *    the saved diary.
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

export function createDiaryStorage(store: KeyValueStore) {
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
      await strings.setItem(name, JSON.stringify(value));
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
    /** The saved diary as stored, for tests and support. */
    readSaved: async (): Promise<StorageValue<PersistedDiaryState> | null> => {
      const raw = await strings.getItem(STORE_NAME);
      return raw === null ? null : JSON.parse(raw);
    },
  };
}
