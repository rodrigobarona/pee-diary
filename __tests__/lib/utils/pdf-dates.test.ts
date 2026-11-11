/** @jest-environment-options {"timezone": "Atlantic/Azores"} */
// The Azores are UTC-1 in winter. Reading a "yyyy-MM-dd" key as UTC midnight
// labelled every PDF day page with the previous day there.
import type { DiaryEntry } from "@/lib/store/types";
import { generatePDFHTML } from "@/lib/utils/export";

jest.mock("expo-file-system/legacy", () => ({}));
jest.mock("expo-print", () => ({}));
jest.mock("expo-sharing", () => ({}));

const entry = (id: string, timestamp: string): DiaryEntry => ({
  id,
  type: "fluid",
  timestamp,
  drinkType: "water",
  amount: 250,
});

describe("PDF day pages (Atlantic/Azores)", () => {
  it("runs west of UTC", () => {
    expect(new Date("2026-11-11T12:00:00Z").getTimezoneOffset()).toBe(60);
  });

  it("labels each page with the local day of its entries", () => {
    const html = generatePDFHTML(
      [
        entry("1", "2026-11-11T10:00:00.000Z"), // 09:00 on 11 Nov
        entry("2", "2026-11-12T00:30:00.000Z"), // 23:30 on 11 Nov
      ],
      {
        start: new Date(2026, 10, 11),
        end: new Date(2026, 10, 11, 23, 59, 59),
      }
    );
    expect(html).toContain("Wednesday, November 11, 2026");
    expect(html).not.toContain("Tuesday, November 10, 2026");
    expect(html).not.toContain("Thursday, November 12, 2026");
  });
});
