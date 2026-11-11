import { useRouter } from "expo-router";
import * as React from "react";
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { legalUrl } from "@/constants/legal";
import { haptics } from "@/lib/haptics";
import { useI18n } from "@/lib/i18n/context";
import { useDiaryStore } from "@/lib/store";
import { colors } from "@/lib/theme/colors";
import { iconSize, radius, ripple, spacing } from "@/lib/theme/styles";

const IS_IOS = Platform.OS === "ios";

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
    haptics.success();
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
          paddingTop: IS_IOS ? spacing.xxl + spacing.sm : insets.top + spacing.xl,
          paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.sm,
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <Icon
          name="file-document-outline"
          size={32}
          color={colors.primary.DEFAULT}
        />
      </View>

      <Text variant="title2" style={styles.title} accessibilityRole="header">
        {hadAcceptedEarlierVersion
          ? t("termsUpdate.titleChanged")
          : t("termsUpdate.titleReview")}
      </Text>
      <Text variant="body">{t("termsUpdate.body")}</Text>
      <Text variant="body">{t("termsUpdate.keepUsing")}</Text>

      <Pressable
        onPress={handleRead}
        style={({ pressed }) => [
          styles.button,
          styles.secondaryButton,
          IS_IOS && pressed ? styles.pressedIOS : undefined,
        ]}
        accessibilityRole="link"
        android_ripple={ripple}
      >
        <Icon name="open-in-new" size={iconSize.md} color={colors.primary.DEFAULT} />
        <Text variant="button" tone="accent">
          {t("termsUpdate.read")}
        </Text>
      </Pressable>

      <Pressable
        onPress={handleAccept}
        style={({ pressed }) => [
          styles.button,
          styles.primaryButton,
          IS_IOS && pressed ? styles.pressedIOS : undefined,
        ]}
        accessibilityRole="button"
        android_ripple={{ color: "rgba(255, 255, 255, 0.24)", foreground: true }}
      >
        <Text variant="button" tone="onAccent">
          {t("termsUpdate.accept")}
        </Text>
      </Pressable>

      <Pressable
        onPress={close}
        style={({ pressed }) => [
          styles.button,
          IS_IOS && pressed ? styles.pressedIOS : undefined,
        ]}
        accessibilityRole="button"
        android_ripple={ripple}
      >
        <Text variant="button" tone="accent">
          {t("termsUpdate.later")}
        </Text>
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
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary.subtle,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  title: {
    textAlign: "center",
  },
  // Buttons: iOS 12-point corners, Material 3 full radius; >= 48 tall
  button: {
    minHeight: IS_IOS ? 50 : 48,
    borderRadius: IS_IOS ? radius.md : radius.full,
    borderCurve: "continuous",
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  secondaryButton: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary.DEFAULT,
    backgroundColor: colors.surface,
  },
  primaryButton: {
    backgroundColor: colors.primary.DEFAULT,
  },
  pressedIOS: {
    opacity: 0.6,
  },
});
