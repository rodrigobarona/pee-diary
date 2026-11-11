import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as React from "react";
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { legalUrl } from "@/constants/legal";
import { useI18n } from "@/lib/i18n/context";
import { useDiaryStore } from "@/lib/store";
import { colors } from "@/lib/theme/colors";

/**
 * Shown at launch when the Terms of Use accepted on this device are not the
 * current version (see getLaunchAction). It does not block the diary: "Not
 * now" or swiping it away closes it, and it comes back at the next launch
 * until the user accepts.
 */
export default function TermsUpdateScreen() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const acceptTerms = useDiaryStore((state) => state.acceptTerms);
  // null means no acceptance was recorded (onboarding finished before the
  // app stored it), so "have changed" would not be accurate. Read once, so
  // the title does not change while the sheet closes after Accept.
  const [hadAcceptedEarlierVersion] = React.useState(
    () => useDiaryStore.getState().termsAcceptedVersion !== null
  );

  const close = React.useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  }, [router]);

  const handleRead = React.useCallback(() => {
    Linking.openURL(legalUrl("terms", locale));
  }, [locale]);

  const handleAccept = React.useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    acceptTerms();
    close();
  }, [acceptTerms, close]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          // Android shows this full screen, edge to edge: start below the
          // status bar (iOS presents it as a page sheet)
          paddingTop: Platform.OS === "android" ? insets.top + 24 : 40,
          paddingBottom: Math.max(insets.bottom, 20) + 8,
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name="file-document-outline"
          size={32}
          color={colors.primary.DEFAULT}
        />
      </View>

      <Text style={styles.title} accessibilityRole="header">
        {hadAcceptedEarlierVersion
          ? t("termsUpdate.titleChanged")
          : t("termsUpdate.titleReview")}
      </Text>
      <Text style={styles.body}>{t("termsUpdate.body")}</Text>
      <Text style={styles.body}>{t("termsUpdate.keepUsing")}</Text>

      <Pressable
        onPress={handleRead}
        style={({ pressed }) => [
          styles.secondaryButton,
          pressed && styles.pressed,
        ]}
        accessibilityRole="link"
      >
        <MaterialCommunityIcons
          name="open-in-new"
          size={18}
          color={colors.primary.DEFAULT}
        />
        <Text style={styles.secondaryButtonText}>{t("termsUpdate.read")}</Text>
      </Pressable>

      <Pressable
        onPress={handleAccept}
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
      >
        <Text style={styles.primaryButtonText}>{t("termsUpdate.accept")}</Text>
      </Pressable>

      <Pressable
        onPress={close}
        style={({ pressed }) => [styles.laterButton, pressed && styles.pressed]}
        accessibilityRole="button"
      >
        <Text style={styles.laterButtonText}>{t("termsUpdate.later")}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 24,
    gap: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.primary.DEFAULT}15`,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  secondaryButton: {
    marginTop: 8,
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.primary.DEFAULT,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary.DEFAULT,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.primary.DEFAULT,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  laterButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  laterButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.8,
  },
});
