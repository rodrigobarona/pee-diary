import { router } from "expo-router";
import * as React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { Icon } from "@/components/ui/icon";
import { SheetHandle } from "@/components/ui/sheet-handle";
import { Text } from "@/components/ui/text";
import { a11yLabel, choiceA11y, choiceGroupA11y } from "@/lib/a11y";
import { haptics } from "@/lib/haptics";
import { useI18n, type SupportedLocale } from "@/lib/i18n/context";
import { colors } from "@/lib/theme/colors";
import { cardStyle, iconSize, spacing } from "@/lib/theme/styles";

const IS_IOS = Platform.OS === "ios";

// Languages by their own names; no flags (a flag is a country, not a
// language)
const languageOptions: {
  value: SupportedLocale;
  nativeLabel: string;
  // Name of the language in the app's current language
  labelKey: string;
}[] = [
  { value: "en", nativeLabel: "English", labelKey: "settings.english" },
  { value: "es", nativeLabel: "Español", labelKey: "settings.spanish" },
  { value: "pt", nativeLabel: "Português", labelKey: "settings.portuguese" },
];

interface LanguageOptionProps {
  option: (typeof languageOptions)[0];
  isSelected: boolean;
  onPress: () => void;
}

// A list row: iOS marks the chosen language with a trailing checkmark,
// Android with a Material radio button
function LanguageOption({ option, isSelected, onPress }: LanguageOptionProps) {
  const { t } = useI18n();
  const translatedName = t(option.labelKey);

  return (
    <AnimatedPressable
      onPress={onPress}
      testID={`language-option-${option.value}`}
      feedback="highlight"
      highlightColor={colors.highlight}
      {...choiceA11y(isSelected)}
      accessibilityLabel={a11yLabel(
        option.nativeLabel,
        translatedName !== option.nativeLabel ? translatedName : null
      )}
      style={styles.option}
    >
      <View style={styles.labelContainer}>
        <Text variant="body" style={isSelected ? styles.labelSelected : undefined}>
          {option.nativeLabel}
        </Text>
        <Text variant={IS_IOS ? "footnote" : "subheadline"} tone="secondary">
          {translatedName}
        </Text>
      </View>

      {IS_IOS ? (
        <View style={styles.checkmarkSlot}>
          {isSelected ? (
            <Icon name="check" size={iconSize.lg} color={colors.primary.DEFAULT} />
          ) : null}
        </View>
      ) : (
        <View style={[styles.radio, isSelected && styles.radioSelected]}>
          {isSelected ? <View style={styles.radioInner} /> : null}
        </View>
      )}
    </AnimatedPressable>
  );
}

export default function LanguageScreen() {
  const { t, locale, setLocale } = useI18n();
  const insets = useSafeAreaInsets();

  const handleLanguageSelect = React.useCallback(
    (newLocale: SupportedLocale) => {
      if (newLocale !== locale) {
        haptics.selection();
      }
      setLocale(newLocale);
      // Dismiss the sheet after selection
      setTimeout(() => {
        router.dismiss();
      }, 150);
    },
    [locale, setLocale]
  );

  return (
    // Fits its content (sheetAllowedDetents "fitToContents") and ends above
    // the home indicator or the Android navigation bar
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.lg,
          paddingTop: IS_IOS ? spacing.xl : 0,
        },
      ]}
    >
      <SheetHandle />
      {/* Title */}
      <Text
        variant={IS_IOS ? "title3" : "title2"}
        style={styles.title}
        accessibilityRole="header"
      >
        {t("settings.language")}
      </Text>
      <Text variant="subheadline" tone="secondary" style={styles.subtitle}>
        {t("settings.languageSubtitle")}
      </Text>

      {/* Language Options: one choice */}
      <View
        style={styles.optionsContainer}
        {...choiceGroupA11y(t("settings.language"))}
      >
        {languageOptions.map((option, index) => (
          <React.Fragment key={option.value}>
            {index > 0 ? <View style={styles.separator} /> : null}
            <LanguageOption
              option={option}
              isSelected={locale === option.value}
              onPress={() => handleLanguageSelect(option.value)}
            />
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  title: {
    textAlign: IS_IOS ? "center" : "left",
    marginBottom: spacing.xs,
  },
  subtitle: {
    textAlign: IS_IOS ? "center" : "left",
    marginBottom: spacing.lg,
  },
  // One opaque grouped card (no translucent fill on an elevated view)
  optionsContainer: {
    ...cardStyle,
    overflow: "hidden",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginStart: spacing.lg,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: IS_IOS ? 44 : 56,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
  },
  labelContainer: {
    flex: 1,
  },
  labelSelected: {
    fontWeight: "600",
  },
  checkmarkSlot: {
    width: iconSize.lg,
    alignItems: "center",
  },
  // Material 3 radio button: 20dp, 2dp outline (colors.outline, 4.48:1)
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.outline,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: colors.primary.DEFAULT,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary.DEFAULT,
  },
});
