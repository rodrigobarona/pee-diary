/**
 * Calendar days in the user's local time zone.
 *
 * Entries store their time as an ISO timestamp in UTC ("2026-11-11T00:30:00.000Z").
 * Every per-day grouping, the streak, the Today screen and the PDF day pages
 * must use the local calendar day of that moment, never the UTC date
 * (`toISOString().slice(0, 10)`), and must never read a "yyyy-MM-dd" key with
 * `new Date(key)`, which JavaScript parses as UTC midnight and shows as the
 * previous day west of UTC.
 *
 * No imports from the app, so the store, the utilities and the screens can all
 * use it.
 */

/** A local calendar day written as "yyyy-MM-dd". */
export type DayKey = string;

const DAY_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (value: number) => String(value).padStart(2, "0");

/** True for a well-formed "yyyy-MM-dd" key of a real calendar day. */
export function isDayKey(value: unknown): value is DayKey {
  if (typeof value !== "string") return false;
  const match = DAY_KEY_PATTERN.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * The local calendar day of a moment: a Date, or an ISO timestamp such as an
 * entry's `timestamp`.
 */
export function toDayKey(value: Date | string): DayKey {
  const date = typeof value === "string" ? new Date(value) : value;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
}

/** Local midnight at the start of a "yyyy-MM-dd" day. */
export function parseDayKey(key: DayKey): Date {
  const match = DAY_KEY_PATTERN.exec(key);
  if (!match) {
    throw new RangeError(`Not a yyyy-MM-dd day key: ${key}`);
  }
  const [year, month, day] = match.slice(1).map(Number);
  return new Date(year, month - 1, day);
}

/** Today's local calendar day. */
export function getTodayKey(now: Date = new Date()): DayKey {
  return toDayKey(now);
}

/**
 * The day key a number of calendar days away (negative for earlier days).
 * Works across daylight-saving changes, where a day is 23 or 25 hours long.
 */
export function addDaysToKey(key: DayKey, days: number): DayKey {
  const date = parseDayKey(key);
  date.setDate(date.getDate() + days);
  return toDayKey(date);
}

/** Milliseconds from `now` until the next local midnight. */
export function msUntilNextLocalMidnight(now: Date = new Date()): number {
  const next = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );
  return next.getTime() - now.getTime();
}

/**
 * Groups items with an ISO `timestamp` by local calendar day, keeping their
 * order within each day.
 */
export function groupByDay<T extends { timestamp: string }>(
  items: readonly T[]
): Map<DayKey, T[]> {
  const groups = new Map<DayKey, T[]>();
  for (const item of items) {
    const key = toDayKey(item.timestamp);
    const group = groups.get(key);
    if (group) {
      group.push(item);
    } else {
      groups.set(key, [item]);
    }
  }
  return groups;
}
