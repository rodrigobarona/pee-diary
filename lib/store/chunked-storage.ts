/**
 * Saves large values in AsyncStorage as several smaller pieces.
 *
 * Why: on Android, AsyncStorage 2.x keeps every value in one SQLite row and
 * reads it through a CursorWindow, which holds at most 2 MB. A value larger
 * than that is written without complaint but can never be read back
 * ("Row too big to fit into CursorWindow"), so a diary kept in one value
 * would stop loading after a few years of heavy use. Splitting it keeps every
 * row far below that limit. (The total size of the database has its own
 * limit, raised in plugins/with-async-storage-size.js.)
 *
 * How: the value is cut into chunks of at most CHUNK_SIZE characters, saved
 * under "<name>.g<generation>.<index>". The key "<name>" then holds a small
 * manifest naming the generation and the number of chunks. A save writes the
 * new generation's chunks first, then the manifest, then removes the old
 * generation, so an interruption at any point leaves either the old or the
 * new value complete, never a mix. Saves are queued, and only the latest
 * pending value is written.
 *
 * Values saved before this existed (a plain string under "<name>") are still
 * read, and are replaced by the chunked form on the next save.
 */

/** The part of the AsyncStorage API this uses. */
export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  multiGet(
    keys: readonly string[]
  ): Promise<readonly (readonly [string, string | null])[]>;
  multiSet(pairs: [string, string][]): Promise<void>;
  multiRemove(keys: readonly string[]): Promise<void>;
  // Used to find chunks left by an interrupted save (optional for tests)
  getAllKeys?(): Promise<readonly string[]>;
}

export interface StringStorage {
  getItem(name: string): Promise<string | null>;
  setItem(name: string, value: string): Promise<void>;
  removeItem(name: string): Promise<void>;
}

/**
 * Characters per chunk. A character takes at most 3 bytes in UTF-8 (4 for a
 * surrogate pair, which is 2 characters), so a chunk stays under 1.2 MB.
 */
export const CHUNK_SIZE = 400_000;

const MANIFEST_MARKER = "__elevaChunked";

interface Manifest {
  [MANIFEST_MARKER]: 1;
  generation: number;
  count: number;
}

const chunkKey = (name: string, generation: number, index: number) =>
  `${name}.g${generation}.${index}`;

const chunkKeys = (name: string, manifest: Manifest) =>
  Array.from({ length: manifest.count }, (_, index) =>
    chunkKey(name, manifest.generation, index)
  );

function parseManifest(raw: string | null): Manifest | null {
  if (raw === null || !raw.startsWith(`{"${MANIFEST_MARKER}"`)) return null;
  try {
    const manifest = JSON.parse(raw) as Manifest;
    return Number.isInteger(manifest.generation) &&
      Number.isInteger(manifest.count) &&
      manifest.count >= 0
      ? manifest
      : null;
  } catch {
    return null;
  }
}

/**
 * Cuts a string into pieces of at most `size` characters without splitting
 * a surrogate pair (an emoji in a note), which would not survive storage.
 */
export function splitIntoChunks(value: string, size: number = CHUNK_SIZE) {
  if (size < 2) throw new RangeError("Chunk size must be at least 2");
  const chunks: string[] = [];
  let start = 0;
  while (start < value.length) {
    let end = Math.min(start + size, value.length);
    const last = value.charCodeAt(end - 1);
    if (end < value.length && last >= 0xd800 && last <= 0xdbff) {
      end -= 1;
    }
    chunks.push(value.slice(start, end));
    start = end;
  }
  return chunks;
}

export function createChunkedStorage(
  store: KeyValueStore,
  options: { chunkSize?: number } = {}
): StringStorage {
  const chunkSize = options.chunkSize ?? CHUNK_SIZE;

  // Per key: the value waiting to be written (null means remove) and the
  // write in progress.
  const pending = new Map<string, { value: string | null }>();
  const running = new Map<string, Promise<void>>();
  // Names whose leftover chunks were already looked for this session
  const swept = new Set<string>();

  /**
   * Removes chunks of `name` that the current manifest does not name. A save
   * interrupted after writing its chunks but before the manifest leaves such
   * chunks behind; they hold diary data, so they must not outlive Clear All
   * Data. Runs once per name and session, after the first save.
   */
  async function sweepOrphans(name: string, manifest: Manifest | null) {
    if (swept.has(name) || !store.getAllKeys) return;
    swept.add(name);
    const keep = new Set(manifest ? chunkKeys(name, manifest) : []);
    const prefix = `${name}.g`;
    const pattern = /^\d+\.\d+$/;
    const orphans = (await store.getAllKeys()).filter(
      (key) =>
        key.startsWith(prefix) &&
        pattern.test(key.slice(prefix.length)) &&
        !keep.has(key)
    );
    if (orphans.length > 0) await store.multiRemove(orphans);
  }

  async function write(name: string, value: string | null) {
    const previous = parseManifest(await store.getItem(name));
    const staleKeys = previous ? chunkKeys(name, previous) : [];
    let current: Manifest | null = null;

    if (value === null) {
      await store.removeItem(name);
    } else {
      const chunks = splitIntoChunks(value, chunkSize);
      const manifest: Manifest = {
        [MANIFEST_MARKER]: 1,
        generation: (previous?.generation ?? 0) + 1,
        count: chunks.length,
      };
      await store.multiSet(
        chunks.map((chunk, index) => [
          chunkKey(name, manifest.generation, index),
          chunk,
        ])
      );
      await store.setItem(name, JSON.stringify(manifest));
      current = manifest;
    }

    if (staleKeys.length > 0) {
      await store.multiRemove(staleKeys);
    }
    await sweepOrphans(name, current).catch(() => {});
  }

  function enqueue(name: string, value: string | null): Promise<void> {
    pending.set(name, { value });
    const current = running.get(name);
    if (current) return current;

    const run = (async () => {
      try {
        let next = pending.get(name);
        while (next) {
          pending.delete(name);
          try {
            await write(name, next.value);
          } catch (error) {
            // A newer value replaces this one anyway; report only a failure
            // of the latest value.
            if (!pending.has(name)) throw error;
          }
          next = pending.get(name);
        }
      } finally {
        running.delete(name);
      }
    })();
    running.set(name, run);
    return run;
  }

  return {
    async getItem(name) {
      // Wait for queued writes, so a read never sees a half-written value
      await running.get(name)?.catch(() => {});

      const raw = await store.getItem(name);
      const manifest = parseManifest(raw);
      if (!manifest) return raw; // Nothing saved, or saved before chunking

      const pairs = await store.multiGet(chunkKeys(name, manifest));
      const chunks = pairs.map(([, chunk]) => chunk);
      if (chunks.some((chunk) => chunk === null)) {
        throw new Error(`Saved value "${name}" is missing a chunk`);
      }
      return chunks.join("");
    },
    setItem: (name, value) => enqueue(name, value),
    removeItem: (name) => enqueue(name, null),
  };
}
