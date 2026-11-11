import { router } from "expo-router";
import * as React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon, type IconName } from "@/components/ui/icon";
import { SheetHandle } from "@/components/ui/sheet-handle";
import { Text } from "@/components/ui/text";
import { useI18n } from "@/lib/i18n/context";
import { colors } from "@/lib/theme/colors";
import { radius, ripple, spacing } from "@/lib/theme/styles";

interface AddOptionProps {
  icon: IconName;
  label: string;
  description: string;
  // Identity accent of the entry type (icon) and its tile
  color: string;
  tileColor: string;
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
  tileColor,
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
      android_ripple={ripple}
      style={({ pressed }) => [
        styles.option,
        Platform.OS === "ios" && pressed ? styles.optionPressedIOS : undefined,
      ]}
    >
      <View style={[styles.optionIconContainer, { backgroundColor: tileColor }]}>
        <Icon name={icon} size={26} color={color} />
      </View>
      <View style={styles.optionTextContainer}>
        <Text variant={Platform.OS === "ios" ? "headline" : "body"}>
          {label}
        </Text>
        <Text
          variant="subheadline"
          tone="secondary"
        >
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

export default function AddMenuScreen() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  const handleOptionPress = React.useCallback((route: string) => {
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
      color: colors.category.urination.accent,
      tileColor: colors.category.urination.container,
      route: "/(modals)/add/urination",
      testID: "add-menu-urination",
    },
    {
      icon: "cup-water" as const,
      label: t("add.fluid"),
      description: t("add.fluidDesc"),
      color: colors.category.fluid.accent,
      tileColor: colors.category.fluid.container,
      route: "/(modals)/add/fluid",
      testID: "add-menu-fluid",
    },
    {
      icon: "water-alert" as const,
      label: t("add.leak"),
      description: t("add.leakDesc"),
      color: colors.category.leak.accent,
      tileColor: colors.category.leak.container,
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
        { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.sm },
      ]}
    >
      <SheetHandle />

      <Text
        variant={Platform.OS === "ios" ? "title3" : "title2"}
        style={styles.title}
        accessibilityRole="header"
      >
        {t("add.title")}
      </Text>
      <Text
        variant="subheadline"
        tone="secondary"
        style={styles.subtitle}
      >
        {t("add.subtitle")}
      </Text>

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
              tileColor={option.tileColor}
              onPress={() => handleOptionPress(option.route)}
              testID={option.testID}
            />
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const ICON_TILE = 44;

const styles = StyleSheet.create({
  container: Platform.select({
    ios: {
      backgroundColor: colors.background,
      paddingHorizontal: spacing.lg,
      // Clears the system grabber
      paddingTop: 28,
    },
    default: {
      backgroundColor: colors.background,
    },
  }),
  title: Platform.select({
    ios: {
      textAlign: "center",
    },
    default: {
      // Material 3 sheet headline, start-aligned
      paddingHorizontal: spacing.xl,
    },
  }),
  subtitle: Platform.select({
    ios: {
      textAlign: "center",
      marginTop: spacing.xs,
      marginBottom: spacing.lg,
    },
    default: {
      paddingHorizontal: spacing.xl,
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
    },
  }),
  options: Platform.select({
    ios: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderCurve: "continuous",
      overflow: "hidden",
    },
    default: {},
  }),
  option: Platform.select({
    ios: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      minHeight: 64,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.lg,
    },
    default: {
      // Material 3 two-line list item (72dp), aligned with the headline
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.lg,
      minHeight: 72,
      paddingVertical: spacing.sm,
      paddingStart: spacing.xl,
      paddingEnd: spacing.xl,
    },
  }),
  optionPressedIOS: {
    backgroundColor: colors.highlight,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#C6C6C8", // iOS separator (decorative)
    marginStart: spacing.lg + ICON_TILE + spacing.md,
  },
  optionIconContainer: {
    width: ICON_TILE,
    height: ICON_TILE,
    borderRadius: radius.md,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  optionTextContainer: {
    flex: 1,
    gap: spacing.xxs,
  },
});
