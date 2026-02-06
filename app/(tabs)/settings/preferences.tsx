import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as React from "react";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";

import { SettingRow, settingStyles } from "@/components/settings/setting-row";
import { Text } from "@/components/ui/text";
import { useI18n, type SupportedLocale } from "@/lib/i18n/context";
import { useDiaryStore } from "@/lib/store";
import { colors } from "@/lib/theme/colors";
import {
  cancelAllReminders,
  initializeNotifications,
  requestNotificationPermission,
  scheduleReminders,
} from "@/lib/utils/notifications";

const languageDisplay: Record<
  SupportedLocale,
  { nativeLabel: string; flag: string }
> = {
  en: { nativeLabel: "English", flag: "\u{1F1EC}\u{1F1E7}" },
  es: { nativeLabel: "Español", flag: "\u{1F1EA}\u{1F1F8}" },
  pt: { nativeLabel: "Português", flag: "\u{1F1F5}\u{1F1F9}" },
};

export default function PreferencesScreen() {
  const { t, locale } = useI18n();
  const { push, replace } = useRouter();

  const openAddMenuOnLaunch = useDiaryStore(
    (state) => state.openAddMenuOnLaunch
  );
  const setOpenAddMenuOnLaunch = useDiaryStore(
    (state) => state.setOpenAddMenuOnLaunch
  );
  const resetOnboarding = useDiaryStore((state) => state.resetOnboarding);
  const reminderSettings = useDiaryStore((state) => state.reminderSettings);
  const updateReminderSettings = useDiaryStore(
    (state) => state.updateReminderSettings
  );

  // Initialize notifications on mount
  React.useEffect(() => {
    initializeNotifications();
  }, []);

  const currentLanguage = languageDisplay[locale];
  const currentLanguageLabel = `${currentLanguage.flag} ${currentLanguage.nativeLabel}`;

  const handleOpenLanguage = React.useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    push("/(formSheets)/language");
  }, [push]);

  const handleToggleOpenAddMenu = React.useCallback(
    (value: boolean) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setOpenAddMenuOnLaunch(value);
    },
    [setOpenAddMenuOnLaunch]
  );

  const handleViewTutorial = React.useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    resetOnboarding();
    replace("/(onboarding)");
  }, [resetOnboarding, replace]);

  // Handle toggling reminders
  const handleToggleReminders = React.useCallback(
    async (value: boolean) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      if (value) {
        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) {
          Alert.alert(
            t("settings.permissionRequired"),
            t("settings.permissionRequiredDescription"),
            [
              { text: t("common.cancel"), style: "cancel" },
              {
                text: t("settings.title"),
                onPress: () => Linking.openSettings(),
              },
            ]
          );
          return;
        }
      }

      const newSettings = { ...reminderSettings, enabled: value };
      updateReminderSettings(newSettings);

      if (value) {
        await scheduleReminders(newSettings, {
          title: t("settings.reminderNotificationTitle"),
          body: t("settings.reminderNotificationBody"),
        });
      } else {
        await cancelAllReminders();
      }
    },
    [reminderSettings, updateReminderSettings, t]
  );

  // Handle changing reminder interval
  const handleChangeInterval = React.useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const intervals = [2, 3, 4, 6];
    const options = intervals.map((h) =>
      t("settings.everyXHours", { count: h })
    );
    options.push(t("common.cancel"));

    Alert.alert(t("settings.reminderInterval"), "", [
      ...intervals.map((hours, index) => ({
        text: options[index],
        onPress: async () => {
          const newSettings = { ...reminderSettings, intervalHours: hours };
          updateReminderSettings(newSettings);
          if (reminderSettings.enabled) {
            await scheduleReminders(newSettings, {
              title: t("settings.reminderNotificationTitle"),
              body: t("settings.reminderNotificationBody"),
            });
          }
        },
      })),
      { text: t("common.cancel"), style: "cancel" },
    ]);
  }, [reminderSettings, updateReminderSettings, t]);

  // Handle toggling quiet hours
  const handleToggleQuietHours = React.useCallback(
    async (value: boolean) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      const newSettings = { ...reminderSettings, quietHoursEnabled: value };
      updateReminderSettings(newSettings);

      if (reminderSettings.enabled) {
        await scheduleReminders(newSettings, {
          title: t("settings.reminderNotificationTitle"),
          body: t("settings.reminderNotificationBody"),
        });
      }
    },
    [reminderSettings, updateReminderSettings, t]
  );

  return (
    <ScrollView
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.scrollContent}
    >
      {/* General Section */}
      <Text style={settingStyles.sectionTitle}>{t("settings.general")}</Text>
      <View style={settingStyles.card}>
        <SettingRow
          icon="translate"
          label={t("settings.language")}
          onPress={handleOpenLanguage}
          value={currentLanguageLabel}
        />
        <View style={settingStyles.separator} />
        <SettingRow
          icon="plus-circle"
          label={t("settings.openAddMenuOnLaunch")}
          description={t("settings.openAddMenuOnLaunchDescription")}
        >
          <Switch
            value={openAddMenuOnLaunch}
            onValueChange={handleToggleOpenAddMenu}
            trackColor={{ false: "#E2E8F0", true: colors.primary.DEFAULT }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#E2E8F0"
          />
        </SettingRow>
        <View style={settingStyles.separator} />
        <SettingRow
          icon="school"
          label={t("settings.viewTutorial")}
          description={t("settings.viewTutorialDescription")}
          onPress={handleViewTutorial}
        />
      </View>

      {/* Reminders Section */}
      <Text
        style={[settingStyles.sectionTitle, settingStyles.sectionTitleMargin]}
      >
        {t("settings.reminders")}
      </Text>
      <View style={settingStyles.card}>
        <SettingRow
          icon="bell"
          label={t("settings.remindersEnabled")}
          description={t("settings.remindersEnabledDescription")}
        >
          <Switch
            value={reminderSettings.enabled}
            onValueChange={handleToggleReminders}
            trackColor={{ false: "#E2E8F0", true: colors.primary.DEFAULT }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#E2E8F0"
          />
        </SettingRow>
        {reminderSettings.enabled ? (
          <>
            <View style={settingStyles.separator} />
            <SettingRow
              icon="clock-outline"
              label={t("settings.reminderInterval")}
              value={t("settings.everyXHours", {
                count: reminderSettings.intervalHours,
              })}
              onPress={handleChangeInterval}
            />
            <View style={settingStyles.separator} />
            <SettingRow
              icon="moon-waning-crescent"
              label={t("settings.quietHoursEnabled")}
              description={
                reminderSettings.quietHoursEnabled
                  ? `${reminderSettings.quietHoursStart} - ${reminderSettings.quietHoursEnd}`
                  : t("settings.quietHoursEnabledDescription")
              }
            >
              <Switch
                value={reminderSettings.quietHoursEnabled}
                onValueChange={handleToggleQuietHours}
                trackColor={{ false: "#E2E8F0", true: colors.primary.DEFAULT }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#E2E8F0"
              />
            </SettingRow>
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    padding: 16,
  },
});
