import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  createChunkedStorage,
  splitIntoChunks,
  type KeyValueStore,
} from "@/lib/store/chunked-storage";
import { createDiaryStorage, RECOVERY_KEY } from "@/lib/store/diary-storage";

// A fresh in-memory AsyncStorage for each test
const createStore = () => {
  const data = new Map<string, string>();
  const store: KeyValueStore & { data: Map<string, string> } = {
    data,
    getItem: jest.fn(async (key: string) => data.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      data.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      data.delete(key);
    }),
    multiGet: jest.fn(async (keys: readonly string[]) =>
      keys.map((key) => [key, data.get(key) ?? null] as const)
    ),
    multiSet: jest.fn(async (pairs: [string, string][]) => {
      for (const [key, value] of pairs) data.set(key, value);
    }),
    multiRemove: jest.fn(async (keys: readonly string[]) => {
      for (const key of keys) data.delete(key);
    }),
    getAllKeys: jest.fn(async () => [...data.keys()]),
  };
  return store;
};

describe("splitIntoChunks", () => {
  it("cuts a string into pieces that join back to it", () => {
    const value = "abcdefghij";
    expect(splitIntoChunks(value, 4)).toEqual(["abcd", "efgh", "ij"]);
    expect(splitIntoChunks("", 4)).toEqual([]);
  });

  it("never splits an emoji (a surrogate pair)", () => {
    const value = "abc😀def";
    const chunks = splitIntoChunks(value, 4);
    expect(chunks.join("")).toBe(value);
    for (const chunk of chunks) {
      expect(/[\uD800-\uDBFF]$/.test(chunk)).toBe(false);
    }
  });
});

describe("chunked storage", () => {
  it("removes chunks left by an interrupted save", async () => {
    const store = createStore();
    // An earlier session wrote generation 1's chunks but not its manifest
    store.data.set("diary.g1.0", "old diary");
    store.data.set("diary.g1.7", "old diary");
    store.data.set("diary.recovery.g1.0", "kept");
    const storage = createChunkedStorage(store, { chunkSize: 10 });

    await storage.setItem("diary", "new");

    expect([...store.data.keys()].sort()).toEqual(
      ["diary", "diary.g1.0", "diary.recovery.g1.0"].sort()
    );
    expect(await storage.getItem("diary")).toBe("new");

    await storage.removeItem("diary");
    expect([...store.data.keys()]).toEqual(["diary.recovery.g1.0"]);
  });

  it("keeps every stored value below the chunk size and reads the whole value back", async () => {
    const store = createStore();
    const storage = createChunkedStorage(store, { chunkSize: 10 });
    const value = JSON.stringify({ notes: "x".repeat(95) });

    await storage.setItem("diary", value);
    for (const [key, stored] of store.data) {
      if (key !== "diary") expect(stored.length).toBeLessThanOrEqual(10);
    }
    expect(await storage.getItem("diary")).toBe(value);
  });

  it("reads a value saved before chunking, and replaces it on the next save", async () => {
    const store = createStore();
    store.data.set("diary", '{"state":{},"version":0}');
    const storage = createChunkedStorage(store, { chunkSize: 10 });

    expect(await storage.getItem("diary")).toBe('{"state":{},"version":0}');
    await storage.setItem("diary", '{"state":{"a":1},"version":1}');
    expect(store.data.get("diary")).toContain("__elevaChunked");
    expect(await storage.getItem("diary")).toBe('{"state":{"a":1},"version":1}');
  });

  it("removes the chunks of the previous save", async () => {
    const store = createStore();
    const storage = createChunkedStorage(store, { chunkSize: 10 });
    await storage.setItem("diary", "a".repeat(100));
    await storage.setItem("diary", "b".repeat(15));
    expect([...store.data.keys()].sort()).toEqual([
      "diary",
      "diary.g2.0",
      "diary.g2.1",
    ]);
    await storage.removeItem("diary");
    expect(store.data.size).toBe(0);
  });

  it("keeps the previous value when a save is interrupted", async () => {
    const store = createStore();
    const storage = createChunkedStorage(store, { chunkSize: 10 });
    await storage.setItem("diary", "old value, complete");

    (store.multiSet as jest.Mock).mockImplementationOnce(async (pairs) => {
      store.data.set(pairs[0][0], pairs[0][1]); // only the first chunk lands
      throw new Error("app killed");
    });
    await expect(storage.setItem("diary", "new value, never finished")).rejects.toThrow();
    expect(await storage.getItem("diary")).toBe("old value, complete");
  });

  it("writes quick successive saves one at a time, ending with the last value", async () => {
    const store = createStore();
    const storage = createChunkedStorage(store, { chunkSize: 3 });
    await Promise.all([
      storage.setItem("diary", "first value"),
      storage.setItem("diary", "second"),
      storage.setItem("diary", "the third and longest value"),
    ]);
    expect(await storage.getItem("diary")).toBe("the third and longest value");
    // The second value was replaced before it was written
    expect(store.multiSet).toHaveBeenCalledTimes(2);
  });

  it("fails loudly instead of returning part of a value", async () => {
    const store = createStore();
    const storage = createChunkedStorage(store, { chunkSize: 4 });
    await storage.setItem("diary", "abcdefgh");
    store.data.delete("diary.g1.1");
    await expect(storage.getItem("diary")).rejects.toThrow(/missing a chunk/);
  });
});

describe("diary storage safeguards", () => {
  it("does not write before the saved diary has been read", async () => {
    const store = createStore();
    store.data.set("pee-diary-storage", '{"state":{"entries":[1]},"version":1}');
    const { storage } = createDiaryStorage(store);

    await storage.setItem("pee-diary-storage", { state: {} as never, version: 1 });
    expect(store.data.get("pee-diary-storage")).toBe(
      '{"state":{"entries":[1]},"version":1}'
    );

    await storage.getItem("pee-diary-storage");
    await storage.setItem("pee-diary-storage", { state: {} as never, version: 1 });
    expect(store.data.get("pee-diary-storage")).toContain("__elevaChunked");
  });

  it("never overwrites a saved diary that could not be read", async () => {
    const store = createStore();
    store.data.set("pee-diary-storage", "saved diary");
    (store.getItem as jest.Mock).mockRejectedValueOnce(new Error("Row too big"));
    const { storage } = createDiaryStorage(store);

    await expect(storage.getItem("pee-diary-storage")).rejects.toThrow();
    await storage.setItem("pee-diary-storage", { state: {} as never, version: 1 });
    expect(store.data.get("pee-diary-storage")).toBe("saved diary");
  });

  it("keeps saved data that cannot be parsed in a recovery copy", async () => {
    const store = createStore();
    store.data.set("pee-diary-storage", '{"state": {"entries": [');
    const diary = createDiaryStorage(store);

    expect(await diary.storage.getItem("pee-diary-storage")).toBeNull();
    const copies = await diary.readRecoveryCopies();
    expect(copies).toEqual([
      expect.objectContaining({
        reason: "unreadable",
        data: '{"state": {"entries": [',
      }),
    ]);

    await diary.clearRecoveryCopies();
    expect(await diary.readRecoveryCopies()).toEqual([]);
    expect([...store.data.keys()].some((key) => key.startsWith(RECOVERY_KEY))).toBe(false);
  });

  it("keeps at most three recovery copies", async () => {
    const diary = createDiaryStorage(createStore());
    for (let i = 0; i < 5; i++) {
      await diary.saveRecoveryCopy({ reason: "invalidEntries", data: [i] });
    }
    expect((await diary.readRecoveryCopies()).map((r) => r.data)).toEqual([[2], [3], [4]]);
  });
});

it("uses the AsyncStorage API the app depends on", () => {
  for (const method of ["getItem", "setItem", "removeItem", "multiGet", "multiSet", "multiRemove"]) {
    expect(typeof (AsyncStorage as unknown as Record<string, unknown>)[method]).toBe("function");
  }
});
