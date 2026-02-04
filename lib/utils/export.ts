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
 * Helper type for daily statistics
 */
interface DailyStats {
  date: string;
  dayName: string;
  voidCount: number;
  totalFluids: number;
  avgUrgency: string;
  maxUrgency: number;
  leakCount: number;
  painCount: number;
  fluidBreakdown: {
    water: number;
    coffee: number;
    tea: number;
    juice: number;
    alcohol: number;
    other: number;
  };
}

/**
 * Calculate daily statistics from entries grouped by date
 */
function calculateDailyStats(
  groupedByDate: Record<string, DiaryEntry[]>,
): DailyStats[] {
  return Object.entries(groupedByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayEntries]) => {
      const urinationEntries = dayEntries.filter((e) => e.type === "urination");
      const fluidEntries = dayEntries.filter((e) => e.type === "fluid");
      const leakEntries = dayEntries.filter((e) => e.type === "leak");

      // Calculate urgency stats
      const urgencies = urinationEntries.map((e) =>
        e.type === "urination" ? e.urgency : 0,
      );
      const avgUrgency =
        urgencies.length > 0
          ? (urgencies.reduce((a, b) => a + b, 0) / urgencies.length).toFixed(1)
          : "-";
      const maxUrgency = urgencies.length > 0 ? Math.max(...urgencies) : 0;

      // Count pain incidents
      const painCount = urinationEntries.filter(
        (e) => e.type === "urination" && e.hadPain,
      ).length;

      // Calculate fluid breakdown
      const fluidBreakdown = {
        water: 0,
        coffee: 0,
        tea: 0,
        juice: 0,
        alcohol: 0,
        other: 0,
      };
      fluidEntries.forEach((e) => {
        if (e.type === "fluid") {
          fluidBreakdown[e.drinkType] += e.amount;
        }
      });

      const totalFluids = Object.values(fluidBreakdown).reduce(
        (a, b) => a + b,
        0,
      );

      return {
        date,
        dayName: format(new Date(date), "EEE"),
        voidCount: urinationEntries.length,
        totalFluids,
        avgUrgency,
        maxUrgency,
        leakCount: leakEntries.length,
        painCount,
        fluidBreakdown,
      };
    });
}

/**
 * Generate HTML for PDF export with table-based landscape layout
 */
export function generatePDFHTML(
  entries: DiaryEntry[],
  dateRange: { start: Date; end: Date },
): string {
  // Group entries by date
  const groupedByDate = entries.reduce((acc, entry) => {
    const dateKey = format(new Date(entry.timestamp), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(entry);
    return acc;
  }, {} as Record<string, DiaryEntry[]>);

  // Calculate daily statistics
  const dailyStats = calculateDailyStats(groupedByDate);

  // Calculate overall summary stats
  const urinationEntries = entries.filter((e) => e.type === "urination");
  const fluidEntries = entries.filter((e) => e.type === "fluid");
  const leakEntries = entries.filter((e) => e.type === "leak");
  const totalFluids = fluidEntries.reduce(
    (sum, e) => sum + (e.type === "fluid" ? e.amount : 0),
    0,
  );
  const totalDays = Object.keys(groupedByDate).length;

  // Calculate averages
  const avgVoidsPerDay =
    totalDays > 0 ? (urinationEntries.length / totalDays).toFixed(1) : "0";
  const avgFluidsPerDay =
    totalDays > 0 ? Math.round(totalFluids / totalDays) : 0;

  // Calculate overall urgency average
  const allUrgencies = urinationEntries.map((e) =>
    e.type === "urination" ? e.urgency : 0,
  );
  const overallAvgUrgency =
    allUrgencies.length > 0
      ? (allUrgencies.reduce((a, b) => a + b, 0) / allUrgencies.length).toFixed(
          1,
        )
      : "-";

  // Total pain count
  const totalPainCount = urinationEntries.filter(
    (e) => e.type === "urination" && e.hadPain,
  ).length;

  const dateRangeStr = `${format(dateRange.start, "MMM d, yyyy")} - ${format(
    dateRange.end,
    "MMM d, yyyy",
  )}`;

  // Generate daily comparison table rows
  const dailyTableRows = dailyStats
    .map(
      (day, index) => `
    <tr class="${index % 2 === 0 ? "even" : "odd"}">
      <td class="date-cell">${day.dayName} ${format(
        new Date(day.date),
        "d",
      )}</td>
      <td class="num-cell">${day.voidCount}</td>
      <td class="num-cell">${day.totalFluids.toLocaleString()}</td>
      <td class="num-cell">${day.avgUrgency}</td>
      <td class="num-cell ${day.maxUrgency >= 4 ? "highlight-warning" : ""}">${
        day.maxUrgency || "-"
      }</td>
      <td class="num-cell ${day.leakCount > 0 ? "highlight-warning" : ""}">${
        day.leakCount
      }</td>
      <td class="num-cell ${day.painCount > 0 ? "highlight-danger" : ""}">${
        day.painCount
      }</td>
    </tr>
  `,
    )
    .join("");

  // Generate fluid breakdown table rows
  const fluidTableRows = dailyStats
    .map(
      (day, index) => `
    <tr class="${index % 2 === 0 ? "even" : "odd"}">
      <td class="date-cell">${day.dayName} ${format(
        new Date(day.date),
        "d",
      )}</td>
      <td class="num-cell">${day.fluidBreakdown.water || "-"}</td>
      <td class="num-cell">${day.fluidBreakdown.coffee || "-"}</td>
      <td class="num-cell">${day.fluidBreakdown.tea || "-"}</td>
      <td class="num-cell">${day.fluidBreakdown.juice || "-"}</td>
      <td class="num-cell ${
        day.fluidBreakdown.alcohol > 0 ? "highlight-warning" : ""
      }">${day.fluidBreakdown.alcohol || "-"}</td>
      <td class="num-cell">${day.fluidBreakdown.other || "-"}</td>
      <td class="num-cell total-cell">${day.totalFluids.toLocaleString()}</td>
    </tr>
  `,
    )
    .join("");

  // Calculate fluid totals for footer
  const fluidTotals = dailyStats.reduce(
    (acc, day) => {
      acc.water += day.fluidBreakdown.water;
      acc.coffee += day.fluidBreakdown.coffee;
      acc.tea += day.fluidBreakdown.tea;
      acc.juice += day.fluidBreakdown.juice;
      acc.alcohol += day.fluidBreakdown.alcohol;
      acc.other += day.fluidBreakdown.other;
      return acc;
    },
    { water: 0, coffee: 0, tea: 0, juice: 0, alcohol: 0, other: 0 },
  );

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @page {
      size: landscape;
      margin: 12mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #FFFFFF;
      color: #111827;
      font-size: 11px;
      line-height: 1.4;
      padding: 0;
    }
    .header {
      text-align: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #006D77;
    }
    .header h1 {
      font-size: 20px;
      font-weight: 700;
      color: #006D77;
      margin-bottom: 4px;
    }
    .header .date-range {
      font-size: 12px;
      color: #6B7280;
    }
    
    /* Summary Statistics Grid */
    .summary-grid {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      padding: 12px 16px;
      background: #F0FDFA;
      border: 1px solid #006D77;
      border-radius: 8px;
    }
    .summary-item {
      text-align: center;
      flex: 1;
      border-right: 1px solid #99E2D8;
      padding: 0 8px;
    }
    .summary-item:last-child {
      border-right: none;
    }
    .summary-value {
      font-size: 22px;
      font-weight: 700;
      color: #006D77;
    }
    .summary-label {
      font-size: 9px;
      color: #4B5563;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .summary-sub {
      font-size: 9px;
      color: #6B7280;
      margin-top: 2px;
    }
    
    /* Section Titles */
    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: #006D77;
      margin: 16px 0 8px 0;
      padding-bottom: 4px;
      border-bottom: 1px solid #E5E7EB;
    }
    
    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 10px;
    }
    th {
      background: #006D77;
      color: white;
      font-weight: 600;
      padding: 8px 6px;
      text-align: center;
      border: 1px solid #005A63;
    }
    td {
      padding: 6px;
      border: 1px solid #E5E7EB;
      text-align: center;
    }
    tr.even {
      background: #FFFFFF;
    }
    tr.odd {
      background: #F9FAFB;
    }
    tr.total-row {
      background: #F0FDFA;
      font-weight: 600;
    }
    .date-cell {
      text-align: left;
      font-weight: 500;
      white-space: nowrap;
    }
    .num-cell {
      font-variant-numeric: tabular-nums;
    }
    .total-cell {
      font-weight: 600;
      background: #F0FDFA;
    }
    .highlight-warning {
      background: #FEF3C7 !important;
      color: #B45309;
    }
    .highlight-danger {
      background: #FEE2E2 !important;
      color: #DC2626;
    }
    
    /* Footer */
    .footer {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #E5E7EB;
      text-align: center;
      font-size: 9px;
      color: #9CA3AF;
    }
    
    /* Page breaks */
    .page-break {
      page-break-before: always;
    }
    table {
      page-break-inside: auto;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    thead {
      display: table-header-group;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Eleva Diary Report</h1>
    <div class="date-range">${dateRangeStr}</div>
  </div>

  <!-- Summary Statistics -->
  <div class="summary-grid">
    <div class="summary-item">
      <div class="summary-value">${totalDays}</div>
      <div class="summary-label">Days Tracked</div>
    </div>
    <div class="summary-item">
      <div class="summary-value">${urinationEntries.length}</div>
      <div class="summary-label">Total Voids</div>
      <div class="summary-sub">${avgVoidsPerDay} avg/day</div>
    </div>
    <div class="summary-item">
      <div class="summary-value">${totalFluids.toLocaleString()}</div>
      <div class="summary-label">Total Fluids (ml)</div>
      <div class="summary-sub">${avgFluidsPerDay.toLocaleString()} avg/day</div>
    </div>
    <div class="summary-item">
      <div class="summary-value">${overallAvgUrgency}</div>
      <div class="summary-label">Avg Urgency</div>
      <div class="summary-sub">Scale 1-5</div>
    </div>
    <div class="summary-item">
      <div class="summary-value">${leakEntries.length}</div>
      <div class="summary-label">Leak Incidents</div>
    </div>
    <div class="summary-item">
      <div class="summary-value">${totalPainCount}</div>
      <div class="summary-label">Pain Events</div>
    </div>
  </div>

  <!-- Daily Comparison Table -->
  <div class="section-title">Daily Comparison</div>
  <table>
    <thead>
      <tr>
        <th style="width: 80px;">Date</th>
        <th style="width: 60px;">Voids</th>
        <th style="width: 80px;">Fluids (ml)</th>
        <th style="width: 70px;">Avg Urg.</th>
        <th style="width: 70px;">Max Urg.</th>
        <th style="width: 60px;">Leaks</th>
        <th style="width: 60px;">Pain</th>
      </tr>
    </thead>
    <tbody>
      ${dailyTableRows}
      <tr class="total-row">
        <td class="date-cell">TOTAL</td>
        <td class="num-cell">${urinationEntries.length}</td>
        <td class="num-cell">${totalFluids.toLocaleString()}</td>
        <td class="num-cell">${overallAvgUrgency}</td>
        <td class="num-cell">-</td>
        <td class="num-cell">${leakEntries.length}</td>
        <td class="num-cell">${totalPainCount}</td>
      </tr>
    </tbody>
  </table>

  <!-- Fluid Intake Breakdown -->
  <div class="section-title">Fluid Intake Breakdown (ml)</div>
  <table>
    <thead>
      <tr>
        <th style="width: 80px;">Date</th>
        <th>Water</th>
        <th>Coffee</th>
        <th>Tea</th>
        <th>Juice</th>
        <th>Alcohol</th>
        <th>Other</th>
        <th style="width: 80px;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${fluidTableRows}
      <tr class="total-row">
        <td class="date-cell">TOTAL</td>
        <td class="num-cell">${fluidTotals.water.toLocaleString()}</td>
        <td class="num-cell">${fluidTotals.coffee.toLocaleString()}</td>
        <td class="num-cell">${fluidTotals.tea.toLocaleString()}</td>
        <td class="num-cell">${fluidTotals.juice.toLocaleString()}</td>
        <td class="num-cell">${fluidTotals.alcohol.toLocaleString()}</td>
        <td class="num-cell">${fluidTotals.other.toLocaleString()}</td>
        <td class="num-cell total-cell">${totalFluids.toLocaleString()}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    Generated on ${format(
      new Date(),
      "MMMM d, yyyy 'at' h:mm a",
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
