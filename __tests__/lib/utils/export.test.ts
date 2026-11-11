import { shareAsync } from "expo-sharing";
import { moveAsync } from "expo-file-system/legacy";

import {
  deleteExportFiles,
  EXPORT_FILE_PREFIX,
  exportAndShare,
} from "@/lib/utils/export";
import { BACKUP_FILENAME } from "@/lib/utils/backup";
import type { DiaryEntry } from "@/lib/store/types";

// In-memory stand-in for the app's folders.
const mockFiles: Record<string, string[]> = {};
const mockDeletedFolders: string[] = [];

const split = (uri: string) => {
  const dir = uri.slice(0, uri.lastIndexOf("/") + 1);
  return [dir, uri.slice(dir.length)] as const;
};

jest.mock("expo-file-system/legacy", () => ({
  cacheDirectory: "file:///cache/",
  documentDirectory: "file:///documents/",
  EncodingType: { UTF8: "utf8" },
  readDirectoryAsync: jest.fn(async (dir: string) => [...(mockFiles[dir] ?? [])]),
  deleteAsync: jest.fn(async (uri: string) => {
    if (uri.endsWith("/")) {
      mockDeletedFolders.push(uri);
      delete mockFiles[uri];
      return;
    }
    const [dir, name] = split(uri);
    mockFiles[dir] = (mockFiles[dir] ?? []).filter((f) => f !== name);
  }),
  writeAsStringAsync: jest.fn(async (uri: string) => {
    const [dir, name] = split(uri);
    mockFiles[dir] = [...(mockFiles[dir] ?? []), name];
  }),
  moveAsync: jest.fn(async ({ from, to }: { from: string; to: string }) => {
    const [fromDir, fromName] = split(from);
    mockFiles[fromDir] = (mockFiles[fromDir] ?? []).filter((f) => f !== fromName);
    const [dir, name] = split(to);
    mockFiles[dir] = [...(mockFiles[dir] ?? []), name];
  }),
}));
jest.mock("expo-print", () => ({
  printToFileAsync: jest.fn(async () => {
    mockFiles["file:///cache/Print/"] = ["abc.pdf"];
    return { uri: "file:///cache/Print/abc.pdf" };
  }),
}));
jest.mock("expo-sharing", () => ({ shareAsync: jest.fn(async () => undefined) }));
jest.mock("expo-document-picker", () => ({ getDocumentAsync: jest.fn() }));

const entries: DiaryEntry[] = [
  {
    id: "1",
    type: "urination",
    timestamp: "2026-11-10T08:00:00.000Z",
    volume: "medium",
    urgency: 2,
    hadLeak: false,
    hadPain: false,
  },
];
const range = {
  start: new Date("2026-11-09T00:00:00.000Z"),
  end: new Date("2026-11-11T00:00:00.000Z"),
};

beforeEach(() => {
  for (const key of Object.keys(mockFiles)) delete mockFiles[key];
  mockFiles["file:///cache/"] = [];
  mockFiles["file:///documents/"] = [];
  mockDeletedFolders.length = 0;
  jest.clearAllMocks();
});

describe("export files", () => {
  it.each(["csv", "json", "pdf"] as const)(
    "writes and shares a %s export from the cache folder, not Documents",
    async (format) => {
      const result = await exportAndShare(entries, format, range);
      expect(result.success).toBe(true);
      expect(mockFiles["file:///cache/"]).toEqual([
        expect.stringMatching(new RegExp(`^${EXPORT_FILE_PREFIX}.*\\.${format}$`)),
      ]);
      expect(mockFiles["file:///documents/"]).toHaveLength(0);
      expect(shareAsync).toHaveBeenCalledWith(
        `file:///cache/${mockFiles["file:///cache/"][0]}`,
        expect.anything()
      );
    }
  );

  it("shares the original PDF when it cannot be moved", async () => {
    (moveAsync as jest.Mock).mockRejectedValueOnce(new Error("move failed"));
    const result = await exportAndShare(entries, "pdf", range);
    expect(result.success).toBe(true);
    expect(shareAsync).toHaveBeenCalledWith(
      "file:///cache/Print/abc.pdf",
      expect.anything()
    );
  });

  it("replaces the previous export instead of piling files up", async () => {
    await exportAndShare(entries, "csv", range);
    await exportAndShare(entries, "json", range);
    expect(mockFiles["file:///cache/"]).toEqual([
      expect.stringMatching(/^eleva-diary-.*\.json$/),
    ]);
  });

  it("deletes the app's export, backup, print and picker files and nothing else", async () => {
    mockFiles["file:///cache/"] = [BACKUP_FILENAME, "other.tmp"];
    mockFiles["file:///documents/"] = ["eleva-diary-Nov-1-to-Nov-7-2026.csv", "keep.txt"];
    mockFiles["file:///cache/Print/"] = ["abc.pdf"];
    mockFiles["file:///cache/DocumentPicker/"] = ["picked.json"];
    await deleteExportFiles();
    expect(mockFiles["file:///cache/"]).toEqual(["other.tmp"]);
    expect(mockFiles["file:///documents/"]).toEqual(["keep.txt"]);
    expect(mockDeletedFolders.sort()).toEqual([
      "file:///cache/DocumentPicker/",
      "file:///cache/Print/",
    ]);
  });

  it("names the backup file so the cleanup finds it", () => {
    expect(BACKUP_FILENAME.startsWith(EXPORT_FILE_PREFIX)).toBe(true);
  });
});
