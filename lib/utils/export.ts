import type { DiaryEntry } from "@/lib/store/types";
import { format } from "date-fns";
import {
  cacheDirectory,
  deleteAsync,
  documentDirectory,
  moveAsync,
  readDirectoryAsync,
  writeAsStringAsync,
} from "expo-file-system/legacy";
import { printToFileAsync } from "expo-print";
import { shareAsync } from "expo-sharing";

import { deviceTimeFormatOptions, intlLocale } from "@/lib/i18n";
import { groupByDay, parseDayKey } from "@/lib/utils/day";

// Export files are written to the cache folder, which device backups do not
// include, and are removed by deleteExportFiles(). Null on web.
const getFileDirectory = () => cacheDirectory;

// Every file the app writes for sharing starts with this prefix.
export const EXPORT_FILE_PREFIX = "eleva-diary-";

// Cache subfolders where expo-print writes PDFs and expo-document-picker
// copies picked files. Both can hold a full copy of the diary.
const CACHE_SUBFOLDERS = ["Print/", "DocumentPicker/"];

/**
 * Delete every file the app has written or copied for sharing, exporting
 * or importing. Runs at launch, before each new export and when the user
 * clears all data. Files are not deleted straight after sharing, because on
 * Android the receiving app may still be reading the file when the share
 * sheet closes.
 */
export async function deleteExportFiles(): Promise<void> {
  if (cacheDirectory) {
    await Promise.all(
      CACHE_SUBFOLDERS.map((folder) =>
        deleteAsync(`${cacheDirectory}${folder}`, { idempotent: true }).catch(
          () => {}
        )
      )
    );
  }
  // documentDirectory is included for files left by earlier builds.
  for (const dir of [cacheDirectory, documentDirectory]) {
    if (!dir) continue;
    try {
      const names = await readDirectoryAsync(dir);
      await Promise.all(
        names
          .filter((name) => name.startsWith(EXPORT_FILE_PREFIX))
          .map((name) => deleteAsync(`${dir}${name}`, { idempotent: true }))
      );
    } catch {
      // A missing or unreadable folder leaves nothing to delete.
    }
  }
}

/**
 * Filter entries by date range (inclusive)
 */
export function filterEntriesByDateRange(
  entries: DiaryEntry[],
  startDate: Date,
  endDate: Date,
): DiaryEntry[] {
  const startOfDay = new Date(startDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(endDate);
  endOfDay.setHours(23, 59, 59, 999);

  return entries.filter((entry) => {
    const entryDate = new Date(entry.timestamp);
    return entryDate >= startOfDay && entryDate <= endOfDay;
  });
}

/**
 * Escape text written by the user before putting it in the PDF's HTML, so a
 * note such as "<200 ml" shows as written.
 */
function escapeHTML(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Column names and values of the CSV, in the user's language. Without them
 * the CSV uses English column names and the stored codes ("medium").
 */
export interface CSVLabels {
  headers: [
    id: string,
    type: string,
    timestamp: string,
    date: string,
    time: string,
    volume: string,
    volumeMl: string,
    urgency: string,
    hadLeak: string,
    hadPain: string,
    drinkType: string,
    amountMl: string,
    severity: string,
    activity: string,
    notes: string,
  ];
  yes: string;
  no: string;
  // Display names of the stored codes, by column
  values: Partial<Record<CSVCodeColumn, Record<string, string>>>;
}

type CSVCodeColumn = "type" | "volume" | "drinkType" | "severity" | "activity";

const defaultCSVLabels: CSVLabels = {
  headers: [
    "ID",
    "Type",
    "Timestamp",
    "Date",
    "Time",
    "Volume",
    "Volume (ml)",
    "Urgency",
    "Had Leak",
    "Had Pain",
    "Drink Type",
    "Amount (ml)",
    "Severity",
    "Activity",
    "Notes",
  ],
  yes: "Yes",
  no: "No",
  values: {},
};

/**
 * Escape a value for CSV format. Text starting with = + - @ (or a tab or
 * carriage return) is prefixed with an apostrophe, so a spreadsheet shows a
 * note such as "=HYPERLINK(...)" as text instead of running it.
 */
function escapeCSV(
  value: string | number | boolean | undefined | null,
  labels: CSVLabels = defaultCSVLabels,
): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "boolean") return value ? labels.yes : labels.no;
  let str = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Format entries to CSV string. Starts with a UTF-8 byte order mark, so
 * spreadsheet apps show accented letters correctly.
 */
export function formatToCSV(
  entries: DiaryEntry[],
  labels: CSVLabels = defaultCSVLabels,
): string {
  const headers = labels.headers.map((name) => escapeCSV(name)).join(",");
  // A stored code shown in the user's language
  const code = (column: CSVCodeColumn, value: string | undefined) =>
    escapeCSV(
      value === undefined ? undefined : labels.values[column]?.[value] ?? value,
    );
  const bool = (value: boolean) => escapeCSV(value, labels);

  const rows = entries.map((entry) => {
    const entryDate = new Date(entry.timestamp);
    const base = [
      escapeCSV(entry.id),
      code("type", entry.type),
      escapeCSV(entry.timestamp),
      escapeCSV(format(entryDate, "yyyy-MM-dd")),
      escapeCSV(format(entryDate, "HH:mm")),
    ];

    switch (entry.type) {
      case "urination":
        return [
          ...base,
          code("volume", entry.volume),
          escapeCSV(entry.volumeMl),
          escapeCSV(entry.urgency),
          bool(entry.hadLeak),
          bool(entry.hadPain),
          "",
          "",
          "",
          "",
          escapeCSV(entry.notes),
        ].join(",");
      case "fluid":
        return [
          ...base,
          "",
          "",
          "",
          "",
          "",
          code("drinkType", entry.drinkType),
          escapeCSV(entry.amount),
          "",
          "",
          escapeCSV(entry.notes),
        ].join(",");
      case "leak":
        return [
          ...base,
          "",
          "",
          escapeCSV(entry.urgency),
          "",
          "",
          "",
          "",
          code("severity", entry.severity),
          code("activity", entry.activity),
          escapeCSV(entry.notes),
        ].join(",");
      default:
        return base.join(",");
    }
  });

  return `\uFEFF${[headers, ...rows].join("\r\n")}`;
}

/**
 * Format entries to JSON string (pretty printed)
 */
export function formatToJSON(entries: DiaryEntry[]): string {
  const exportEntries = entries.map((entry) => ({
    ...entry,
    formattedDate: format(new Date(entry.timestamp), "yyyy-MM-dd"),
    formattedTime: format(new Date(entry.timestamp), "HH:mm:ss"),
  }));

  return JSON.stringify(
    {
      exportDate: new Date().toISOString(),
      totalEntries: exportEntries.length,
      entries: exportEntries,
    },
    null,
    2,
  );
}

/**
 * PDF translations interface
 */
export interface PDFTranslations {
  title: string;
  generatedBy: string;
  generatedOn: string;
  page: string;
  of: string;
  time: string;
  fluidIntake: string;
  type: string;
  ml: string;
  voidVolume: string;
  urineLeaks: string;
  drops: string;
  moderate: string;
  full: string;
  urgency: string;
  pain: string;
  notes: string;
  dailyTotal: string;
  // Singular and plural nouns for the daily totals ("1 void", "2 voids")
  voids: { one: string; other: string };
  leaks: { one: string; other: string };
  // Daily total of voids with pain ("2 with pain")
  withPain: string;
  // Medical disclaimer printed in every page footer
  disclaimer: string;
  fluidTypes: {
    water: string;
    coffee: string;
    tea: string;
    juice: string;
    alcohol: string;
    other: string;
  };
  volumes: {
    small: string;
    medium: string;
    large: string;
  };
}

/**
 * Default English translations (fallback)
 */
const defaultPDFTranslations: PDFTranslations = {
  title: "Bladder Diary",
  generatedBy: "Eleva Diary by Eleva Care",
  generatedOn: "Generated on",
  page: "Page",
  of: "of",
  time: "Time",
  fluidIntake: "Fluid Intake",
  type: "Type",
  ml: "ml",
  voidVolume: "Void Volume",
  urineLeaks: "Urine Leaks",
  drops: "Drops",
  moderate: "Mod.",
  full: "Full",
  urgency: "Urg.",
  pain: "Pain",
  notes: "Notes",
  dailyTotal: "Daily Total:",
  voids: { one: "void", other: "voids" },
  leaks: { one: "leak", other: "leaks" },
  withPain: "with pain",
  disclaimer:
    "Eleva Diary is a personal diary. It is not a medical device and does not diagnose, treat, cure or prevent any condition. Talk to a health professional about your symptoms.",
  fluidTypes: {
    water: "Water",
    coffee: "Coffee",
    tea: "Tea",
    juice: "Juice",
    alcohol: "Alcohol",
    other: "Other",
  },
  volumes: {
    small: "Small",
    medium: "Medium",
    large: "Large",
  },
};

/**
 * Generate HTML for PDF export in the usual paper bladder diary layout
 * - Time-based rows (each entry as a row)
 * - Single integrated table with all entry types
 * - One day per page with page breaks
 */
export function generatePDFHTML(
  entries: DiaryEntry[],
  dateRange: { start: Date; end: Date },
  translations: PDFTranslations = defaultPDFTranslations,
  locale: string = "en",
): string {
  const t = translations;
  // Group entries by local calendar day and sort by timestamp within each day
  const groupedByDate = Object.fromEntries(groupByDay(entries));

  // Sort entries within each day by timestamp
  Object.keys(groupedByDate).forEach((date) => {
    groupedByDate[date].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
  });

  // Get sorted dates
  const sortedDates = Object.keys(groupedByDate).sort();
  const totalPages = sortedDates.length;

  const formatLocale = intlLocale(locale);

  // Create locale-aware date formatter
  const dateFormatter = new Intl.DateTimeFormat(formatLocale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Times in the device's 12- or 24-hour clock, as everywhere in the app
  const timeFormatter = new Intl.DateTimeFormat(
    formatLocale,
    deviceTimeFormatOptions(),
  );

  // Generate entry row for the integrated table
  const generateEntryRow = (entry: DiaryEntry, index: number): string => {
    const time = timeFormatter.format(new Date(entry.timestamp));
    const rowClass = index % 2 === 0 ? "even" : "odd";

    // Initialize all columns as empty
    let fluidType = "";
    let fluidAmount = "";
    let voidVolume = "";
    let leakDrops = "";
    let leakMod = "";
    let leakFull = "";
    let urgency = "";
    let pain = "";
    let notes = entry.notes || "";

    if (entry.type === "fluid") {
      fluidType =
        t.fluidTypes[entry.drinkType as keyof typeof t.fluidTypes] ||
        entry.drinkType;
      fluidAmount = String(entry.amount);
    } else if (entry.type === "urination") {
      // The exact amount when the user entered one, otherwise the size
      voidVolume =
        entry.volumeMl !== undefined
          ? `${entry.volumeMl} ${t.ml}`
          : t.volumes[entry.volume as keyof typeof t.volumes] || entry.volume;
      urgency = String(entry.urgency);
      pain = entry.hadPain ? "X" : "";
      if (entry.hadLeak) {
        leakDrops = "X"; // If urination had leak, mark as drops
      }
    } else if (entry.type === "leak") {
      urgency = String(entry.urgency);
      if (entry.severity === "drops") leakDrops = "X";
      else if (entry.severity === "moderate") leakMod = "X";
      else if (entry.severity === "full") leakFull = "X";
    }

    return `
      <tr class="${rowClass}">
        <td class="time-cell">${time}</td>
        <td>${fluidType}</td>
        <td class="num-cell">${fluidAmount}</td>
        <td>${voidVolume}</td>
        <td class="mark-cell ${leakDrops ? "has-mark" : ""}">${leakDrops}</td>
        <td class="mark-cell ${leakMod ? "has-mark" : ""}">${leakMod}</td>
        <td class="mark-cell ${leakFull ? "has-mark" : ""}">${leakFull}</td>
        <td class="num-cell">${urgency}</td>
        <td class="mark-cell ${pain ? "has-mark" : ""}">${pain}</td>
        <td class="notes-cell">${escapeHTML(notes)}</td>
      </tr>
    `;
  };

  // Generate a page for each day
  const generateDayPage = (
    date: string,
    dayEntries: DiaryEntry[],
    pageNum: number,
  ): string => {
    // The key is a local day: read it as local midnight, not UTC midnight,
    // or the page shows the previous day west of UTC (the Azores in winter).
    const formattedDate = dateFormatter.format(parseDayKey(date));

    // Calculate day summary
    const dayVoids = dayEntries.filter((e) => e.type === "urination");
    const dayFluids = dayEntries.filter((e) => e.type === "fluid");
    const dayLeaks = dayEntries.filter((e) => e.type === "leak");
    const dayTotalFluids = dayFluids.reduce(
      (sum, e) => sum + (e.type === "fluid" ? e.amount : 0),
      0,
    );
    const dayPainCount = dayVoids.filter(
      (e) => e.type === "urination" && e.hadPain,
    ).length;

    // Generate entry rows
    const entryRows = dayEntries
      .map((entry, index) => generateEntryRow(entry, index))
      .join("");

    return `
      <div class="day-page ${pageNum > 1 ? "page-break" : ""}">
        <div class="day-header">
          <h2>${t.title}</h2>
          <div class="day-date">${formattedDate}</div>
        </div>

        <table class="diary-table">
          <thead>
            <tr>
              <th rowspan="2" style="width: 70px;">${t.time}</th>
              <th colspan="2">${t.fluidIntake}</th>
              <th rowspan="2" style="width: 70px;">${t.voidVolume}</th>
              <th colspan="3">${t.urineLeaks}</th>
              <th rowspan="2" style="width: 50px;">${t.urgency}<br/>(1-5)</th>
              <th rowspan="2" style="width: 40px;">${t.pain}</th>
              <th rowspan="2">${t.notes}</th>
            </tr>
            <tr>
              <th style="width: 70px;">${t.type}</th>
              <th style="width: 50px;">${t.ml}</th>
              <th style="width: 45px;">${t.drops}</th>
              <th style="width: 45px;">${t.moderate}</th>
              <th style="width: 45px;">${t.full}</th>
            </tr>
          </thead>
          <tbody>
            ${entryRows}
          </tbody>
          <tfoot>
            <tr class="summary-row">
              <td colspan="2" class="summary-label">${t.dailyTotal}</td>
              <td class="num-cell">${dayTotalFluids}</td>
              <td class="num-cell">${dayVoids.length} ${dayVoids.length === 1 ? t.voids.one : t.voids.other}</td>
              <td colspan="3" class="num-cell">${dayLeaks.length} ${dayLeaks.length === 1 ? t.leaks.one : t.leaks.other}</td>
              <td colspan="2" class="num-cell">${dayPainCount > 0 ? `${dayPainCount} ${t.withPain}` : "-"}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>

        <div class="page-footer">
          ${t.page} ${pageNum} ${t.of} ${totalPages} • ${t.generatedBy}
          <div class="page-disclaimer">${t.disclaimer}</div>
        </div>
      </div>
    `;
  };

  // Generate all day pages
  const dayPages = sortedDates
    .map((date, index) => generateDayPage(date, groupedByDate[date], index + 1))
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @page {
      size: landscape;
      margin: 10mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #FFFFFF;
      color: #000000;
      font-size: 11px;
      line-height: 1.3;
    }

    /* Day Page Layout */
    .day-page {
      padding: 8px;
    }
    .page-break {
      page-break-before: always;
    }
    .day-header {
      text-align: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #006D77;
    }
    .day-header h2 {
      font-size: 18px;
      font-weight: 700;
      color: #006D77;
      margin-bottom: 2px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .day-date {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }

    /* Diary Table */
    .diary-table {
      width: 100%;
      border-collapse: collapse;
      border: 2px solid #000000;
      font-size: 10px;
    }
    .diary-table th {
      background: #006D77;
      color: white;
      font-weight: 600;
      padding: 6px 4px;
      text-align: center;
      border: 1px solid #005A63;
      font-size: 9px;
      text-transform: uppercase;
    }
    .diary-table td {
      padding: 8px 4px;
      border: 1px solid #9CA3AF;
      text-align: center;
      vertical-align: middle;
      min-height: 28px;
    }
    .diary-table tbody tr {
      height: 32px;
    }
    .diary-table tr.even {
      background: #FFFFFF;
    }
    .diary-table tr.odd {
      background: #F9FAFB;
    }

    /* Cell Types */
    .time-cell {
      font-weight: 500;
      white-space: nowrap;
      text-align: left;
      padding-left: 8px;
    }
    .num-cell {
      font-variant-numeric: tabular-nums;
    }
    .mark-cell {
      font-weight: 700;
      font-size: 12px;
    }
    /* One neutral style for every mark: the report records, it does not rate */
    .mark-cell.has-mark {
      background: #E0F2FE;
      color: #0369A1;
    }
    .notes-cell {
      text-align: left;
      font-size: 9px;
      color: #4B5563;
      max-width: 150px;
      /* The full note reaches the report: wrap, never cut */
      white-space: normal;
      overflow-wrap: anywhere;
    }

    /* Summary Row */
    .summary-row {
      background: #F0FDFA !important;
      font-weight: 600;
      border-top: 2px solid #006D77;
    }
    .summary-row td {
      padding: 8px 4px;
    }
    .summary-label {
      text-align: right;
      padding-right: 8px !important;
      font-weight: 700;
      color: #006D77;
    }

    /* Page Footer: the app's text-secondary grey (7.56:1 on white) */
    .page-footer {
      margin-top: 12px;
      text-align: center;
      font-size: 9px;
      color: #4B5563;
    }
    .page-disclaimer {
      margin-top: 4px;
      font-size: 9px;
      color: #4B5563;
    }

    /* Print optimizations */
    @media print {
      .diary-table {
        page-break-inside: auto;
      }
      .diary-table tr {
        page-break-inside: avoid;
      }
      .diary-table thead {
        display: table-header-group;
      }
      .diary-table tfoot {
        display: table-footer-group;
      }
    }
  </style>
</head>
<body>
  ${dayPages}
</body>
</html>
  `;
}

export type ExportFormat = "csv" | "json" | "pdf";

// Error codes, not messages: the export screen maps them to translated text.
export type ExportError = "noEntries" | "fileUnavailable" | "failed";

/**
 * Export entries to file and share via native share sheet
 */
export async function exportAndShare(
  entries: DiaryEntry[],
  exportFormat: ExportFormat,
  dateRange: { start: Date; end: Date },
  pdfTranslations?: PDFTranslations,
  locale?: string,
  csvLabels?: CSVLabels,
): Promise<{ success: boolean; error?: ExportError }> {
  if (entries.length === 0) {
    return { success: false, error: "noEntries" };
  }

  try {
    const fileDir = getFileDirectory();
    if (!fileDir) {
      return { success: false, error: "fileUnavailable" };
    }

    // Remove files from earlier exports before writing a new one
    await deleteExportFiles();

    // Generate filename with date range info
    // Numeric dates keep file names the same in every language
    const startStr = format(dateRange.start, "yyyy-MM-dd");
    const endStr = format(dateRange.end, "yyyy-MM-dd");
    const filename = `${EXPORT_FILE_PREFIX}${startStr}_${endStr}.${exportFormat}`;
    let filePath = `${fileDir}${filename}`;
    let mimeType: string;
    let uti: string;

    if (exportFormat === "pdf") {
      // Generate PDF using expo-print with translations
      const html = generatePDFHTML(entries, dateRange, pdfTranslations, locale);
      const { uri } = await printToFileAsync({ html });
      // Move the PDF next to the other exports so it gets a readable name and
      // deleteExportFiles() can find it.
      try {
        await moveAsync({ from: uri, to: filePath });
      } catch {
        filePath = uri;
      }
      mimeType = "application/pdf";
      uti = "com.adobe.pdf";
    } else {
      // Generate file content
      const content =
        exportFormat === "csv"
          ? formatToCSV(entries, csvLabels)
          : formatToJSON(entries);

      // Write file
      await writeAsStringAsync(filePath, content);

      mimeType = exportFormat === "csv" ? "text/csv" : "application/json";
      uti =
        exportFormat === "csv"
          ? "public.comma-separated-values-text"
          : "public.json";
    }

    // Share via native share sheet
    await shareAsync(filePath, { mimeType, UTI: uti });

    return { success: true };
  } catch (error) {
    // User cancelling share sheet is not an error
    if (error instanceof Error && error.message.includes("cancel")) {
      return { success: true };
    }
    console.error("Export error:", error);
    return { success: false, error: "failed" };
  }
}

/** Time (ms) of the earliest entry. Entries must not be empty. */
export function getEarliestTimestamp(entries: readonly DiaryEntry[]): number {
  let earliest = Infinity;
  for (const entry of entries) {
    const time = new Date(entry.timestamp).getTime();
    if (time < earliest) earliest = time;
  }
  return earliest;
}

/**
 * Get date range presets
 */
export function getDateRangePreset(
  preset: "last7days" | "last30days" | "thisMonth" | "allTime",
  entries: DiaryEntry[],
): { start: Date; end: Date } {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  switch (preset) {
    case "last7days": {
      const start = new Date();
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { start, end: today };
    }
    case "last30days": {
      const start = new Date();
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      return { start, end: today };
    }
    case "thisMonth": {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      return { start, end: today };
    }
    case "allTime": {
      if (entries.length === 0) {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        return { start, end: today };
      }
      // A loop, not Math.min(...list), which fails on very long lists
      const earliest = new Date(getEarliestTimestamp(entries));
      earliest.setHours(0, 0, 0, 0);
      return { start: earliest, end: today };
    }
  }
}
