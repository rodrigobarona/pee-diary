import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import * as React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { useI18n, type SupportedLocale } from "@/lib/i18n/context";
import { colors } from "@/lib/theme/colors";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const languageOptions: {
  value: SupportedLocale;
  nativeLabel: string;
  englishLabel: string;
  flag: string;
}[] = [
  { value: "en", nativeLabel: "English", englishLabel: "English", flag: "🇬🇧" },
  { value: "es", nativeLabel: "Español", englishLabel: "Spanish", flag: "🇪🇸" },
  {
    value: "pt",
    nativeLabel: "Português",
    englishLabel: "Portuguese",
    flag: "🇵🇹",
  },
];

interface LanguageOptionProps {
  option: (typeof languageOptions)[0];
  isSelected: boolean;
  onPress: () => void;
}

function LanguageOption({ option, isSelected, onPress }: LanguageOptionProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = React.useCallback(() => {
    scale.value = withTiming(0.97, { duration: 100 });
  }, [scale]);

  const handlePressOut = React.useCallback(() => {
    scale.value = withTiming(1, { duration: 150 });
  }, [scale]);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.optionContainer,
        isSelected && styles.optionContainerSelected,
        animatedStyle,
      ]}
    >
      {/* Flag */}
      <View style={styles.flagContainer}>
        <Text style={styles.flag}>{option.flag}</Text>
      </View>

      {/* Labels */}
      <View style={styles.labelContainer}>
        <Text
          style={[styles.nativeLabel, isSelected && styles.nativeLabelSelected]}
        >
          {option.nativeLabel}
        </Text>
        <Text style={styles.englishLabel}>{option.englishLabel}</Text>
      </View>

      {/* Radio indicator */}
      <View style={[styles.radio, isSelected && styles.radioSelected]}>
        {isSelected ? <View style={styles.radioInner} /> : null}
      </View>
    </AnimatedPressable>
  );
}

export default function LanguageScreen() {
  const { t, locale, setLocale } = useI18n();
  const insets = useSafeAreaInsets();

  const handleLanguageSelect = React.useCallback(
    (newLocale: SupportedLocale) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setLocale(newLocale);
      // Dismiss the sheet after selection
      setTimeout(() => {
        router.dismiss();
      }, 150);
    },
    [setLocale]
  );

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom:
            Platform.OS === "ios" ? Math.max(insets.bottom, 16) : 20,
          paddingTop: Platform.OS === "ios" ? 24 : 16,
        },
      ]}
    >
      {/* Title */}
      <Text style={styles.title}>{t("settings.language")}</Text>
      <Text style={styles.subtitle}>{t("settings.languageSubtitle")}</Text>

      {/* Language Options */}
      <View style={styles.optionsContainer}>
        {languageOptions.map((option) => (
          <LanguageOption
            key={option.value}
            option={option}
            isSelected={locale === option.value}
            onPress={() => handleLanguageSelect(option.value)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 8,
  },
  optionContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12, // Design brief: 8-12px max
    borderCurve: "continuous",
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  optionContainerSelected: {
    backgroundColor: "rgba(0, 109, 119, 0.06)",
    borderWidth: 2,
    borderColor: colors.primary.DEFAULT,
  },
  flagContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  flag: {
    fontSize: 26,
  },
  labelContainer: {
    flex: 1,
    marginLeft: 14,
  },
  nativeLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  nativeLabelSelected: {
    color: colors.primary.DEFAULT,
  },
  englishLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 1,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#D1D5DB",
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
