import type { DiaryEntry } from "@/lib/store/types";
import { format } from "date-fns";
import {
  cacheDirectory,
  documentDirectory,
  writeAsStringAsync,
} from "expo-file-system";
import { printToFileAsync } from "expo-print";
import { shareAsync } from "expo-sharing";

// Get available directory for file operations (null on web)
const getFileDirectory = () => documentDirectory || cacheDirectory;

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
 * Escape a value for CSV format
 */
function escapeCSV(
  value: string | number | boolean | undefined | null,
): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Format entries to CSV string
 */
export function formatToCSV(entries: DiaryEntry[]): string {
  const headers = [
    "ID",
    "Type",
    "Timestamp",
    "Date",
    "Time",
    "Volume",
    "Urgency",
    "Had Leak",
    "Had Pain",
    "Drink Type",
    "Amount (ml)",
    "Severity",
    "Notes",
  ].join(",");

  const rows = entries.map((entry) => {
    const entryDate = new Date(entry.timestamp);
    const base = [
      escapeCSV(entry.id),
      escapeCSV(entry.type),
      escapeCSV(entry.timestamp),
      escapeCSV(format(entryDate, "yyyy-MM-dd")),
      escapeCSV(format(entryDate, "HH:mm")),
    ];

    switch (entry.type) {
      case "urination":
        return [
          ...base,
          escapeCSV(entry.volume),
          escapeCSV(entry.urgency),
          escapeCSV(entry.hadLeak),
          escapeCSV(entry.hadPain),
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
          escapeCSV(entry.drinkType),
          escapeCSV(entry.amount),
          "",
          escapeCSV(entry.notes),
        ].join(",");
      case "leak":
        return [
          ...base,
          "",
          escapeCSV(entry.urgency),
          "",
          "",
          "",
          "",
          escapeCSV(entry.severity),
          escapeCSV(entry.notes),
        ].join(",");
      default:
        return base.join(",");
    }
  });

  return [headers, ...rows].join("\n");
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
  voids: string;
  leaks: string;
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
  voids: "voids",
  leaks: "leaks",
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
 * Generate HTML for PDF export in traditional medical bladder diary format
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
  // Group entries by date and sort by timestamp within each day
  const groupedByDate = entries.reduce((acc, entry) => {
    const dateKey = format(new Date(entry.timestamp), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(entry);
    return acc;
  }, {} as Record<string, DiaryEntry[]>);

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

  // Calculate overall summary stats
  const urinationEntries = entries.filter((e) => e.type === "urination");
  const fluidEntries = entries.filter((e) => e.type === "fluid");
  const leakEntries = entries.filter((e) => e.type === "leak");
  const totalFluids = fluidEntries.reduce(
    (sum, e) => sum + (e.type === "fluid" ? e.amount : 0),
    0,
  );
  const totalDays = sortedDates.length;
  const avgVoidsPerDay =
    totalDays > 0 ? (urinationEntries.length / totalDays).toFixed(1) : "0";
  const avgFluidsPerDay =
    totalDays > 0 ? Math.round(totalFluids / totalDays) : 0;
  const totalPainCount = urinationEntries.filter(
    (e) => e.type === "urination" && e.hadPain,
  ).length;

  const dateRangeStr = `${format(dateRange.start, "MMM d, yyyy")} - ${format(
    dateRange.end,
    "MMM d, yyyy",
  )}`;

  // Create locale-aware date formatter
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Time formatter based on locale (12h for EN, 24h for ES/PT)
  const timeFormatter = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: locale === "en",
  });

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
      voidVolume =
        t.volumes[entry.volume as keyof typeof t.volumes] || entry.volume;
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
        <td class="mark-cell ${leakMod ? "has-mark warning" : ""}">${leakMod}</td>
        <td class="mark-cell ${leakFull ? "has-mark danger" : ""}">${leakFull}</td>
        <td class="num-cell ${urgency && parseInt(urgency) >= 4 ? "highlight-warning" : ""}">${urgency}</td>
        <td class="mark-cell ${pain ? "has-mark danger" : ""}">${pain}</td>
        <td class="notes-cell">${notes}</td>
      </tr>
    `;
  };

  // Generate a page for each day
  const generateDayPage = (
    date: string,
    dayEntries: DiaryEntry[],
    pageNum: number,
  ): string => {
    const formattedDate = dateFormatter.format(new Date(date));

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
              <td class="num-cell">${dayVoids.length} ${t.voids}</td>
              <td colspan="3" class="num-cell">${dayLeaks.length} ${t.leaks}</td>
              <td colspan="2" class="num-cell">${dayPainCount > 0 ? dayPainCount + " " + t.pain.toLowerCase() : "-"}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>

        <div class="page-footer">
          ${t.page} ${pageNum} ${t.of} ${totalPages} • ${t.generatedBy}
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
    .mark-cell.has-mark {
      background: #E0F2FE;
      color: #0369A1;
    }
    .mark-cell.has-mark.warning {
      background: #FEF3C7;
      color: #B45309;
    }
    .mark-cell.has-mark.danger {
      background: #FEE2E2;
      color: #DC2626;
    }
    .notes-cell {
      text-align: left;
      font-size: 9px;
      color: #4B5563;
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .highlight-warning {
      background: #FEF3C7 !important;
      color: #B45309;
      font-weight: 600;
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

    /* Page Footer */
    .page-footer {
      margin-top: 12px;
      text-align: center;
      font-size: 9px;
      color: #6B7280;
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

/**
 * Export entries to file and share via native share sheet
 */
export async function exportAndShare(
  entries: DiaryEntry[],
  exportFormat: ExportFormat,
  dateRange: { start: Date; end: Date },
  pdfTranslations?: PDFTranslations,
  locale?: string,
): Promise<{ success: boolean; error?: string }> {
  if (entries.length === 0) {
    return { success: false, error: "No entries to export" };
  }

  try {
    let filePath: string;
    let mimeType: string;
    let uti: string;

    if (exportFormat === "pdf") {
      // Generate PDF using expo-print with translations
      const html = generatePDFHTML(entries, dateRange, pdfTranslations, locale);
      const { uri } = await printToFileAsync({ html });
      filePath = uri;
      mimeType = "application/pdf";
      uti = "com.adobe.pdf";
    } else {
      const fileDir = getFileDirectory();
      if (!fileDir) {
        return { success: false, error: "File system not available" };
      }

      // Generate file content
      const content =
        exportFormat === "csv" ? formatToCSV(entries) : formatToJSON(entries);

      // Generate filename with date range info
      const startStr = format(dateRange.start, "MMM-d");
      const endStr = format(dateRange.end, "MMM-d-yyyy");
      const filename = `eleva-diary-${startStr}-to-${endStr}.${exportFormat}`;
      filePath = `${fileDir}${filename}`;

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
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
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
      const timestamps = entries.map((e) => new Date(e.timestamp).getTime());
      const earliest = new Date(Math.min(...timestamps));
      earliest.setHours(0, 0, 0, 0);
      return { start: earliest, end: today };
    }
  }
}
