// Runs in America/New_York (see jest.environment.js): west of UTC, with
// daylight-saving time, where UTC dates and local dates differ every evening.
import {
  addDaysToKey,
  getTodayKey,
  groupByDay,
  isDayKey,
  msUntilNextLocalMidnight,
  parseDayKey,
  toDayKey,
} from "@/lib/utils/day";
import { formatDate } from "@/lib/utils/date";

describe("local calendar days", () => {
  it("runs in a time zone that is not UTC", () => {
    expect(new Date("2026-11-11T12:00:00Z").getTimezoneOffset()).toBe(300);
  });

  it("keys an evening entry by its local day, not its UTC date", () => {
    // 21:30 on 10 Nov in New York is 02:30 on 11 Nov in UTC
    expect(toDayKey("2026-11-11T02:30:00.000Z")).toBe("2026-11-10");
    expect(toDayKey(new Date(2026, 10, 10, 23, 59))).toBe("2026-11-10");
  });

  it("reads a day key as local midnight of that day", () => {
    const date = parseDayKey("2026-11-11");
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(10);
    expect(date.getDate()).toBe(11);
    expect(date.getHours()).toBe(0);
    // new Date("2026-11-11") would be 19:00 on 10 Nov here
    expect(new Date("2026-11-11").getDate()).toBe(10);
  });

  it("rejects malformed keys and impossible days", () => {
    expect(isDayKey("2026-11-11")).toBe(true);
    expect(isDayKey("2026-02-30")).toBe(false);
    expect(isDayKey("2026-11-11T00:00:00Z")).toBe(false);
    expect(isDayKey(20261111)).toBe(false);
    expect(() => parseDayKey("11/11/2026")).toThrow(RangeError);
  });

  it("moves by calendar days across daylight-saving changes", () => {
    // Clocks go forward on 8 March 2026 and back on 1 November 2026
    expect(addDaysToKey("2026-03-07", 1)).toBe("2026-03-08");
    expect(addDaysToKey("2026-03-08", 1)).toBe("2026-03-09");
    expect(addDaysToKey("2026-11-01", -1)).toBe("2026-10-31");
    expect(addDaysToKey("2026-11-02", -2)).toBe("2026-10-31");
    expect(addDaysToKey("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("gives today's key from the local clock", () => {
    expect(getTodayKey(new Date(2026, 10, 11, 0, 5))).toBe("2026-11-11");
  });

  it("counts the time to the next local midnight, including 25-hour days", () => {
    expect(msUntilNextLocalMidnight(new Date(2026, 10, 10, 23, 59, 0))).toBe(
      60_000
    );
    // 1 November 2026 has 25 hours in New York
    expect(msUntilNextLocalMidnight(new Date(2026, 10, 1, 0, 0, 0))).toBe(
      25 * 3600_000
    );
  });

  it("groups entries by local day, keeping their order", () => {
    const groups = groupByDay([
      { id: "a", timestamp: "2026-11-10T15:00:00.000Z" },
      { id: "b", timestamp: "2026-11-11T03:00:00.000Z" }, // 22:00 on 10 Nov
      { id: "c", timestamp: "2026-11-11T06:00:00.000Z" }, // 01:00 on 11 Nov
    ]);
    expect([...groups.keys()]).toEqual(["2026-11-10", "2026-11-11"]);
    expect(groups.get("2026-11-10")?.map((e) => e.id)).toEqual(["a", "b"]);
    expect(groups.get("2026-11-11")?.map((e) => e.id)).toEqual(["c"]);
  });

  it("formats a day key as that day", () => {
    const label = formatDate("2026-11-11", "long");
    expect(label).toContain("11");
    expect(label).not.toContain("10");
  });
});
