import { router } from "expo-router";
import * as React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { Icon } from "@/components/ui/icon";
import { SheetHandle } from "@/components/ui/sheet-handle";
import { Text } from "@/components/ui/text";
import { choiceA11y, choiceGroupA11y } from "@/lib/a11y";
import { haptics } from "@/lib/haptics";
import { useI18n } from "@/lib/i18n/context";
import { REMINDER_INTERVAL_OPTIONS, useDiaryStore } from "@/lib/store";
import { colors } from "@/lib/theme/colors";
import { cardStyle, iconSize, spacing } from "@/lib/theme/styles";

const IS_IOS = Platform.OS === "ios";

/**
 * How often reminders repeat: one choice in a list, like the Language sheet
 * (an alert cannot hold four options plus Cancel on Android).
 */
export default function ReminderIntervalScreen() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const intervalHours = useDiaryStore(
    (state) => state.reminderSettings.intervalHours
  );
  const updateReminderSettings = useDiaryStore(
    (state) => state.updateReminderSettings
  );

  const handleSelect = (hours: number) => {
    if (hours !== intervalHours) haptics.selection();
    // useReminderSync (app/_layout.tsx) reschedules the reminders
    updateReminderSettings({ intervalHours: hours });
    setTimeout(() => router.dismiss(), 150);
  };

  return (
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
      <Text
        variant={IS_IOS ? "title3" : "title2"}
        style={styles.title}
        accessibilityRole="header"
      >
        {t("settings.reminderInterval")}
      </Text>

      <View
        style={styles.optionsContainer}
        {...choiceGroupA11y(t("settings.reminderInterval"))}
      >
        {REMINDER_INTERVAL_OPTIONS.map((hours, index) => {
          const isSelected = hours === intervalHours;
          const label = t("settings.everyXHours", { count: hours });
          return (
            <React.Fragment key={hours}>
              {index > 0 ? <View style={styles.separator} /> : null}
              <AnimatedPressable
                onPress={() => handleSelect(hours)}
                testID={`reminder-interval-${hours}`}
                feedback="highlight"
                highlightColor={colors.highlight}
                {...choiceA11y(isSelected)}
                accessibilityLabel={label}
                style={styles.option}
              >
                <View style={styles.labelContainer}>
                  <Text
                    variant="body"
                    style={isSelected ? styles.labelSelected : undefined}
                  >
                    {label}
                  </Text>
                </View>
                {IS_IOS ? (
                  <View style={styles.checkmarkSlot}>
                    {isSelected ? (
                      <Icon
                        name="check"
                        size={iconSize.lg}
                        color={colors.primary.DEFAULT}
                      />
                    ) : null}
                  </View>
                ) : (
                  <View style={[styles.radio, isSelected && styles.radioSelected]}>
                    {isSelected ? <View style={styles.radioInner} /> : null}
                  </View>
                )}
              </AnimatedPressable>
            </React.Fragment>
          );
        })}
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
    marginBottom: spacing.lg,
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
