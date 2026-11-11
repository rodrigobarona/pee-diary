import * as React from "react";
import { AppState } from "react-native";

import { useI18n } from "@/lib/i18n/context";
import { useDiaryStore } from "@/lib/store";
import { scheduleReminders } from "@/lib/utils/notifications";

/**
 * Keeps the phone's scheduled reminders in line with the reminder settings:
 * once the stored data has loaded, whenever the settings or the language
 * change, and whenever the app returns to the foreground (for example after
 * the user allowed notifications in the phone's settings). Everything stays
 * on the phone.
 */
export function useReminderSync(isHydrated: boolean) {
  const { t, locale } = useI18n();
  const reminderSettings = useDiaryStore((state) => state.reminderSettings);

  React.useEffect(() => {
    // Wait for the stored data, and for the texts to be in the stored language
    if (!isHydrated || locale !== useDiaryStore.getState().language) return;

    const sync = () => {
      scheduleReminders(reminderSettings, {
        title: t("settings.reminderNotificationTitle"),
        body: t("settings.reminderNotificationBody"),
        channelName: t("settings.reminders"),
      }).catch(() => {
        // Nothing to show: the next launch or return to the app tries again
      });
    };

    sync();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") sync();
    });
    return () => subscription.remove();
  }, [isHydrated, reminderSettings, t, locale]);
}
