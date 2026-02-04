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

export type ExportFormat = "csv" | "json" | "pdf";

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
