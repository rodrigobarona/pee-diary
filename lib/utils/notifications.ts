import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface ReminderSettings {
  enabled: boolean;
  intervalHours: number; // How often to remind (e.g., 2, 3, 4 hours)
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "22:00" format
  quietHoursEnd: string; // "07:00" format
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: false,
  intervalHours: 3,
  quietHoursEnabled: true,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
};

// Request permission for notifications
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  if (existingStatus === "granted") {
    return true;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

// Check if we have permission
export async function hasNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted";
}

// Cancel all scheduled notifications
export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Get identifier for reminder notifications
const REMINDER_IDENTIFIER_PREFIX = "diary-reminder-";

// Schedule reminders based on settings
export async function scheduleReminders(
  settings: ReminderSettings,
  translations: {
    title: string;
    body: string;
  }
): Promise<void> {
  // Cancel existing reminders first
  await cancelAllReminders();

  if (!settings.enabled) {
    return;
  }

  // Check permission
  const hasPermission = await hasNotificationPermission();
  if (!hasPermission) {
    return;
  }

  // Parse quiet hours
  const [quietStartHour, quietStartMinute] = settings.quietHoursStart
    .split(":")
    .map(Number);
  const [quietEndHour, quietEndMinute] = settings.quietHoursEnd
    .split(":")
    .map(Number);

  // Schedule notifications for the next 7 days
  // This covers typical use patterns while keeping the notification list manageable
  const now = new Date();
  const scheduledNotifications: Promise<string>[] = [];

  for (let day = 0; day < 7; day++) {
    // Schedule multiple reminders throughout the day
    const hoursInDay = 24;
    const intervalsPerDay = Math.floor(hoursInDay / settings.intervalHours);

    for (let interval = 0; interval < intervalsPerDay; interval++) {
      const reminderHour = (interval * settings.intervalHours) % 24;
      const reminderDate = new Date(now);
      reminderDate.setDate(reminderDate.getDate() + day);
      reminderDate.setHours(reminderHour, 0, 0, 0);

      // Skip if in the past
      if (reminderDate <= now) {
        continue;
      }

      // Check if in quiet hours
      if (settings.quietHoursEnabled) {
        const hour = reminderDate.getHours();
        const minute = reminderDate.getMinutes();
        const currentTimeMinutes = hour * 60 + minute;
        const quietStartMinutes = quietStartHour * 60 + quietStartMinute;
        const quietEndMinutes = quietEndHour * 60 + quietEndMinute;

        // Handle overnight quiet hours (e.g., 22:00 to 07:00)
        const isInQuietHours =
          quietStartMinutes > quietEndMinutes
            ? currentTimeMinutes >= quietStartMinutes ||
              currentTimeMinutes < quietEndMinutes
            : currentTimeMinutes >= quietStartMinutes &&
              currentTimeMinutes < quietEndMinutes;

        if (isInQuietHours) {
          continue;
        }
      }

      // Schedule the notification
      const trigger: Notifications.NotificationTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      };

      scheduledNotifications.push(
        Notifications.scheduleNotificationAsync({
          content: {
            title: translations.title,
            body: translations.body,
            sound: "default",
            priority: Notifications.AndroidNotificationPriority.DEFAULT,
          },
          trigger,
          identifier: `${REMINDER_IDENTIFIER_PREFIX}${reminderDate.getTime()}`,
        })
      );
    }
  }

  await Promise.all(scheduledNotifications);
}

// Get count of scheduled reminders (for debugging/display)
export async function getScheduledReminderCount(): Promise<number> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.filter((n) =>
    n.identifier.startsWith(REMINDER_IDENTIFIER_PREFIX)
  ).length;
}

// Initialize notifications on app start
export async function initializeNotifications(): Promise<void> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#006D77",
    });
  }
}
