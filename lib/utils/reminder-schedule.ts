/**
 * When reminders fire. Pure functions, so the schedule can be tested without
 * a phone.
 *
 * Each reminder time is a repeating daily notification at a fixed local time
 * ("every day at 10:00"). Repeating notifications never run out, so reminders
 * keep working for as long as they are on, even if the app is not opened, and
 * they follow the phone's clock through time-zone and daylight-saving
 * changes. At most 24 / interval times are scheduled (12 for every 2 hours),
 * far below iOS's limit of 64 pending notifications.
 */
import type { ReminderSettings } from "@/lib/store/types";

/** iOS keeps at most 64 pending local notifications per app. */
export const IOS_PENDING_NOTIFICATION_LIMIT = 64;

export interface ReminderTime {
  hour: number;
  minute: number;
}

const parseClockTime = (value: string): number | null => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
};

/**
 * True when a time of day (minutes after midnight) falls in the quiet hours.
 * Quiet hours may run over midnight (22:00 to 07:00); the start is included
 * and the end is not. Equal start and end mean no quiet hours.
 */
export function isInQuietHours(
  minutesAfterMidnight: number,
  quietHoursStart: string,
  quietHoursEnd: string
): boolean {
  const start = parseClockTime(quietHoursStart);
  const end = parseClockTime(quietHoursEnd);
  if (start === null || end === null || start === end) return false;
  return start > end
    ? minutesAfterMidnight >= start || minutesAfterMidnight < end
    : minutesAfterMidnight >= start && minutesAfterMidnight < end;
}

/**
 * The local times of day at which a reminder fires: every `intervalHours`
 * hours from midnight (00:00, 03:00, 06:00, ... for every 3 hours), leaving
 * out the quiet hours when they are on. Empty when reminders are off.
 */
export function getReminderTimes(settings: ReminderSettings): ReminderTime[] {
  if (!settings.enabled) return [];

  const interval = Math.floor(settings.intervalHours);
  if (!Number.isFinite(interval) || interval < 1 || interval > 24) return [];

  const times: ReminderTime[] = [];
  for (let hour = 0; hour < 24; hour += interval) {
    if (
      settings.quietHoursEnabled &&
      isInQuietHours(hour * 60, settings.quietHoursStart, settings.quietHoursEnd)
    ) {
      continue;
    }
    times.push({ hour, minute: 0 });
  }
  return times.slice(0, IOS_PENDING_NOTIFICATION_LIMIT);
}

/** The id of the repeating reminder at a time of day, e.g. "diary-reminder-0900". */
export const REMINDER_IDENTIFIER_PREFIX = "diary-reminder-";

export const reminderIdentifier = ({ hour, minute }: ReminderTime) =>
  `${REMINDER_IDENTIFIER_PREFIX}${String(hour).padStart(2, "0")}${String(
    minute
  ).padStart(2, "0")}`;
