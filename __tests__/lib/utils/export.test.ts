import { deleteExportFiles, exportAndShare } from "@/lib/utils/export";
import type { DiaryEntry } from "@/lib/store/types";

// In-memory stand-in for the two app folders.
const mockFiles: Record<string, string[]> = {
  "file:///cache/": [],
  "file:///documents/": [],
};

jest.mock("expo-file-system/legacy", () => ({
  cacheDirectory: "file:///cache/",
  documentDirectory: "file:///documents/",
  readDirectoryAsync: jest.fn(async (dir: string) => [...(mockFiles[dir] ?? [])]),
  deleteAsync: jest.fn(async (uri: string) => {
    const dir = uri.slice(0, uri.lastIndexOf("/") + 1);
    const name = uri.slice(dir.length);
    mockFiles[dir] = (mockFiles[dir] ?? []).filter((f) => f !== name);
  }),
  writeAsStringAsync: jest.fn(async (uri: string) => {
    const dir = uri.slice(0, uri.lastIndexOf("/") + 1);
    mockFiles[dir] = [...(mockFiles[dir] ?? []), uri.slice(dir.length)];
  }),
  moveAsync: jest.fn(async ({ to }: { from: string; to: string }) => {
    const dir = to.slice(0, to.lastIndexOf("/") + 1);
    mockFiles[dir] = [...(mockFiles[dir] ?? []), to.slice(dir.length)];
  }),
}));
jest.mock("expo-print", () => ({
  printToFileAsync: jest.fn(async () => ({ uri: "file:///cache/Print/abc.pdf" })),
}));
jest.mock("expo-sharing", () => ({ shareAsync: jest.fn(async () => undefined) }));

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
  mockFiles["file:///cache/"] = [];
  mockFiles["file:///documents/"] = [];
});

describe("export files", () => {
  it.each(["csv", "json", "pdf"] as const)(
    "writes a %s export to the cache folder, not Documents",
    async (format) => {
      const result = await exportAndShare(entries, format, range);
      expect(result.success).toBe(true);
      expect(mockFiles["file:///cache/"]).toHaveLength(1);
      expect(mockFiles["file:///cache/"][0]).toMatch(
        new RegExp(`^eleva-diary-.*\\.${format}$`)
      );
      expect(mockFiles["file:///documents/"]).toHaveLength(0);
    }
  );

  it("replaces the previous export instead of piling files up", async () => {
    await exportAndShare(entries, "csv", range);
    await exportAndShare(entries, "json", range);
    expect(mockFiles["file:///cache/"]).toEqual([
      expect.stringMatching(/^eleva-diary-.*\.json$/),
    ]);
  });

  it("deletes only the app's own export and backup files", async () => {
    mockFiles["file:///cache/"] = ["eleva-diary-backup.json", "other.tmp"];
    mockFiles["file:///documents/"] = ["eleva-diary-Nov-1-to-Nov-7-2026.csv", "keep.txt"];
    await deleteExportFiles();
    expect(mockFiles["file:///cache/"]).toEqual(["other.tmp"]);
    expect(mockFiles["file:///documents/"]).toEqual(["keep.txt"]);
  });
});
