import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type { ReminderSettings } from "@/lib/store/types";
import { colors } from "@/lib/theme/colors";
import {
  getReminderTimes,
  reminderIdentifier,
} from "@/lib/utils/reminder-schedule";

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

// Android channel for reminders; its name is shown in the phone's settings
const REMINDER_CHANNEL_ID = "default";

/** Reminder text in the app's language. Neutral: never what was logged. */
export interface ReminderTexts {
  title: string;
  body: string;
  // Name of the Android notification channel
  channelName: string;
}

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

// Cancel all scheduled notifications (the app schedules only reminders)
export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Creates or renames the Android notification channel. The channel name is
 * shown in the phone's notification settings, so it follows the app language.
 */
export async function initializeNotifications(
  channelName: string
): Promise<void> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: channelName,
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: colors.primary.DEFAULT,
    });
  }
}

/** The notifications to schedule for these settings, all on the phone. */
export function buildReminderRequests(
  settings: ReminderSettings,
  texts: Pick<ReminderTexts, "title" | "body">
): Notifications.NotificationRequestInput[] {
  return getReminderTimes(settings).map((time) => ({
    identifier: reminderIdentifier(time),
    content: {
      title: texts.title,
      body: texts.body,
      sound: "default",
      priority: Notifications.AndroidNotificationPriority.DEFAULT,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: time.hour,
      minute: time.minute,
      channelId: REMINDER_CHANNEL_ID,
    },
  }));
}

// Runs one update at a time, so two quick changes cannot interleave and
// leave the reminders of both settings scheduled.
let updateQueue: Promise<void> = Promise.resolve();

/**
 * Makes the scheduled reminders match the settings: repeating daily
 * reminders when they are on and notifications are allowed, none otherwise.
 * Safe to call often (at launch, when the app returns to the foreground,
 * after a settings or language change): it changes nothing when the right
 * reminders are already scheduled.
 */
export function scheduleReminders(
  settings: ReminderSettings,
  texts: ReminderTexts
): Promise<void> {
  const run = updateQueue.then(() => applyReminders(settings, texts));
  updateQueue = run.catch(() => {});
  return run;
}

async function applyReminders(
  settings: ReminderSettings,
  texts: ReminderTexts
): Promise<void> {
  const requests =
    settings.enabled && (await hasNotificationPermission())
      ? buildReminderRequests(settings, texts)
      : [];

  if (requests.length > 0) {
    await initializeNotifications(texts.channelName);
  }

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const alreadyScheduled =
    scheduled.length === requests.length &&
    requests.every((request) =>
      scheduled.some(
        (existing) =>
          existing.identifier === request.identifier &&
          existing.content.title === request.content.title &&
          existing.content.body === request.content.body
      )
    );
  if (alreadyScheduled) return;

  await cancelAllReminders();
  for (const request of requests) {
    await Notifications.scheduleNotificationAsync(request);
  }
}
