import * as React from "react";
import { StyleSheet, View } from "react-native";

import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { Icon, type IconName } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { a11yLabel, choiceA11y, choiceGroupA11y } from "@/lib/a11y";
import { haptics } from "@/lib/haptics";
import { useI18n } from "@/lib/i18n/context";
import type { LeakActivity, LeakSeverity } from "@/lib/store/types";
import { colors } from "@/lib/theme/colors";
import {
  MIN_TOUCH_TARGET,
  radius,
  selectionStyle,
  spacing,
} from "@/lib/theme/styles";

const severityOptions: {
  value: LeakSeverity;
  icon: IconName;
  labelKey: string;
  descriptionKey: string;
}[] = [
  {
    value: "drops",
    icon: "water-outline",
    labelKey: "leak.drops",
    descriptionKey: "leak.dropsDesc",
  },
  {
    value: "moderate",
    icon: "water",
    labelKey: "leak.moderate",
    descriptionKey: "leak.moderateDesc",
  },
  {
    value: "full",
    icon: "water-alert",
    labelKey: "leak.full",
    descriptionKey: "leak.fullDesc",
  },
];

const activityOptions: { value: LeakActivity; icon: IconName }[] = [
  { value: "coughing", icon: "emoticon-sick-outline" },
  { value: "sneezing", icon: "emoticon-sick-outline" },
  { value: "laughing", icon: "emoticon-happy-outline" },
  { value: "exercise", icon: "run" },
  { value: "lifting", icon: "weight-lifter" },
  { value: "standing", icon: "human-handsup" },
  { value: "walking", icon: "walk" },
  { value: "sleeping", icon: "sleep" },
  { value: "other", icon: "dots-horizontal" },
];

interface LeakSeverityPickerProps {
  value: LeakSeverity;
  onChange: (value: LeakSeverity) => void;
  // The section title, the group's accessible name ("Amount")
  label: string;
}

/**
 * How much leaked: a single choice. The selected amount uses the same
 * neutral teal selection as every picker (never red: it is not an error);
 * the leak colour marks the category on the icon only.
 */
export function LeakSeverityPicker({
  value,
  onChange,
  label,
}: LeakSeverityPickerProps) {
  const { t } = useI18n();

  const select = (next: LeakSeverity) => {
    if (next === value) return;
    haptics.selection();
    onChange(next);
  };

  return (
    <View style={styles.severityOptions} {...choiceGroupA11y(label)}>
      {severityOptions.map((option) => {
        const isSelected = value === option.value;
        return (
          <AnimatedPressable
            key={option.value}
            onPress={() => select(option.value)}
            {...choiceA11y(isSelected)}
            accessibilityLabel={a11yLabel(
              t(option.labelKey),
              t(option.descriptionKey)
            )}
            style={[
              styles.severityOption,
              isSelected ? selectionStyle.selected : selectionStyle.unselected,
            ]}
          >
            <View style={styles.severityIconContainer}>
              <Icon
                name={option.icon}
                size={24}
                color={colors.category.leak.accent}
              />
            </View>
            <View style={styles.severityTextContainer}>
              <Text
                variant="headline"
                style={{
                  color: isSelected
                    ? selectionStyle.textSelected
                    : selectionStyle.textUnselected,
                }}
              >
                {t(option.labelKey)}
              </Text>
              <Text
                variant="subheadline"
                tone="secondary"
                style={isSelected ? styles.descriptionSelected : undefined}
              >
                {t(option.descriptionKey)}
              </Text>
            </View>
            {isSelected ? (
              <Icon
                name="check-circle"
                size={24}
                color={colors.primary.DEFAULT}
              />
            ) : null}
          </AnimatedPressable>
        );
      })}
    </View>
  );
}

interface LeakActivityPickerProps {
  value: LeakActivity | undefined;
  onChange: (value: LeakActivity | undefined) => void;
  // The section title, the group's accessible name ("Activity (optional)")
  label: string;
}

/**
 * What the person was doing: an optional single choice (tapping the chosen
 * activity again clears it).
 */
export function LeakActivityPicker({
  value,
  onChange,
  label,
}: LeakActivityPickerProps) {
  const { t } = useI18n();

  const toggle = (next: LeakActivity) => {
    haptics.selection();
    onChange(value === next ? undefined : next);
  };

  return (
    <View style={styles.activityGrid} {...choiceGroupA11y(label)}>
      {activityOptions.map((option) => {
        const isSelected = value === option.value;
        return (
          <AnimatedPressable
            key={option.value}
            onPress={() => toggle(option.value)}
            {...choiceA11y(isSelected)}
            accessibilityLabel={t(`leak.activities.${option.value}`)}
            style={[
              styles.activityChip,
              isSelected ? selectionStyle.selected : selectionStyle.unselected,
            ]}
          >
            <Icon
              name={isSelected ? "check" : option.icon}
              size={18}
              color={
                isSelected ? colors.primary.onContainer : colors.primary.DEFAULT
              }
            />
            <Text
              variant="subheadline"
              style={[
                styles.activityChipText,
                {
                  color: isSelected
                    ? selectionStyle.textSelected
                    : selectionStyle.textUnselected,
                },
              ]}
            >
              {t(`leak.activities.${option.value}`)}
            </Text>
          </AnimatedPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  severityOptions: {
    gap: spacing.md,
  },
  severityOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    minHeight: MIN_TOUCH_TARGET,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  severityIconContainer: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    borderCurve: "continuous",
    backgroundColor: colors.category.leak.container,
  },
  severityTextContainer: {
    flex: 1,
  },
  descriptionSelected: {
    color: colors.primary.onContainer,
  },
  activityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  activityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  activityChipText: {
    fontWeight: "500",
  },
});
