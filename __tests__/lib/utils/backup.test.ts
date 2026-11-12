import { readAsStringAsync } from "expo-file-system/legacy";
import { act } from "react";

import { useDiaryStore } from "@/lib/store";
import type { DiaryEntry } from "@/lib/store/types";
import { importBackupFile } from "@/lib/utils/backup";
import { buildImportedState, parseBackupFile } from "@/lib/utils/backup-file";

jest.mock("expo-file-system/legacy", () => ({
  cacheDirectory: "file:///cache/",
  documentDirectory: "file:///documents/",
  EncodingType: { UTF8: "utf8" },
  readDirectoryAsync: jest.fn(async () => []),
  deleteAsync: jest.fn(async () => undefined),
  writeAsStringAsync: jest.fn(async () => undefined),
  readAsStringAsync: jest.fn(),
  moveAsync: jest.fn(async () => undefined),
}));
jest.mock("expo-print", () => ({ printToFileAsync: jest.fn() }));
jest.mock("expo-sharing", () => ({
  shareAsync: jest.fn(async () => undefined),
  isAvailableAsync: jest.fn(async () => true),
}));
jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn(async () => ({
    canceled: false,
    assets: [{ uri: "file:///cache/DocumentPicker/picked.json" }],
  })),
}));

const urination: DiaryEntry = {
  id: "u1",
  type: "urination",
  timestamp: "2026-11-10T08:00:00.000Z",
  createdAt: "2026-11-10T08:00:05.000Z",
  volume: "medium",
  urgency: 2,
  hadLeak: false,
  hadPain: false,
  notes: "Morning",
  editHistory: [
    {
      editedAt: "2026-11-10T09:00:00.000Z",
      // A note added later: JSON drops the undefined "from"
      changes: { notes: { to: "Morning" } },
    },
  ],
};
const fluid: DiaryEntry = {
  id: "f1",
  type: "fluid",
  timestamp: "2026-11-10T09:00:00.000Z",
  drinkType: "water",
  amount: 300,
};
const leak: DiaryEntry = {
  id: "l1",
  type: "leak",
  timestamp: "2026-11-10T10:00:00.000Z",
  severity: "drops",
  urgency: 3,
  activity: "coughing",
};

const validBackup = {
  version: 1,
  entries: [urination, fluid, leak],
  goals: { fluidTarget: 2200 },
  goalHistory: [
    {
      changedAt: "2026-11-01T10:00:00.000Z",
      goals: { fluidTarget: 2200 },
      changes: { fluidTarget: { from: 2000, to: 2200 } },
    },
  ],
  language: "es",
  streak: { currentStreak: 3, lastActiveDate: "2026-11-10" },
  exportedAt: "2026-11-10T12:00:00.000Z",
};

const file = (data: unknown) => JSON.parse(JSON.stringify(data));
const text = (data: unknown) => JSON.stringify(data);

describe("parseBackupFile", () => {
  it("accepts a backup written by the app, including edit history", () => {
    const result = parseBackupFile(text(validBackup));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.backup.entries).toEqual(file(validBackup.entries));
  });

  it("accepts an old backup with a visit target and only the required fields", () => {
    const result = parseBackupFile(
      text({
        version: 1,
        entries: [fluid],
        goals: { fluidTarget: 2400, voidTarget: 8 },
        goalHistory: [
          {
            changedAt: "2026-01-01T10:00:00.000Z",
            goals: { fluidTarget: 2000, voidTarget: 8 },
            changes: { voidTarget: { from: 7, to: 8 } },
          },
        ],
      })
    );
    expect(result.ok).toBe(true);
  });

  it.each([
    ["not JSON", "{ entries: ["],
    ["a list", text([fluid])],
    ["no version", text({ entries: [fluid] })],
    ["no entries", text({ version: 1 })],
    ["an entry without a timestamp", text({ version: 1, entries: [{ ...fluid, timestamp: undefined }] })],
    ["an entry with a bad timestamp", text({ version: 1, entries: [{ ...fluid, timestamp: "yesterday" }] })],
    ["an unknown entry type", text({ version: 1, entries: [{ ...fluid, type: "meal" }] })],
    ["a negative amount", text({ version: 1, entries: [{ ...fluid, amount: -5 }] })],
    ["an urgency out of range", text({ version: 1, entries: [{ ...leak, urgency: 9 }] })],
    ["an unknown language", text({ ...validBackup, language: "fr" })],
    ["a zero fluid goal", text({ ...validBackup, goals: { fluidTarget: 0 } })],
    ["a malformed goal history", text({ ...validBackup, goalHistory: [{ changedAt: 5 }] })],
    ["a malformed streak", text({ ...validBackup, streak: { currentStreak: "3" } })],
  ])("rejects a file with %s", (_, content) => {
    expect(parseBackupFile(content)).toEqual({ ok: false, error: "invalidFormat" });
  });

  it("keeps one entry of each id and skips damaged entries, counting them", () => {
    const result = parseBackupFile(
      text({
        version: 1,
        entries: [fluid, fluid, { ...leak, timestamp: undefined }, { ...fluid, id: "f2", amount: 0 }],
      })
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.backup.entries.map((e) => e.id)).toEqual([fluid.id]);
    expect(result.skippedEntries).toBe(3);
  });

  it("rejects a file whose entries are all damaged", () => {
    expect(
      parseBackupFile(text({ version: 1, entries: [{ ...fluid, amount: null }] }))
    ).toEqual({ ok: false, error: "invalidFormat" });
  });

  it("rejects a backup from a newer version of the app as incompatible", () => {
    expect(parseBackupFile(text({ ...validBackup, version: 2 }))).toEqual({
      ok: false,
      error: "incompatibleVersion",
    });
  });
});

describe("buildImportedState", () => {
  it("drops the visit target and works the streak out again from the entries", () => {
    const parsed = parseBackupFile(
      text({ ...validBackup, goals: { fluidTarget: 2400, voidTarget: 8 } })
    );
    if (!parsed.ok) throw new Error("expected a valid backup");
    const state = buildImportedState(
      parsed.backup,
      { goals: { fluidTarget: 2000 }, goalHistory: [], language: "en" },
      new Date("2026-11-10T20:00:00.000Z")
    );
    expect(state.goals).toEqual({ fluidTarget: 2400 });
    expect(state.language).toBe("es");
    expect(state.streak).toEqual({ currentStreak: 1, lastActiveDate: "2026-11-10" });
  });

  it("keeps the current goals and language when the file has none", () => {
    const parsed = parseBackupFile(text({ version: 1, entries: [] }));
    if (!parsed.ok) throw new Error("expected a valid backup");
    const current = {
      goals: { fluidTarget: 1800 },
      goalHistory: [],
      language: "pt" as const,
    };
    expect(buildImportedState(parsed.backup, current)).toMatchObject(current);
  });
});

describe("importBackupFile", () => {
  const existing: DiaryEntry = { ...fluid, id: "existing", amount: 150 };

  beforeEach(() => {
    act(() => {
      useDiaryStore.getState().clearAllData();
      useDiaryStore.setState({ entries: [existing], language: "en" });
    });
  });

  it("replaces the entries, goals, goal history and language with a valid backup", async () => {
    (readAsStringAsync as jest.Mock).mockResolvedValueOnce(text(validBackup));
    const result = await importBackupFile();
    expect(result).toEqual({ success: true, entriesCount: 3, skippedEntries: 0 });
    const state = useDiaryStore.getState();
    expect(state.entries.map((e) => e.id)).toEqual(["u1", "f1", "l1"]);
    expect(state.goals).toEqual({ fluidTarget: 2200 });
    expect(state.goalHistory).toHaveLength(1);
    expect(state.language).toBe("es");
  });

  it("leaves the diary untouched when the file is invalid", async () => {
    const before = useDiaryStore.getState();
    (readAsStringAsync as jest.Mock).mockResolvedValueOnce(
      text({ ...validBackup, language: "fr" })
    );
    const result = await importBackupFile();
    expect(result).toEqual({ success: false, error: "invalidFormat" });
    const after = useDiaryStore.getState();
    expect(after.entries).toBe(before.entries);
    expect(after.goals).toBe(before.goals);
    expect(after.language).toBe("en");
  });

  it("reports a backup from a newer version without changing anything", async () => {
    (readAsStringAsync as jest.Mock).mockResolvedValueOnce(
      text({ ...validBackup, version: 7 })
    );
    expect(await importBackupFile()).toEqual({
      success: false,
      error: "incompatibleVersion",
    });
    expect(useDiaryStore.getState().entries).toEqual([existing]);
  });
});
