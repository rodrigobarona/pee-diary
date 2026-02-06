import * as Haptics from "expo-haptics";
import * as React from "react";
import { Linking, Platform, ScrollView, StyleSheet, View } from "react-native";

import { SettingRow, settingStyles } from "@/components/settings/setting-row";
import { Text } from "@/components/ui/text";
import { useI18n } from "@/lib/i18n/context";

const LEGAL_URLS = {
  privacy: "https://diary.eleva.care/privacy",
  terms: "https://diary.eleva.care/terms",
  dataDelete: "https://diary.eleva.care/privacy#data-deletion",
};

export default function AboutScreen() {
  const { t } = useI18n();

  const handleOpenLink = React.useCallback((url: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Linking.openURL(url);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.scrollContent}
    >
      {/* App Info Section */}
      <Text style={settingStyles.sectionTitle}>{t("settings.about")}</Text>
      <View style={settingStyles.card}>
        <SettingRow
          icon="information"
          label={t("settings.version")}
          value="1.0.0"
        />
        <View style={settingStyles.separator} />
        <SettingRow
          icon="heart"
          label="Made with care"
          description="by Eleva Care"
        />
      </View>

      {/* Legal Section */}
      <Text
        style={[settingStyles.sectionTitle, settingStyles.sectionTitleMargin]}
      >
        {t("settings.legal")}
      </Text>
      <View style={settingStyles.card}>
        <SettingRow
          icon="shield-lock"
          label={t("settings.privacyPolicy")}
          onPress={() => handleOpenLink(LEGAL_URLS.privacy)}
          externalLink
        />
        <View style={settingStyles.separator} />
        <SettingRow
          icon="file-document"
          label={t("settings.terms")}
          onPress={() => handleOpenLink(LEGAL_URLS.terms)}
          externalLink
        />
        <View style={settingStyles.separator} />
        <SettingRow
          icon="delete-circle"
          label={t("settings.dataDelete")}
          description={t("settings.dataDeleteDescription")}
          onPress={() => handleOpenLink(LEGAL_URLS.dataDelete)}
          externalLink
        />
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
