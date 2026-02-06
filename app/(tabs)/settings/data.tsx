import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as React from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { SettingRow, settingStyles } from "@/components/settings/setting-row";
import { Text } from "@/components/ui/text";
import { useI18n } from "@/lib/i18n/context";
import { useDiaryStore, useStoreHydrated } from "@/lib/store";
import { colors } from "@/lib/theme/colors";
import {
  exportBackupFile,
  importBackupFile,
  isCloudAvailable,
  restoreFromCloud,
  syncToCloud,
} from "@/lib/utils/backup";

export default function DataScreen() {
  const { t } = useI18n();
  const { push } = useRouter();
  const isHydrated = useStoreHydrated();
  const clearAllEntries = useDiaryStore((state) => state.clearAllEntries);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const cloudAvailable = isCloudAvailable();

  // Get the confirmation word for the current locale
  const confirmWord = t("settings.clearDataConfirmWord");

  const handleExport = React.useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (!isHydrated) {
      Alert.alert(t("common.error"), "Please wait for data to load...");
      return;
    }

    const currentEntries = useDiaryStore.getState().entries;
    if (currentEntries.length === 0) {
      Alert.alert(t("settings.export"), t("settings.noDataToExport"));
      return;
    }

    push("/(formSheets)/export");
  }, [isHydrated, t, push]);

  // Delete confirmation uses native Alert only (Rule 9.8)
  const handleClearData = React.useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    if (Platform.OS === "ios") {
      // iOS: use native prompt with text input
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
            onPress: (value: string | undefined) => {
              if (value?.toUpperCase() === confirmWord.toUpperCase()) {
                clearAllEntries();
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                );
              } else {
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
      // Android: use native Alert with destructive action
      Alert.alert(t("settings.clearData"), t("settings.clearDataConfirm"), [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => {
            clearAllEntries();
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
            }
          },
        },
      ]);
    }
  }, [t, confirmWord, clearAllEntries]);

  // Cloud sync handlers (iOS only)
  const handleSyncToCloud = React.useCallback(async () => {
    if (isSyncing) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setIsSyncing(true);
    try {
      const result = await syncToCloud();
      if (result.success) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        Alert.alert(t("settings.iCloudSync"), t("settings.syncSuccess"));
      } else {
        Alert.alert(t("common.error"), result.error ?? t("settings.syncError"));
      }
    } catch {
      Alert.alert(t("common.error"), t("settings.syncError"));
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, t]);

  const handleRestoreFromCloud = React.useCallback(async () => {
    if (isSyncing) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    Alert.alert(t("settings.restoreFromCloud"), t("settings.restoreConfirm"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("settings.restore"),
        onPress: async () => {
          setIsSyncing(true);
          try {
            const result = await restoreFromCloud();
            if (result.success) {
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                );
              }
              Alert.alert(
                t("settings.restoreFromCloud"),
                t("settings.restoreSuccess", {
                  count: result.entriesCount ?? 0,
                })
              );
            } else {
              Alert.alert(
                t("common.error"),
                result.error ?? t("settings.restoreError")
              );
            }
          } catch {
            Alert.alert(t("common.error"), t("settings.restoreError"));
          } finally {
            setIsSyncing(false);
          }
        },
      },
    ]);
  }, [isSyncing, t]);

  // Local file backup handlers (Android only)
  const handleExportBackup = React.useCallback(async () => {
    if (isSyncing) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setIsSyncing(true);
    try {
      const result = await exportBackupFile();
      if (!result.success) {
        Alert.alert(
          t("common.error"),
          result.error ?? t("settings.exportBackupError")
        );
      }
    } catch {
      Alert.alert(t("common.error"), t("settings.exportBackupError"));
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, t]);

  const handleImportBackup = React.useCallback(async () => {
    if (isSyncing) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    Alert.alert(t("settings.importBackup"), t("settings.importBackupConfirm"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("settings.restore"),
        onPress: async () => {
          setIsSyncing(true);
          try {
            const result = await importBackupFile();
            if (result.success) {
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                );
              }
              Alert.alert(
                t("settings.importBackup"),
                t("settings.importBackupSuccess", {
                  count: result.entriesCount ?? 0,
                })
              );
            } else if (result.error !== "File selection cancelled") {
              Alert.alert(
                t("common.error"),
                result.error ?? t("settings.importBackupError")
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

  return (
    <ScrollView
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.scrollContent}
    >
      {/* Export & Clear Section */}
      <Text style={settingStyles.sectionTitle}>Data</Text>
      <View style={settingStyles.card}>
        <SettingRow
          icon="download"
          label={t("settings.export")}
          description={t("settings.exportDescription")}
          onPress={handleExport}
        />
        <View style={settingStyles.separator} />
        <SettingRow
          icon="delete"
          label={t("settings.clearData")}
          description={t("settings.clearDataDescription")}
          onPress={handleClearData}
          destructive
        />
      </View>

      {/* Cloud Sync Section - iOS only */}
      {Platform.OS === "ios" ? (
        <>
          <Text
            style={[
              settingStyles.sectionTitle,
              settingStyles.sectionTitleMargin,
            ]}
          >
            {t("settings.cloudSync")}
          </Text>
          <View style={settingStyles.card}>
            <SettingRow
              icon="cloud-sync"
              label={t("settings.iCloudSync")}
              description={
                cloudAvailable
                  ? t("settings.iCloudSyncDescription")
                  : t("settings.iCloudNotAvailable")
              }
              onPress={cloudAvailable ? handleSyncToCloud : undefined}
            >
              {isSyncing ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primary.DEFAULT}
                />
              ) : null}
            </SettingRow>
            <View style={settingStyles.separator} />
            <SettingRow
              icon="cloud-download"
              label={t("settings.restoreFromCloud")}
              description={t("settings.restoreDescription")}
              onPress={cloudAvailable ? handleRestoreFromCloud : undefined}
            />
          </View>
        </>
      ) : null}

      {/* Local Backup Section - Android only */}
      {Platform.OS === "android" ? (
        <>
          <Text
            style={[
              settingStyles.sectionTitle,
              settingStyles.sectionTitleMargin,
            ]}
          >
            {t("settings.localBackup")}
          </Text>
          <View style={settingStyles.card}>
            <SettingRow
              icon="file-export"
              label={t("settings.exportBackup")}
              description={t("settings.exportBackupDescription")}
              onPress={handleExportBackup}
            >
              {isSyncing ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primary.DEFAULT}
                />
              ) : null}
            </SettingRow>
            <View style={settingStyles.separator} />
            <SettingRow
              icon="file-import"
              label={t("settings.importBackup")}
              description={t("settings.importBackupDescription")}
              onPress={handleImportBackup}
            />
          </View>
        </>
      ) : null}
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
