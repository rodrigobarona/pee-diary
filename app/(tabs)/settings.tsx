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
  TextInput,
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

const languageDisplay: Record<
  SupportedLocale,
  { nativeLabel: string; flag: string }
> = {
  en: { nativeLabel: "English", flag: "🇬🇧" },
  es: { nativeLabel: "Español", flag: "🇪🇸" },
  pt: { nativeLabel: "Português", flag: "🇵🇹" },
};

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
    (state) => state.openAddMenuOnLaunch
  );
  const setOpenAddMenuOnLaunch = useDiaryStore(
    (state) => state.setOpenAddMenuOnLaunch
  );
  const clearAllEntries = useDiaryStore((state) => state.clearAllEntries);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = React.useState("");
  const [isSyncing, setIsSyncing] = React.useState(false);
  const cloudAvailable = isCloudAvailable();

  // Get the confirmation word for the current locale
  const confirmWord = t("settings.clearDataConfirmWord");
  const isDeleteConfirmed =
    deleteConfirmText.toUpperCase() === confirmWord.toUpperCase();

  // Open goals screen if navigated with openGoals param
  React.useEffect(() => {
    if (params.openGoals === "true") {
      router.setParams({ openGoals: undefined });
      router.push("/(formSheets)/goals");
    }
  }, [params.openGoals, router]);

  const handleOpenLanguage = React.useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("/(formSheets)/language");
  }, [router]);

  const handleToggleOpenAddMenu = React.useCallback(
    (value: boolean) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setOpenAddMenuOnLaunch(value);
    },
    [setOpenAddMenuOnLaunch]
  );

  const handleOpenGoals = React.useCallback(() => {
    router.push("/(formSheets)/goals");
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
    router.push("/(formSheets)/export");
  }, [isHydrated, t, router]);

  const handleOpenLink = React.useCallback((url: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Linking.openURL(url);
  }, []);

  const handleOpenDeleteConfirm = React.useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

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
            onPress: (value) => {
              if (value?.toUpperCase() === confirmWord.toUpperCase()) {
                clearAllEntries();
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                );
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
  }, [t, confirmWord, clearAllEntries]);

  const handleCloseDeleteConfirm = React.useCallback(() => {
    setShowDeleteConfirm(false);
    setDeleteConfirmText("");
  }, []);

  const handleConfirmDelete = React.useCallback(() => {
    if (!isDeleteConfirmed) return;

    clearAllEntries();
    setShowDeleteConfirm(false);
    setDeleteConfirmText("");

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [clearAllEntries, isDeleteConfirmed]);

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

  const currentLanguage = languageDisplay[locale];
  const currentLanguageLabel = `${currentLanguage.flag} ${currentLanguage.nativeLabel}`;

  return (
    <ScrollView
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.scrollContent}
    >
      {/* Delete Confirmation Modal (Android/Web only - iOS uses native Alert.prompt) */}
      {Platform.OS !== "ios" && (
        <Modal
          visible={showDeleteConfirm}
          transparent
          animationType="fade"
          onRequestClose={handleCloseDeleteConfirm}
        >
          <Pressable
            style={styles.deleteModalOverlay}
            onPress={handleCloseDeleteConfirm}
          >
            <Pressable
              style={styles.deleteModalContent}
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={styles.deleteModalTitle}>
                {t("settings.clearData")}
              </Text>
              <Text style={styles.deleteModalDescription}>
                {t("settings.clearDataConfirm")}
              </Text>
              <Text style={styles.deleteModalInstruction}>
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
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
                autoCorrect={false}
                autoComplete="off"
              />
              <View style={styles.deleteModalButtons}>
                <Pressable
                  style={styles.deleteModalTextButton}
                  onPress={handleCloseDeleteConfirm}
                >
                  <Text style={styles.deleteModalCancelText}>
                    {t("common.cancel").toUpperCase()}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.deleteModalTextButton}
                  onPress={handleConfirmDelete}
                  disabled={!isDeleteConfirmed}
                >
                  <Text
                    style={[
                      styles.deleteModalDeleteText,
                      !isDeleteConfirmed &&
                        styles.deleteModalDeleteTextDisabled,
                    ]}
                  >
                    {t("common.delete").toUpperCase()}
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* Daily Goals Section */}
      <Text style={styles.sectionTitle}>{t("goals.title")}</Text>
      <View style={styles.card}>
        <SettingRow
          icon="target"
          label={t("settings.editGoals")}
          description={`${goals.fluidTarget}ml • ${goals.voidTarget} ${t(
            "goals.voids"
          )}`}
          onPress={handleOpenGoals}
        />
      </View>

      {/* General Section */}
      <Text style={[styles.sectionTitle, styles.sectionTitleMargin]}>
        General
      </Text>
      <View style={styles.card}>
        <SettingRow
          icon="translate"
          label={t("settings.language")}
          onPress={handleOpenLanguage}
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
          onPress={handleOpenDeleteConfirm}
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
  // Delete confirmation modal styles (Material Design style for Android)
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  deleteModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 8,
    width: "100%",
    maxWidth: 320,
    elevation: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
  },
  deleteModalTitle: {
    fontSize: 24,
    fontWeight: "400",
    color: "#1F1F1F",
    marginBottom: 16,
  },
  deleteModalDescription: {
    fontSize: 14,
    color: "#49454F",
    lineHeight: 20,
    marginBottom: 8,
  },
  deleteModalInstruction: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1F1F1F",
    marginBottom: 8,
    marginTop: 8,
  },
  deleteInput: {
    width: "100%",
    height: 56,
    borderWidth: 1,
    borderColor: "#79747E",
    borderRadius: 4,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#1F1F1F",
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  deleteInputConfirmed: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  deleteModalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 8,
  },
  deleteModalTextButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  deleteModalCancelText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.primary.DEFAULT,
    letterSpacing: 0.1,
  },
  deleteModalDeleteText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.error,
    letterSpacing: 0.1,
  },
  deleteModalDeleteTextDisabled: {
    color: "#CAC4D0",
  },
});
