import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import * as React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SheetHandle } from "@/components/ui/sheet-handle";
import { Text } from "@/components/ui/text";
import { useI18n } from "@/lib/i18n/context";
import { colors } from "@/lib/theme/colors";

interface AddOptionProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  description: string;
  color: string;
  onPress: () => void;
  testID: string;
}

// A full-width row: a list item in the iOS grouped list, a Material 3
// two-line list item on Android. The rows start an action (no chevron).
function AddOption({
  icon,
  label,
  description,
  color,
  onPress,
  testID,
}: AddOptionProps) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={description}
      android_ripple={{ color: "rgba(0, 0, 0, 0.1)" }}
      style={({ pressed }) => [
        styles.option,
        Platform.OS === "ios" && pressed ? styles.optionPressedIOS : undefined,
      ]}
    >
      <View
        style={[styles.optionIconContainer, { backgroundColor: `${color}15` }]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={26}
          color={color}
          accessible={false}
          importantForAccessibility="no"
        />
      </View>
      <View style={styles.optionTextContainer}>
        <Text style={styles.optionLabel}>{label}</Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>
    </Pressable>
  );
}

export default function AddMenuScreen() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  const handleOptionPress = React.useCallback((route: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Dismiss the formSheet first, then push the modal form
    router.dismiss();

    // Use setTimeout to let the formSheet dismiss animation complete
    setTimeout(() => {
      router.push(route as any);
    }, 300);
  }, []);

  const options = [
    {
      icon: "toilet" as const,
      label: t("add.urination"),
      description: t("add.urinationDesc"),
      color: colors.primary.DEFAULT,
      route: "/(modals)/add/urination",
      testID: "add-menu-urination",
    },
    {
      icon: "cup-water" as const,
      label: t("add.fluid"),
      description: t("add.fluidDesc"),
      color: colors.secondary.DEFAULT,
      route: "/(modals)/add/fluid",
      testID: "add-menu-fluid",
    },
    {
      icon: "water-alert" as const,
      label: t("add.leak"),
      description: t("add.leakDesc"),
      color: colors.error,
      route: "/(modals)/add/leak",
      testID: "add-menu-leak",
    },
  ];

  return (
    // The sheet fits its content (sheetAllowedDetents "fitToContents"), so
    // the container has no flex and ends above the home indicator or the
    // Android navigation bar.
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 16) + 8 },
      ]}
    >
      <SheetHandle />

      <Text style={styles.title} accessibilityRole="header">
        {t("add.title")}
      </Text>
      <Text style={styles.subtitle}>{t("add.subtitle")}</Text>

      <View style={styles.options}>
        {options.map((option, index) => (
          <React.Fragment key={option.route}>
            {index > 0 && Platform.OS === "ios" ? (
              <View style={styles.separator} />
            ) : null}
            <AddOption
              icon={option.icon}
              label={option.label}
              description={option.description}
              color={option.color}
              onPress={() => handleOptionPress(option.route)}
              testID={option.testID}
            />
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: Platform.select({
    ios: {
      backgroundColor: "#F9FAFB",
      paddingHorizontal: 16,
      // Clears the system grabber
      paddingTop: 28,
    },
    default: {
      backgroundColor: "#F9FAFB",
    },
  }),
  title: Platform.select({
    ios: {
      fontSize: 20,
      fontWeight: "700",
      color: "#111827",
      textAlign: "center",
    },
    default: {
      // Material 3 sheet headline, start-aligned
      fontSize: 22,
      fontWeight: "500",
      color: "#111827",
      paddingHorizontal: 24,
    },
  }),
  subtitle: Platform.select({
    ios: {
      fontSize: 15,
      color: "#6B7280",
      textAlign: "center",
      marginTop: 4,
      marginBottom: 16,
    },
    default: {
      fontSize: 14,
      color: "#6B7280",
      paddingHorizontal: 24,
      marginTop: 4,
      marginBottom: 8,
    },
  }),
  options: Platform.select({
    ios: {
      backgroundColor: "#FFFFFF",
      borderRadius: 12,
      borderCurve: "continuous",
      overflow: "hidden",
    },
    default: {},
  }),
  option: Platform.select({
    ios: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      minHeight: 64,
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    default: {
      // Material 3 two-line list item (72dp), aligned with the headline
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      minHeight: 72,
      paddingVertical: 8,
      paddingStart: 24,
      paddingEnd: 24,
    },
  }),
  optionPressedIOS: {
    backgroundColor: "#E5E5EA",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#C6C6C8",
    marginStart: 16 + 44 + 12,
  },
  optionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: "#6B7280",
  },
});
