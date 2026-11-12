import * as Application from "expo-application";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import * as React from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShallow } from "zustand/react/shallow";

import { SettingsRow, SettingsSection } from "@/components/ui/settings-list";
import { Text } from "@/components/ui/text";
import { legalUrl } from "@/constants/legal";
import { dateFormatters, numberFormatters } from "@/lib/i18n";
import { useI18n, type SupportedLocale } from "@/lib/i18n/context";
import { haptics } from "@/lib/haptics";
import {
  useDiaryStore,
  useStoreHydrated,
} from "@/lib/store";
import { colors } from "@/lib/theme/colors";
import { ripple, spacing } from "@/lib/theme/styles";
import { typography } from "@/lib/theme/typography";
import {
  exportBackupFile,
  importBackupFile,
} from "@/lib/utils/backup";
import { deleteExportFiles } from "@/lib/utils/export";
import {
  cancelAllReminders,
  hasNotificationPermission,
  requestNotificationPermission,
} from "@/lib/utils/notifications";

// Version and build number of the installed app, e.g. "1.0.0 (12)"
const APP_VERSION = [
  Application.nativeApplicationVersion ?? Constants.expoConfig?.version,
  Application.nativeBuildVersion ? `(${Application.nativeBuildVersion})` : "",
]
  .filter(Boolean)
  .join(" ");

// Languages by their own names; no flags (a flag is a country, not a
// language)
const languageNames: Record<SupportedLocale, string> = {
  en: "English",
  es: "Español",
  pt: "Português",
};

// A stored "HH:mm" time shown in the device's 12- or 24-hour clock
const formatClockTime = (value: string): string => {
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
  return dateFormatters.time.format(new Date(2023, 0, 1, hours, minutes));
};

export default function SettingsScreen() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isHydrated = useStoreHydrated();
  const entries = useDiaryStore(useShallow((state) => state.entries));
  const goals = useDiaryStore((state) => state.goals);
  const openAddMenuOnLaunch = useDiaryStore(
    (state) => state.openAddMenuOnLaunch
  );
  const setOpenAddMenuOnLaunch = useDiaryStore(
    (state) => state.setOpenAddMenuOnLaunch
  );
  const clearAllData = useDiaryStore((state) => state.clearAllData);

  // Deletes everything "Clear All Data" promises: stored data, scheduled
  // reminders and any export or backup files the app has written.
  const clearEverything = React.useCallback(() => {
    clearAllData();
    cancelAllReminders().catch(() => {});
    deleteExportFiles().catch(() => {});
  }, [clearAllData]);
  const resetOnboarding = useDiaryStore((state) => state.resetOnboarding);
  const reminderSettings = useDiaryStore((state) => state.reminderSettings);

  // Reminders are on but the phone blocks the app's notifications (turned
  // off in the phone's settings after they were allowed): say so, or the
  // switch would look on while no reminder ever arrives. Checked again when
  // the app returns to the foreground.
  const [permissionGranted, setPermissionGranted] = React.useState(true);
  const notificationsBlocked = reminderSettings.enabled && !permissionGranted;
  React.useEffect(() => {
    if (!reminderSettings.enabled) return;
    const check = () => {
      hasNotificationPermission()
        .then(setPermissionGranted)
        .catch(() => {});
    };
    check();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") check();
    });
    return () => subscription.remove();
  }, [reminderSettings.enabled]);
  const updateReminderSettings = useDiaryStore(
    (state) => state.updateReminderSettings
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = React.useState("");
  const [isSyncing, setIsSyncing] = React.useState(false);

  // Get the confirmation word for the current locale
  const confirmWord = t("settings.clearDataConfirmWord");
  const isDeleteConfirmed =
    deleteConfirmText.trim().toUpperCase() === confirmWord.toUpperCase();

  const handleOpenLanguage = React.useCallback(() => {
    router.push("/(formSheets)/language");
  }, [router]);

  const handleToggleOpenAddMenu = React.useCallback(
    (value: boolean) => {
      setOpenAddMenuOnLaunch(value);
    },
    [setOpenAddMenuOnLaunch]
  );

  const handleViewTutorial = React.useCallback(() => {
    resetOnboarding();
    router.replace("/welcome");
  }, [resetOnboarding, router]);

  // Handle toggling reminders
  const handleToggleReminders = React.useCallback(
    async (value: boolean) => {

      if (value) {
        // Request permission first
        const hasPermission = await requestNotificationPermission().catch(
          () => false
        );
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

      // useReminderSync (app/_layout.tsx) schedules or cancels the reminders
      updateReminderSettings({ enabled: value });
    },
    [updateReminderSettings, t]
  );

  // Reminder interval: a list sheet with one choice
  const handleChangeInterval = React.useCallback(() => {
    router.push("/(formSheets)/reminder-interval");
  }, [router]);

  // Handle toggling quiet hours
  const handleToggleQuietHours = React.useCallback(
    async (value: boolean) => {

      // useReminderSync (app/_layout.tsx) reschedules the reminders
      updateReminderSettings({ quietHoursEnabled: value });
    },
    [updateReminderSettings]
  );

  const handleOpenGoals = React.useCallback(() => {
    router.push("/(formSheets)/goals");
  }, [router]);

  const handleExport = React.useCallback(() => {

    // Wait for store to be hydrated
    if (!isHydrated) {
      Alert.alert(t("common.error"), t("settings.waitForData"));
      return;
    }

    // Check if there are entries to export
    const currentEntries = useDiaryStore.getState().entries;
    if (currentEntries.length === 0) {
      Alert.alert(t("settings.export"), t("settings.noDataToExport"));
      return;
    }

    // Navigate to export screen
    router.push("/(formSheets)/export");
  }, [isHydrated, t, router]);

  const handleOpenLink = React.useCallback((url: string) => {
    Linking.openURL(url);
  }, []);

  const handleShowMedicalInfo = React.useCallback(() => {
    Alert.alert(t("settings.medicalInfo"), t("disclaimer.text"));
  }, [t]);

  const handleOpenDeleteConfirm = React.useCallback(() => {

    if (Platform.OS === "ios") {
      // Use native iOS prompt with text input
      Alert.prompt(
        t("settings.clearData"),
        `${t("settings.clearDataConfirm")}\n\n${t(
          "settings.clearDataTypeConfirm"
        )}`,
        [
          {
            text: t("common.cancel"),
            style: "cancel",
          },
          {
            text: t("common.delete"),
            style: "destructive",
            onPress: (value?: string) => {
              if (value?.toUpperCase() === confirmWord.toUpperCase()) {
                clearEverything();
                haptics.warning();
              } else {
                // Show error if wrong word entered
                Alert.alert(
                  t("common.error"),
                  t("settings.clearDataTypeConfirm")
                );
              }
            },
          },
        ],
        "plain-text",
        "",
        "default"
      );
    } else {
      // Use custom modal for Android
      setDeleteConfirmText("");
      setShowDeleteConfirm(true);
    }
  }, [t, confirmWord, clearEverything]);

  const handleCloseDeleteConfirm = React.useCallback(() => {
    setShowDeleteConfirm(false);
    setDeleteConfirmText("");
  }, []);

  const handleConfirmDelete = React.useCallback(() => {
    if (!isDeleteConfirmed) return;

    clearEverything();
    setShowDeleteConfirm(false);
    setDeleteConfirmText("");
    haptics.warning();
  }, [clearEverything, isDeleteConfirmed]);

  // Handle local file backup export
  const handleExportBackup = React.useCallback(async () => {
    if (isSyncing) return;


    setIsSyncing(true);
    try {
      const result = await exportBackupFile({
        dialogTitle: t("settings.exportBackup"),
      });
      if (!result.success) {
        Alert.alert(
          t("common.error"),
          result.error === "sharingUnavailable"
            ? t("settings.sharingUnavailable")
            : t("settings.exportBackupError")
        );
      }
    } catch {
      Alert.alert(t("common.error"), t("settings.exportBackupError"));
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, t]);

  // Handle local file backup import
  const handleImportBackup = React.useCallback(async () => {
    if (isSyncing) return;


    Alert.alert(t("settings.importBackup"), t("settings.importBackupConfirm"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("settings.restore"),
        // Restoring replaces the diary on this device
        style: "destructive",
        onPress: async () => {
          setIsSyncing(true);
          try {
            const result = await importBackupFile();
            if (result.success) {
              haptics.success();
              const skipped = result.skippedEntries ?? 0;
              Alert.alert(
                t("settings.importBackup"),
                [
                  t("settings.importBackupSuccess", {
                    count: result.entriesCount ?? 0,
                  }),
                  skipped > 0
                    ? t("settings.importBackupSkipped", { count: skipped })
                    : "",
                ]
                  .filter(Boolean)
                  .join("\n\n")
              );
            } else if (result.error !== "cancelled") {
              Alert.alert(
                t("common.error"),
                result.error === "incompatibleVersion"
                  ? t("settings.importBackupIncompatible")
                  : t("settings.importBackupError")
              );
            }
          } catch {
            Alert.alert(t("common.error"), t("settings.importBackupError"));
          } finally {
            setIsSyncing(false);
          }
        },
      },
    ]);
  }, [isSyncing, t]);

  const currentLanguageLabel = languageNames[locale];

  // Formatted on every render: the screen re-renders when the language or
  // the device clock changes (useI18n)
  const quietHoursRange = `${formatClockTime(
    reminderSettings.quietHoursStart
  )}\u2013${formatClockTime(reminderSettings.quietHoursEnd)}`;


  return (
    <ScrollView
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[
        styles.scrollContent,
        // Android draws edge to edge: end above the navigation bar
        Platform.OS === "android"
          ? { paddingBottom: insets.bottom + 24 }
          : undefined,
      ]}
      testID="settings-scroll"
    >
      {/* Delete Confirmation Modal (Android/Web only - iOS uses native Alert.prompt) */}
      {Platform.OS !== "ios" && (
        <Modal
          visible={showDeleteConfirm}
          transparent
          animationType="fade"
          // The scrim covers the status and navigation bars (edge to edge)
          statusBarTranslucent
          navigationBarTranslucent
          onRequestClose={handleCloseDeleteConfirm}
        >
          <Pressable
            style={styles.deleteModalOverlay}
            onPress={handleCloseDeleteConfirm}
            accessible={false}
            importantForAccessibility="no"
          >
            <Pressable
              style={styles.deleteModalContent}
              onPress={(e) => e.stopPropagation()}
              accessible={false}
              accessibilityViewIsModal
            >
              <Text
                variant="title2"
                style={styles.deleteModalTitle}
                accessibilityRole="header"
              >
                {t("settings.clearData")}
              </Text>
              <Text
                variant="subheadline"
                tone="secondary"
                style={styles.deleteModalDescription}
              >
                {t("settings.clearDataConfirm")}
              </Text>
              <Text variant="subheadline" style={styles.deleteModalInstruction}>
                {t("settings.clearDataTypeConfirm")}
              </Text>
              <TextInput
                style={[
                  styles.deleteInput,
                  isDeleteConfirmed && styles.deleteInputConfirmed,
                ]}
                value={deleteConfirmText}
                onChangeText={setDeleteConfirmText}
                placeholder={confirmWord}
                placeholderTextColor={colors.textPlaceholder}
                accessibilityLabel={t("settings.clearDataTypeConfirm")}
                autoCapitalize="characters"
                autoCorrect={false}
                autoComplete="off"
              />
              <View style={styles.deleteModalButtons}>
                <Pressable
                  style={styles.deleteModalTextButton}
                  onPress={handleCloseDeleteConfirm}
                  accessibilityRole="button"
                  android_ripple={ripple}
                >
                  <Text variant="button" tone="accent">
                    {t("common.cancel")}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.deleteModalTextButton}
                  onPress={handleConfirmDelete}
                  disabled={!isDeleteConfirmed}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !isDeleteConfirmed }}
                  android_ripple={ripple}
                >
                  <Text
                    variant="button"
                    tone="destructive"
                    style={
                      !isDeleteConfirmed
                        ? styles.deleteModalDeleteTextDisabled
                        : undefined
                    }
                  >
                    {t("common.delete")}
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      <SettingsSection title={t("goals.title")}>
        <SettingsRow
          icon="target"
          label={t("settings.editGoals")}
          description={
            goals.fluidTarget === null
              ? t("goals.noTarget")
              : `${numberFormatters.decimal.format(goals.fluidTarget)} ml`
          }
          onPress={handleOpenGoals}
          accessory="disclosure"
          testID="settings-row-goals"
        />
      </SettingsSection>

      <SettingsSection title={t("settings.general")}>
        <SettingsRow
          icon="translate"
          label={t("settings.language")}
          value={currentLanguageLabel}
          onPress={handleOpenLanguage}
          accessory="disclosure"
          testID="settings-row-language"
        />
        <SettingsRow
          icon="plus-circle"
          label={t("settings.openAddMenuOnLaunch")}
          description={t("settings.openAddMenuOnLaunchDescription")}
          switchValue={openAddMenuOnLaunch}
          onSwitchChange={handleToggleOpenAddMenu}
          testID="settings-row-open-add-menu"
        />
        <SettingsRow
          icon="school"
          label={t("settings.viewTutorial")}
          description={t("settings.viewTutorialDescription")}
          onPress={handleViewTutorial}
          accessory="disclosure"
          testID="settings-row-tutorial"
        />
      </SettingsSection>

      <SettingsSection title={t("settings.reminders")}>
        <SettingsRow
          icon="bell"
          label={t("settings.remindersEnabled")}
          description={t("settings.remindersEnabledDescription")}
          switchValue={reminderSettings.enabled}
          onSwitchChange={handleToggleReminders}
          testID="settings-row-reminders"
        />
        {notificationsBlocked ? (
          <SettingsRow
            icon="bell-off-outline"
            label={t("settings.notificationsOff")}
            description={t("settings.notificationsOffDescription")}
            onPress={() => Linking.openSettings()}
            accessory="disclosure"
            testID="settings-row-notifications-off"
          />
        ) : null}
        {reminderSettings.enabled ? (
          <SettingsRow
            icon="clock-outline"
            label={t("settings.reminderInterval")}
            value={t("settings.everyXHours", {
              count: reminderSettings.intervalHours,
            })}
            onPress={handleChangeInterval}
            testID="settings-row-reminder-interval"
          />
        ) : null}
        {reminderSettings.enabled ? (
          <SettingsRow
            icon="moon-waning-crescent"
            label={t("settings.quietHoursEnabled")}
            description={
              reminderSettings.quietHoursEnabled
                ? quietHoursRange
                : t("settings.quietHoursEnabledDescription")
            }
            switchValue={reminderSettings.quietHoursEnabled}
            onSwitchChange={handleToggleQuietHours}
            testID="settings-row-quiet-hours"
          />
        ) : null}
      </SettingsSection>

      <SettingsSection title={t("settings.data")}>
        <SettingsRow
          icon="download"
          label={t("settings.export")}
          description={t("settings.exportDescription")}
          onPress={handleExport}
          accessory="disclosure"
          testID="settings-row-export"
        />
      </SettingsSection>

      {/* Local backup: a file the user exports and imports themselves */}
      <SettingsSection title={t("settings.localBackup")}>
        <SettingsRow
          icon="file-export"
          label={t("settings.exportBackup")}
          description={t("settings.exportBackupDescription")}
          onPress={handleExportBackup}
          trailing={
            isSyncing ? (
              <ActivityIndicator size="small" color={colors.primary.DEFAULT} />
            ) : null
          }
          testID="settings-row-export-backup"
        />
        <SettingsRow
          icon="file-import"
          label={t("settings.importBackup")}
          description={t("settings.importBackupDescription")}
          onPress={handleImportBackup}
          testID="settings-row-import-backup"
        />
      </SettingsSection>

      {/* Destructive action in its own group, after the data groups */}
      <SettingsSection>
        <SettingsRow
          icon="delete"
          label={t("settings.clearData")}
          description={t("settings.clearDataDescription")}
          onPress={handleOpenDeleteConfirm}
          destructive
          testID="settings-row-clear-data"
        />
      </SettingsSection>

      <SettingsSection title={t("settings.about")}>
        <SettingsRow
          icon="information"
          label={t("settings.version")}
          value={APP_VERSION}
          testID="settings-row-version"
        />
        <SettingsRow
          icon="information-outline"
          label={t("settings.medicalInfo")}
          onPress={handleShowMedicalInfo}
          testID="settings-row-medical-info"
        />
        <SettingsRow
          icon="heart"
          label={t("settings.madeWithCare")}
          description={t("settings.byElevaCare")}
        />
      </SettingsSection>

      <SettingsSection title={t("settings.legal")}>
        <SettingsRow
          icon="shield-lock"
          label={t("settings.privacyPolicy")}
          onPress={() => handleOpenLink(legalUrl("privacy", locale))}
          accessory="external"
          testID="settings-row-privacy-policy"
        />
        <SettingsRow
          icon="file-document"
          label={t("settings.terms")}
          onPress={() => handleOpenLink(legalUrl("terms", locale))}
          accessory="external"
          testID="settings-row-terms"
        />
        <SettingsRow
          icon="delete-circle"
          label={t("settings.privacyChoices")}
          description={t("settings.privacyChoicesDescription")}
          onPress={() => handleOpenLink(legalUrl("privacyChoices", locale))}
          accessory="external"
          testID="settings-row-privacy-choices"
        />
      </SettingsSection>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Text variant="footnote" tone="secondary">
          {isHydrated
            ? t("settings.entriesRecorded", { count: entries.length })
            : t("common.loading")}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: Platform.select({
    // Inset grouped list on iOS; full-width Material list on Android
    ios: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
    default: { paddingBottom: spacing.xl },
  }),
  statsContainer: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
  // Delete confirmation dialog (Material 3 basic dialog, Android)
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  deleteModalContent: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
    width: "100%",
    maxWidth: 360,
    elevation: 6,
  },
  deleteModalTitle: {
    marginBottom: spacing.lg,
  },
  deleteModalDescription: {
    marginBottom: spacing.sm,
  },
  deleteModalInstruction: {
    fontWeight: "500",
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  // Material 3 outlined text field
  deleteInput: {
    ...typography.body,
    width: "100%",
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 4,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    marginBottom: spacing.lg,
    backgroundColor: "transparent",
  },
  deleteInputConfirmed: {
    borderColor: colors.primary.DEFAULT,
    borderWidth: 2,
  },
  deleteModalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  // Material 3 text button, 48dp touch target
  deleteModalTextButton: {
    minHeight: 48,
    minWidth: 48,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    borderRadius: 24,
    overflow: "hidden",
  },
  deleteModalDeleteTextDisabled: {
    // Material 3 disabled content: on-surface at 38%
    color: "rgba(17, 24, 39, 0.38)",
  },
});
