import * as Notifications from "expo-notifications";

import { DEFAULT_REMINDER_SETTINGS, REMINDER_INTERVAL_OPTIONS } from "@/lib/store";
import type { ReminderSettings } from "@/lib/store/types";
import {
  buildReminderRequests,
  scheduleReminders,
} from "@/lib/utils/notifications";
import {
  getReminderTimes,
  IOS_PENDING_NOTIFICATION_LIMIT,
  isInQuietHours,
  reminderIdentifier,
} from "@/lib/utils/reminder-schedule";

// In-memory stand-in for the phone's scheduled notifications
const mockScheduled: Notifications.NotificationRequest[] = [];
let mockPermission = "granted";

jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ status: mockPermission })),
  requestPermissionsAsync: jest.fn(async () => ({ status: mockPermission })),
  setNotificationChannelAsync: jest.fn(async () => null),
  getAllScheduledNotificationsAsync: jest.fn(async () => [...mockScheduled]),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => {
    mockScheduled.length = 0;
  }),
  scheduleNotificationAsync: jest.fn(
    async (request: {
      identifier: string;
      content: Notifications.NotificationContent;
      trigger: unknown;
    }) => {
      const index = mockScheduled.findIndex(
        (n) => n.identifier === request.identifier
      );
      if (index >= 0) mockScheduled.splice(index, 1);
      mockScheduled.push(request as unknown as Notifications.NotificationRequest);
      return request.identifier;
    }
  ),
  SchedulableTriggerInputTypes: { DAILY: "daily", DATE: "date" },
  AndroidNotificationPriority: { DEFAULT: "default" },
  AndroidImportance: { DEFAULT: 3 },
}));

const settings = (overrides: Partial<ReminderSettings> = {}): ReminderSettings => ({
  ...DEFAULT_REMINDER_SETTINGS,
  enabled: true,
  ...overrides,
});

const texts = {
  title: "Diary reminder",
  body: "Time to update your diary.",
  channelName: "Reminders",
};

const hours = (s: ReminderSettings) => getReminderTimes(s).map((t) => t.hour);

beforeEach(() => {
  mockScheduled.length = 0;
  mockPermission = "granted";
  jest.clearAllMocks();
});

describe("reminder times", () => {
  it("is empty while reminders are off", () => {
    expect(getReminderTimes(settings({ enabled: false }))).toEqual([]);
  });

  it("fires every interval from midnight, skipping the quiet hours 22:00-07:00", () => {
    expect(hours(settings({ intervalHours: 3 }))).toEqual([9, 12, 15, 18, 21]);
    expect(hours(settings({ intervalHours: 2 }))).toEqual([8, 10, 12, 14, 16, 18, 20]);
    expect(hours(settings({ intervalHours: 4 }))).toEqual([8, 12, 16, 20]);
    expect(hours(settings({ intervalHours: 6 }))).toEqual([12, 18]);
  });

  it("fires around the clock when quiet hours are off", () => {
    expect(hours(settings({ intervalHours: 6, quietHoursEnabled: false }))).toEqual([
      0, 6, 12, 18,
    ]);
    expect(getReminderTimes(settings({ intervalHours: 2, quietHoursEnabled: false }))).toHaveLength(12);
  });

  it("stays within iOS's 64 pending notifications for every interval", () => {
    for (const intervalHours of [1, ...REMINDER_INTERVAL_OPTIONS]) {
      for (const quietHoursEnabled of [true, false]) {
        const count = getReminderTimes(settings({ intervalHours, quietHoursEnabled })).length;
        expect(count).toBeGreaterThan(0);
        expect(count).toBeLessThanOrEqual(IOS_PENDING_NOTIFICATION_LIMIT);
      }
    }
  });

  it("handles quiet hours within a day and at minute precision", () => {
    expect(
      hours(settings({ intervalHours: 2, quietHoursStart: "12:00", quietHoursEnd: "14:00" }))
    ).toEqual([0, 2, 4, 6, 8, 10, 14, 16, 18, 20, 22]);
    expect(isInQuietHours(22 * 60 + 29, "22:30", "06:30")).toBe(false);
    expect(isInQuietHours(22 * 60 + 30, "22:30", "06:30")).toBe(true);
    expect(isInQuietHours(6 * 60 + 30, "22:30", "06:30")).toBe(false);
  });

  it("ignores quiet hours that are empty or malformed", () => {
    expect(isInQuietHours(600, "08:00", "08:00")).toBe(false);
    expect(isInQuietHours(600, "8 am", "07:00")).toBe(false);
  });

  it("gives every time its own identifier", () => {
    const ids = getReminderTimes(settings({ intervalHours: 2, quietHoursEnabled: false })).map(
      reminderIdentifier
    );
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toBe("diary-reminder-0000");
  });
});

describe("scheduled notifications", () => {
  it("are repeating daily notifications with the neutral text", () => {
    const requests = buildReminderRequests(settings({ intervalHours: 6 }), texts);
    expect(requests).toHaveLength(2);
    for (const request of requests) {
      expect(request.trigger).toMatchObject({ type: "daily", minute: 0 });
      expect(request.content).toMatchObject({
        title: "Diary reminder",
        body: "Time to update your diary.",
      });
    }
  });

  it("schedules the reminders once and leaves them alone when nothing changed", async () => {
    await scheduleReminders(settings({ intervalHours: 3 }), texts);
    expect(mockScheduled.map((n) => n.identifier)).toEqual([
      "diary-reminder-0900",
      "diary-reminder-1200",
      "diary-reminder-1500",
      "diary-reminder-1800",
      "diary-reminder-2100",
    ]);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(5);

    // At the next launch or return to the app
    await scheduleReminders(settings({ intervalHours: 3 }), texts);
    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(5);
  });

  it("reschedules when the language changes", async () => {
    await scheduleReminders(settings(), texts);
    await scheduleReminders(settings(), {
      title: "Lembrete do diário",
      body: "Está na hora de atualizar o seu diário.",
      channelName: "Lembretes",
    });
    expect(mockScheduled.every((n) => n.content.title === "Lembrete do diário")).toBe(true);
  });

  it("cancels them when reminders are turned off or notifications are not allowed", async () => {
    await scheduleReminders(settings(), texts);
    await scheduleReminders(settings({ enabled: false }), texts);
    expect(mockScheduled).toHaveLength(0);

    await scheduleReminders(settings(), texts);
    mockPermission = "denied";
    await scheduleReminders(settings(), texts);
    expect(mockScheduled).toHaveLength(0);
  });

  it("applies quick successive changes in order, ending with the last settings", async () => {
    await Promise.all([
      scheduleReminders(settings({ intervalHours: 2 }), texts),
      scheduleReminders(settings({ intervalHours: 6 }), texts),
    ]);
    expect(mockScheduled.map((n) => n.identifier)).toEqual([
      "diary-reminder-1200",
      "diary-reminder-1800",
    ]);
  });
});
