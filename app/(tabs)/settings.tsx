import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as React from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { useShallow } from "zustand/react/shallow";

import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { Text } from "@/components/ui/text";
import { useI18n, type SupportedLocale } from "@/lib/i18n/context";
import { useDiaryStore, useStoreHydrated } from "@/lib/store";
import { colors } from "@/lib/theme/colors";
import {
  isCloudAvailable,
  restoreFromCloud,
  syncToCloud,
} from "@/lib/utils/backup";

interface SettingRowProps {
  icon: string;
  label: string;
  description?: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  externalLink?: boolean;
  children?: React.ReactNode;
}

function SettingRow({
  icon,
  label,
  description,
  value,
  onPress,
  destructive,
  externalLink,
  children,
}: SettingRowProps) {
  const content = (
    <View style={styles.settingRow}>
      <View
        style={[
          styles.settingIcon,
          destructive
            ? styles.settingIconDestructive
            : styles.settingIconPrimary,
        ]}
      >
        <MaterialCommunityIcons
          name={icon as any}
          size={22}
          color={destructive ? colors.error : colors.primary.DEFAULT}
        />
      </View>
      <View style={styles.settingContent}>
        <Text
          style={[
            styles.settingLabel,
            destructive ? styles.settingLabelDestructive : undefined,
          ]}
        >
          {label}
        </Text>
        {description ? (
          <Text style={styles.settingDescription}>{description}</Text>
        ) : null}
      </View>
      {children ? (
        children
      ) : value ? (
        <Text style={styles.settingValue}>{value}</Text>
      ) : null}
      {onPress && !children ? (
        <MaterialCommunityIcons
          name={externalLink ? "open-in-new" : "chevron-right"}
          size={externalLink ? 18 : 20}
          color="#9CA3AF"
        />
      ) : null}
    </View>
  );

  if (onPress && !children) {
    return (
      <AnimatedPressable onPress={onPress} haptic>
        {content}
      </AnimatedPressable>
    );
  }

  return content;
}

const languageOptions: { value: SupportedLocale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "pt", label: "Português" },
];

const LEGAL_URLS = {
  privacy: "https://diary.eleva.care/privacy",
  terms: "https://diary.eleva.care/terms",
  dataDelete: "https://diary.eleva.care/privacy#data-deletion",
};

export default function SettingsScreen() {
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const params = useLocalSearchParams<{ openGoals?: string }>();
  const isHydrated = useStoreHydrated();
  const entries = useDiaryStore(useShallow((state) => state.entries));
  const goals = useDiaryStore((state) => state.goals);
  const openAddMenuOnLaunch = useDiaryStore(
    (state) => state.openAddMenuOnLaunch,
  );
  const setOpenAddMenuOnLaunch = useDiaryStore(
    (state) => state.setOpenAddMenuOnLaunch,
  );
  const clearAllEntries = useDiaryStore((state) => state.clearAllEntries);
  const [showLanguagePicker, setShowLanguagePicker] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const cloudAvailable = isCloudAvailable();

  // Open goals screen if navigated with openGoals param
  React.useEffect(() => {
    if (params.openGoals === "true") {
      router.setParams({ openGoals: undefined });
      router.push("/goals");
    }
  }, [params.openGoals, router]);

  const handleLanguageChange = React.useCallback(
    (newLanguage: SupportedLocale) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setLocale(newLanguage);
      setShowLanguagePicker(false);
    },
    [setLocale],
  );

  const handleToggleOpenAddMenu = React.useCallback(
    (value: boolean) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setOpenAddMenuOnLaunch(value);
    },
    [setOpenAddMenuOnLaunch],
  );

  const handleOpenGoals = React.useCallback(() => {
    router.push("/goals");
  }, [router]);

  const handleExport = React.useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Wait for store to be hydrated
    if (!isHydrated) {
      Alert.alert(t("common.error"), "Please wait for data to load...");
      return;
    }

    // Check if there are entries to export
    const currentEntries = useDiaryStore.getState().entries;
    if (currentEntries.length === 0) {
      Alert.alert(t("settings.export"), t("settings.noDataToExport"));
      return;
    }

    // Navigate to export screen
    router.push("/export");
  }, [isHydrated, t, router]);

  const handleOpenLink = React.useCallback((url: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Linking.openURL(url);
  }, []);

  const handleClearData = React.useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

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
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        },
      },
    ]);
  }, [clearAllEntries, t]);

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
                  Haptics.NotificationFeedbackType.Success,
                );
              }
              Alert.alert(
                t("settings.restoreFromCloud"),
                t("settings.restoreSuccess", {
                  count: result.entriesCount ?? 0,
                }),
              );
            } else {
              Alert.alert(
                t("common.error"),
                result.error ?? t("settings.restoreError"),
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

  const currentLanguageLabel =
    languageOptions.find((l) => l.value === locale)?.label || "English";

  return (
    <ScrollView
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.scrollContent}
    >
      {/* Language Picker Modal */}
      <Modal
        visible={showLanguagePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguagePicker(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowLanguagePicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("settings.language")}</Text>
            {languageOptions.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => handleLanguageChange(option.value)}
                style={styles.modalOption}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    locale === option.value
                      ? styles.modalOptionTextSelected
                      : undefined,
                  ]}
                >
                  {option.label}
                </Text>
                {locale === option.value ? (
                  <MaterialCommunityIcons
                    name="check"
                    size={20}
                    color={colors.primary.DEFAULT}
                  />
                ) : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Daily Goals Section */}
      <Text style={styles.sectionTitle}>{t("goals.title")}</Text>
      <View style={styles.card}>
        <SettingRow
          icon="target"
          label={t("settings.editGoals")}
          description={`${goals.fluidTarget}ml • ${goals.voidTarget} ${t(
            "goals.voids",
          )}`}
          onPress={handleOpenGoals}
        />
      </View>

      {/* General Section */}
      <Text style={styles.sectionTitle}>General</Text>
      <View style={styles.card}>
        <SettingRow
          icon="translate"
          label={t("settings.language")}
          onPress={() => setShowLanguagePicker(true)}
          value={currentLanguageLabel}
        />
        <View style={styles.separator} />
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
      </View>

      {/* Data Section */}
      <Text style={[styles.sectionTitle, styles.sectionTitleMargin]}>Data</Text>
      <View style={styles.card}>
        <SettingRow
          icon="download"
          label={t("settings.export")}
          description={t("settings.exportDescription")}
          onPress={handleExport}
        />
        <View style={styles.separator} />
        <SettingRow
          icon="delete"
          label={t("settings.clearData")}
          description={t("settings.clearDataDescription")}
          onPress={handleClearData}
          destructive
        />
      </View>

      {/* Cloud Sync Section */}
      {Platform.OS === "ios" ? (
        <>
          <Text style={[styles.sectionTitle, styles.sectionTitleMargin]}>
            {t("settings.cloudSync")}
          </Text>
          <View style={styles.card}>
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
            <View style={styles.separator} />
            <SettingRow
              icon="cloud-download"
              label={t("settings.restoreFromCloud")}
              description={t("settings.restoreDescription")}
              onPress={cloudAvailable ? handleRestoreFromCloud : undefined}
            />
          </View>
        </>
      ) : (
        <>
          <Text style={[styles.sectionTitle, styles.sectionTitleMargin]}>
            {t("settings.cloudSync")}
          </Text>
          <View style={styles.card}>
            <SettingRow
              icon="cloud-check"
              label={t("settings.autoBackup")}
              description={t("settings.autoBackupDescription")}
            />
          </View>
        </>
      )}

      {/* About Section */}
      <Text style={[styles.sectionTitle, styles.sectionTitleMargin]}>
        {t("settings.about")}
      </Text>
      <View style={styles.card}>
        <SettingRow
          icon="information"
          label={t("settings.version")}
          value="1.0.0"
        />
        <View style={styles.separator} />
        <SettingRow
          icon="heart"
          label="Made with care"
          description="by Eleva Care"
        />
      </View>

      {/* Legal Section */}
      <Text style={[styles.sectionTitle, styles.sectionTitleMargin]}>
        {t("settings.legal")}
      </Text>
      <View style={styles.card}>
        <SettingRow
          icon="shield-lock"
          label={t("settings.privacyPolicy")}
          onPress={() => handleOpenLink(LEGAL_URLS.privacy)}
          externalLink
        />
        <View style={styles.separator} />
        <SettingRow
          icon="file-document"
          label={t("settings.terms")}
          onPress={() => handleOpenLink(LEGAL_URLS.terms)}
          externalLink
        />
        <View style={styles.separator} />
        <SettingRow
          icon="delete-circle"
          label={t("settings.dataDelete")}
          description={t("settings.dataDeleteDescription")}
          onPress={() => handleOpenLink(LEGAL_URLS.dataDelete)}
          externalLink
        />
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {isHydrated ? `${entries.length} entries recorded` : "Loading..."}
        </Text>
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
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionTitleMargin: {
    marginTop: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderCurve: "continuous",
    paddingHorizontal: 16,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
  },
  separator: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginLeft: 56,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 16,
  },
  settingIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderCurve: "continuous",
  },
  settingIconPrimary: {
    backgroundColor: "rgba(0, 109, 119, 0.1)",
  },
  settingIconDestructive: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
  },
  settingLabelDestructive: {
    color: colors.error,
  },
  settingDescription: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  settingValue: {
    fontSize: 15,
    color: "#6B7280",
  },
  statsContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  statsText: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderCurve: "continuous",
    padding: 24,
    width: "100%",
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#374151",
  },
  modalOptionTextSelected: {
    color: colors.primary.DEFAULT,
    fontWeight: "600",
  },
});
