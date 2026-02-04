import type { DiaryEntry } from "@/lib/store/types";
import { format } from "date-fns";
import {
  cacheDirectory,
  documentDirectory,
  EncodingType,
  writeAsStringAsync,
} from "expo-file-system";
import { printToFileAsync } from "expo-print";
import { shareAsync } from "expo-sharing";
import * as XLSX from "xlsx";

// Get available directory for file operations (null on web)
const getFileDirectory = () => documentDirectory || cacheDirectory;

// Check if running on web platform
// On web, both documentDirectory and cacheDirectory are null
const isWeb = () => {
  // Primary check: expo-file-system directories are null on web
  if (!documentDirectory && !cacheDirectory) {
    return true;
  }
  // Fallback check: browser environment
  return (
    typeof window !== "undefined" && typeof window.document !== "undefined"
  );
};

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
 * Helper to get urgency label
 */
function getUrgencyLabel(urgency: number): string {
  const labels: Record<number, string> = {
    1: "None",
    2: "Mild",
    3: "Moderate",
    4: "Strong",
    5: "Urgent",
  };
  return labels[urgency] || String(urgency);
}

/**
 * Helper to get entry type icon/emoji
 */
function getEntryTypeEmoji(type: string): string {
  switch (type) {
    case "urination":
      return "🚽";
    case "fluid":
      return "💧";
    case "leak":
      return "⚠️";
    default:
      return "📝";
  }
}

/**
 * Generate HTML for PDF export with beautiful formatting
 */
export function generatePDFHTML(
  entries: DiaryEntry[],
  dateRange: { start: Date; end: Date },
): string {
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  // Group entries by date
  const groupedByDate = sortedEntries.reduce((acc, entry) => {
    const dateKey = format(new Date(entry.timestamp), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(entry);
    return acc;
  }, {} as Record<string, DiaryEntry[]>);

  // Calculate summary stats
  const urinationEntries = entries.filter((e) => e.type === "urination");
  const fluidEntries = entries.filter((e) => e.type === "fluid");
  const leakEntries = entries.filter((e) => e.type === "leak");
  const totalFluids = fluidEntries.reduce(
    (sum, e) => sum + (e.type === "fluid" ? e.amount : 0),
    0,
  );

  const dateRangeStr = `${format(dateRange.start, "MMM d, yyyy")} - ${format(
    dateRange.end,
    "MMM d, yyyy",
  )}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #F9FAFB;
      color: #111827;
      line-height: 1.5;
      padding: 40px;
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 2px solid #E5E7EB;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      color: #006D77;
      margin-bottom: 8px;
    }
    .header .date-range {
      font-size: 14px;
      color: #6B7280;
    }
    .summary {
      display: flex;
      justify-content: space-around;
      margin-bottom: 32px;
      padding: 24px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .summary-item {
      text-align: center;
    }
    .summary-value {
      font-size: 32px;
      font-weight: 700;
      color: #006D77;
    }
    .summary-label {
      font-size: 12px;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .date-group {
      margin-bottom: 24px;
    }
    .date-header {
      font-size: 16px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 12px;
      padding: 8px 16px;
      background: #E5E7EB;
      border-radius: 8px;
    }
    .entries-list {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .entry {
      padding: 16px;
      border-bottom: 1px solid #F3F4F6;
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .entry:last-child {
      border-bottom: none;
    }
    .entry-icon {
      font-size: 20px;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #F3F4F6;
      border-radius: 10px;
    }
    .entry-content {
      flex: 1;
    }
    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    .entry-type {
      font-weight: 600;
      color: #111827;
      text-transform: capitalize;
    }
    .entry-time {
      font-size: 13px;
      color: #6B7280;
    }
    .entry-details {
      font-size: 13px;
      color: #4B5563;
    }
    .entry-notes {
      font-size: 12px;
      color: #6B7280;
      font-style: italic;
      margin-top: 4px;
    }
    .tag {
      display: inline-block;
      padding: 2px 8px;
      background: #E0F2FE;
      color: #0369A1;
      border-radius: 12px;
      font-size: 11px;
      margin-right: 6px;
    }
    .tag.warning {
      background: #FEF3C7;
      color: #B45309;
    }
    .tag.danger {
      background: #FEE2E2;
      color: #DC2626;
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #E5E7EB;
      text-align: center;
      font-size: 12px;
      color: #9CA3AF;
    }
    @media print {
      body {
        padding: 20px;
      }
      .date-group {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Eleva Diary Report</h1>
    <div class="date-range">${dateRangeStr}</div>
  </div>

  <div class="summary">
    <div class="summary-item">
      <div class="summary-value">${urinationEntries.length}</div>
      <div class="summary-label">Bathroom Visits</div>
    </div>
    <div class="summary-item">
      <div class="summary-value">${totalFluids.toLocaleString()}</div>
      <div class="summary-label">ml Fluids</div>
    </div>
    <div class="summary-item">
      <div class="summary-value">${leakEntries.length}</div>
      <div class="summary-label">Leaks</div>
    </div>
    <div class="summary-item">
      <div class="summary-value">${Object.keys(groupedByDate).length}</div>
      <div class="summary-label">Days</div>
    </div>
  </div>

  ${Object.entries(groupedByDate)
    .map(
      ([date, dayEntries]) => `
    <div class="date-group">
      <div class="date-header">${format(
        new Date(date),
        "EEEE, MMMM d, yyyy",
      )}</div>
      <div class="entries-list">
        ${dayEntries
          .map((entry) => {
            let details = "";
            let tags = "";

            if (entry.type === "urination") {
              details = `Volume: ${entry.volume} • Urgency: ${getUrgencyLabel(
                entry.urgency,
              )}`;
              if (entry.hadLeak)
                tags += '<span class="tag warning">Had leak</span>';
              if (entry.hadPain)
                tags += '<span class="tag danger">Had pain</span>';
            } else if (entry.type === "fluid") {
              details = `${entry.amount}ml ${entry.drinkType}`;
            } else if (entry.type === "leak") {
              details = `Severity: ${
                entry.severity
              } • Urgency: ${getUrgencyLabel(entry.urgency)}`;
            }

            return `
            <div class="entry">
              <div class="entry-icon">${getEntryTypeEmoji(entry.type)}</div>
              <div class="entry-content">
                <div class="entry-header">
                  <span class="entry-type">${
                    entry.type === "fluid" ? "Fluid Intake" : entry.type
                  }</span>
                  <span class="entry-time">${format(
                    new Date(entry.timestamp),
                    "h:mm a",
                  )}</span>
                </div>
                <div class="entry-details">${details}</div>
                ${tags ? `<div style="margin-top: 6px">${tags}</div>` : ""}
                ${
                  entry.notes
                    ? `<div class="entry-notes">"${entry.notes}"</div>`
                    : ""
                }
              </div>
            </div>
          `;
          })
          .join("")}
      </div>
    </div>
  `,
    )
    .join("")}

  <div class="footer">
    Generated on ${format(
      new Date(),
      "MMMM d, yyyy at h:mm a",
    )} • Eleva Diary by Eleva Care
  </div>
</body>
</html>
  `;
}

export type ExportFormat = "csv" | "json" | "pdf" | "xlsx";

/**
 * Create Excel workbook with multiple sheets for comprehensive analysis
 */
export function createExcelWorkbook(
  entries: DiaryEntry[],
  dateRange: { start: Date; end: Date },
): XLSX.WorkBook {
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  // Sheet 1: All Entries - Complete chronological list
  const allEntriesData = sortedEntries.map((entry) => {
    const entryDate = new Date(entry.timestamp);
    const baseData = {
      Date: format(entryDate, "yyyy-MM-dd"),
      Time: format(entryDate, "HH:mm"),
      Type: entry.type.charAt(0).toUpperCase() + entry.type.slice(1),
      Volume: "",
      Urgency: "",
      "Drink Type": "",
      "Amount (ml)": "",
      Severity: "",
      "Had Leak": "",
      "Had Pain": "",
      Notes: entry.notes || "",
    };

    if (entry.type === "urination") {
      baseData.Volume =
        entry.volume.charAt(0).toUpperCase() + entry.volume.slice(1);
      baseData.Urgency = getUrgencyLabel(entry.urgency);
      baseData["Had Leak"] = entry.hadLeak ? "Yes" : "No";
      baseData["Had Pain"] = entry.hadPain ? "Yes" : "No";
    } else if (entry.type === "fluid") {
      baseData["Drink Type"] =
        entry.drinkType.charAt(0).toUpperCase() + entry.drinkType.slice(1);
      baseData["Amount (ml)"] = String(entry.amount);
    } else if (entry.type === "leak") {
      baseData.Severity =
        entry.severity.charAt(0).toUpperCase() + entry.severity.slice(1);
      baseData.Urgency = getUrgencyLabel(entry.urgency);
    }

    return baseData;
  });

  // Sheet 2: Daily Summary - Aggregated data per day
  const groupedByDate = sortedEntries.reduce((acc, entry) => {
    const dateKey = format(new Date(entry.timestamp), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(entry);
    return acc;
  }, {} as Record<string, DiaryEntry[]>);

  const dailySummaryData = Object.entries(groupedByDate).map(
    ([date, dayEntries]) => {
      const urinationEntries = dayEntries.filter((e) => e.type === "urination");
      const fluidEntries = dayEntries.filter((e) => e.type === "fluid");
      const leakEntries = dayEntries.filter((e) => e.type === "leak");

      const totalFluids = fluidEntries.reduce(
        (sum, e) => sum + (e.type === "fluid" ? e.amount : 0),
        0,
      );

      const urgencySum = urinationEntries.reduce(
        (sum, e) => sum + (e.type === "urination" ? e.urgency : 0),
        0,
      );
      const avgUrgency =
        urinationEntries.length > 0
          ? (urgencySum / urinationEntries.length).toFixed(1)
          : "-";

      return {
        Date: date,
        "Day of Week": format(new Date(date), "EEEE"),
        "Total Voids": urinationEntries.length,
        "Total Fluids (ml)": totalFluids,
        "Fluid Entries": fluidEntries.length,
        "Avg Urgency": avgUrgency,
        "Leak Count": leakEntries.length,
        Entries: dayEntries.length,
      };
    },
  );

  // Sheet 3: Summary Stats - Overall statistics
  const urinationEntries = entries.filter((e) => e.type === "urination");
  const fluidEntries = entries.filter((e) => e.type === "fluid");
  const leakEntries = entries.filter((e) => e.type === "leak");
  const totalFluids = fluidEntries.reduce(
    (sum, e) => sum + (e.type === "fluid" ? e.amount : 0),
    0,
  );

  const dateRangeStr = `${format(dateRange.start, "MMM d, yyyy")} - ${format(
    dateRange.end,
    "MMM d, yyyy",
  )}`;

  const summaryStatsData = [
    { Metric: "Report", Value: "Eleva Diary Export" },
    { Metric: "Date Range", Value: dateRangeStr },
    { Metric: "Export Date", Value: format(new Date(), "MMM d, yyyy HH:mm") },
    { Metric: "", Value: "" },
    { Metric: "Total Entries", Value: entries.length },
    { Metric: "Total Days", Value: Object.keys(groupedByDate).length },
    { Metric: "", Value: "" },
    { Metric: "Urination Entries", Value: urinationEntries.length },
    { Metric: "Fluid Entries", Value: fluidEntries.length },
    { Metric: "Leak Entries", Value: leakEntries.length },
    { Metric: "", Value: "" },
    { Metric: "Total Fluids (ml)", Value: totalFluids },
    {
      Metric: "Avg Fluids per Day (ml)",
      Value:
        Object.keys(groupedByDate).length > 0
          ? Math.round(totalFluids / Object.keys(groupedByDate).length)
          : 0,
    },
    {
      Metric: "Avg Voids per Day",
      Value:
        Object.keys(groupedByDate).length > 0
          ? (
              urinationEntries.length / Object.keys(groupedByDate).length
            ).toFixed(1)
          : 0,
    },
  ];

  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Add All Entries sheet
  const allEntriesSheet = XLSX.utils.json_to_sheet(allEntriesData);
  allEntriesSheet["!cols"] = [
    { wch: 12 }, // Date
    { wch: 6 }, // Time
    { wch: 10 }, // Type
    { wch: 8 }, // Volume
    { wch: 10 }, // Urgency
    { wch: 12 }, // Drink Type
    { wch: 12 }, // Amount
    { wch: 10 }, // Severity
    { wch: 10 }, // Had Leak
    { wch: 10 }, // Had Pain
    { wch: 30 }, // Notes
  ];
  XLSX.utils.book_append_sheet(workbook, allEntriesSheet, "All Entries");

  // Add Daily Summary sheet
  const dailySummarySheet = XLSX.utils.json_to_sheet(dailySummaryData);
  dailySummarySheet["!cols"] = [
    { wch: 12 }, // Date
    { wch: 12 }, // Day of Week
    { wch: 12 }, // Total Voids
    { wch: 16 }, // Total Fluids
    { wch: 14 }, // Fluid Entries
    { wch: 12 }, // Avg Urgency
    { wch: 12 }, // Leak Count
    { wch: 10 }, // Entries
  ];
  XLSX.utils.book_append_sheet(workbook, dailySummarySheet, "Daily Summary");

  // Add Summary Stats sheet
  const summaryStatsSheet = XLSX.utils.json_to_sheet(summaryStatsData);
  summaryStatsSheet["!cols"] = [
    { wch: 22 }, // Metric
    { wch: 30 }, // Value
  ];
  XLSX.utils.book_append_sheet(workbook, summaryStatsSheet, "Summary");

  return workbook;
}

/**
 * Generate Excel workbook and return as base64 string (for native platforms)
 */
export function formatToExcel(
  entries: DiaryEntry[],
  dateRange: { start: Date; end: Date },
): string {
  const workbook = createExcelWorkbook(entries, dateRange);
  return XLSX.write(workbook, { type: "base64", bookType: "xlsx" });
}

/**
 * Export entries to file and share via native share sheet
 */
export async function exportAndShare(
  entries: DiaryEntry[],
  exportFormat: ExportFormat,
  dateRange: { start: Date; end: Date },
): Promise<{ success: boolean; error?: string }> {
  if (entries.length === 0) {
    return { success: false, error: "No entries to export" };
  }

  try {
    let filePath: string;
    let mimeType: string;
    let uti: string;

    if (exportFormat === "pdf") {
      // Generate PDF using expo-print
      const html = generatePDFHTML(entries, dateRange);
      const { uri } = await printToFileAsync({ html });
      filePath = uri;
      mimeType = "application/pdf";
      uti = "com.adobe.pdf";
    } else if (exportFormat === "xlsx") {
      // Generate Excel using SheetJS
      const startStr = format(dateRange.start, "MMM-d");
      const endStr = format(dateRange.end, "MMM-d-yyyy");
      const filename = `eleva-diary-${startStr}-to-${endStr}.xlsx`;

      if (isWeb()) {
        // Excel export not fully supported on web platform
        // Try to trigger download via data URL
        try {
          const b64 = formatToExcel(entries, dateRange);
          const dataUrl = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${b64}`;

          // Check if we have access to document APIs
          if (typeof document !== "undefined" && document.createElement) {
            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return { success: true };
          }
        } catch (e) {
          // Fall through to error
        }

        // If we get here, web download failed
        return {
          success: false,
          error:
            "Excel export is only available on iOS and Android. Please use PDF or try from a mobile device.",
        };
      }

      // On native, use base64 encoding with expo-file-system
      const fileDir = getFileDirectory();
      if (!fileDir) {
        return { success: false, error: "File system not available" };
      }

      const b64 = formatToExcel(entries, dateRange);
      filePath = `${fileDir}${filename}`;

      // Write base64 encoded file
      await writeAsStringAsync(filePath, b64, {
        encoding: EncodingType.Base64,
      });

      mimeType =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      uti = "org.openxmlformats.spreadsheetml.sheet";
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
