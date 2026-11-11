import { shareAsync } from "expo-sharing";
import { moveAsync, readAsStringAsync } from "expo-file-system/legacy";

import {
  deleteExportFiles,
  EXPORT_FILE_PREFIX,
  exportAndShare,
  formatToCSV,
  generatePDFHTML,
} from "@/lib/utils/export";
import { BACKUP_FILENAME, importBackupFile } from "@/lib/utils/backup";
import { useDiaryStore } from "@/lib/store";
import type { DiaryEntry } from "@/lib/store/types";
import en from "@/lib/i18n/locales/en.json";
import pt from "@/lib/i18n/locales/pt.json";

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
  readAsStringAsync: jest.fn(async () =>
    JSON.stringify({ version: 1, entries: [], goals: { fluidTarget: 2000, voidTarget: 7 } })
  ),
  moveAsync: jest.fn(async ({ from, to }: { from: string; to: string }) => {
    const [fromDir, fromName] = split(from);
    if (!(mockFiles[fromDir] ?? []).includes(fromName)) {
      throw new Error(`File '${from}' could not be moved.`);
    }
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
jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn(async () => {
    mockFiles["file:///cache/DocumentPicker/"] = ["picked.json"];
    return {
      canceled: false,
      assets: [{ uri: "file:///cache/DocumentPicker/picked.json" }],
    };
  }),
}));

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

  it("deletes the picker's copy of an imported backup after reading it", async () => {
    await importBackupFile();
    expect(mockFiles["file:///cache/DocumentPicker/"]).toEqual([]);
  });

  it("imports a backup from an earlier version that has a visit target", async () => {
    (readAsStringAsync as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({
        version: 1,
        entries: [],
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
    const result = await importBackupFile();
    expect(result).toEqual({ success: true, entriesCount: 0 });
    expect(useDiaryStore.getState().goals).toEqual({ fluidTarget: 2400 });
    expect(useDiaryStore.getState().goalHistory).toEqual([]);
  });

  it("returns an error code, not English text, when there is nothing to export", async () => {
    const result = await exportAndShare([], "csv", range);
    expect(result).toEqual({ success: false, error: "noEntries" });
  });

  it("names the backup file so the cleanup finds it", () => {
    expect(BACKUP_FILENAME.startsWith(EXPORT_FILE_PREFIX)).toBe(true);
  });
});

describe("PDF report", () => {
  it("prints the English medical disclaimer in the page footer by default", () => {
    const html = generatePDFHTML(entries, range);
    expect(html).toContain(
      '<div class="page-disclaimer">Eleva Diary is a personal diary. It is not a medical device and does not diagnose, treat, cure or prevent any condition. Talk to a health professional about your symptoms.</div>'
    );
  });

  it("prints the disclaimer it is given, in the user's language", () => {
    const html = generatePDFHTML(entries, range, {
      ...en.pdf,
      disclaimer: pt.disclaimer.text,
    });
    expect(html).toContain(pt.disclaimer.text);
  });
});

describe("recorded amounts and neutral styling", () => {
  const measured: DiaryEntry[] = [
    {
      id: "2",
      type: "urination",
      timestamp: "2026-11-10T09:00:00.000Z",
      volume: "medium",
      volumeMl: 320,
      urgency: 5,
      hadLeak: false,
      hadPain: true,
    },
    {
      id: "3",
      type: "leak",
      timestamp: "2026-11-10T10:00:00.000Z",
      severity: "full",
      urgency: 5,
      activity: "coughing",
    },
    {
      id: "4",
      type: "leak",
      timestamp: "2026-11-10T11:00:00.000Z",
      severity: "moderate",
      urgency: 4,
    },
  ];

  it("shows the exact ml in the PDF when the user entered one, and the size otherwise", () => {
    const html = generatePDFHTML([...entries, ...measured], range);
    expect(html).toContain("<td>320 ml</td>");
    expect(html).toContain("<td>Medium</td>");
  });

  it("exports the exact ml and the leak activity in the CSV", () => {
    const [header, , measuredRow, leakRow] = formatToCSV([
      ...entries,
      ...measured,
    ]).split("\n");
    const columns = header.split(",");
    const cell = (row: string, name: string) =>
      row.split(",")[columns.indexOf(name)];
    expect(cell(measuredRow, "Volume")).toBe("medium");
    expect(cell(measuredRow, "Volume (ml)")).toBe("320");
    expect(cell(leakRow, "Activity")).toBe("coughing");
    expect(cell(leakRow, "Severity")).toBe("full");
  });

  it("marks leaks, pain and high urgency in the PDF without warning colours", () => {
    const html = generatePDFHTML(measured, range);
    expect(html).not.toMatch(/has-mark (warning|danger)/);
    expect(html).not.toContain("highlight-warning");
    expect(html).not.toMatch(/#FEE2E2|#FEF3C7|#DC2626|#B45309/i);
  });

  it("uses the singular for one void or leak in the PDF daily total", () => {
    const html = generatePDFHTML(entries, range);
    expect(html).toContain(">1 void</td>");
    expect(html).toContain(">0 leaks</td>");
    const ptHtml = generatePDFHTML(
      [measured[1]],
      range,
      { ...pt.pdf, disclaimer: pt.disclaimer.text },
      "pt"
    );
    expect(ptHtml).toContain(">1 perda</td>");
    expect(ptHtml).toContain(">0 micções</td>");
  });
});

describe("PDF notes", () => {
  it("shows notes with < and > as written", () => {
    const { generatePDFHTML } = jest.requireActual("@/lib/utils/export");
    const html: string = generatePDFHTML(
      [{ ...entries[0], notes: "<200 ml & urgent>" }],
      range
    );
    expect(html).toContain("&lt;200 ml &amp; urgent&gt;");
    expect(html).not.toContain("<200 ml");
  });
});
