import * as React from "react";
import { StyleSheet, View } from "react-native";

import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { Icon, type IconName } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { choiceA11y, choiceGroupA11y } from "@/lib/a11y";
import { haptics } from "@/lib/haptics";
import { useI18n } from "@/lib/i18n/context";
import type { DrinkType } from "@/lib/store/types";
import { colors } from "@/lib/theme/colors";
import { radius, selectionStyle, spacing } from "@/lib/theme/styles";

// Drink types. The colours tell the drinks apart on their icons only (all
// meet 3:1 on their containers); the selected state is the same neutral teal
// for every drink.
const drinkTypes: {
  type: DrinkType;
  icon: IconName;
  labelKey: string;
  color: string;
  bgColor: string;
}[] = [
  {
    type: "water",
    icon: "water",
    labelKey: "fluid.water",
    color: colors.sky.accent,
    bgColor: colors.sky.container,
  },
  {
    type: "coffee",
    icon: "coffee",
    labelKey: "fluid.coffee",
    color: colors.amber.accent,
    bgColor: colors.amber.container,
  },
  {
    type: "tea",
    icon: "tea",
    labelKey: "fluid.tea",
    color: colors.green.accent,
    bgColor: colors.green.container,
  },
  {
    type: "juice",
    icon: "fruit-citrus",
    labelKey: "fluid.juice",
    color: colors.orange.accent,
    bgColor: colors.orange.container,
  },
  {
    type: "alcohol",
    icon: "glass-wine",
    labelKey: "fluid.alcohol",
    color: colors.violet.accent,
    bgColor: colors.violet.container,
  },
  {
    type: "other",
    icon: "cup",
    labelKey: "fluid.other",
    color: colors.textSecondary,
    bgColor: colors.surfaceMuted,
  },
];

interface DrinkTypePickerProps {
  value: DrinkType;
  onChange: (type: DrinkType) => void;
  // The section title, the group's accessible name ("Drink Type")
  label: string;
}

export function DrinkTypePicker({ value, onChange, label }: DrinkTypePickerProps) {
  const { t } = useI18n();

  const handleSelect = React.useCallback(
    (type: DrinkType) => {
      if (type === value) return;
      haptics.selection();
      onChange(type);
    },
    [onChange, value],
  );

  return (
    <View style={styles.grid} {...choiceGroupA11y(label)}>
      {drinkTypes.map((drink) => {
        const isSelected = value === drink.type;
        return (
          <AnimatedPressable
            key={drink.type}
            onPress={() => handleSelect(drink.type)}
            {...choiceA11y(isSelected)}
            accessibilityLabel={t(drink.labelKey)}
            style={[
              styles.card,
              isSelected ? selectionStyle.selected : selectionStyle.unselected,
            ]}
          >
            <View
              style={[styles.iconContainer, { backgroundColor: drink.bgColor }]}
            >
              <Icon name={drink.icon} size={28} color={drink.color} />
            </View>
            <Text
              variant="subheadline"
              style={[
                styles.label,
                {
                  color: isSelected
                    ? selectionStyle.textSelected
                    : selectionStyle.textUnselected,
                },
                isSelected ? styles.labelSelected : undefined,
              ]}
            >
              {t(drink.labelKey)}
            </Text>
          </AnimatedPressable>
        );
      })}
    </View>
  );
}

// Export drink config for use in other components
export { drinkTypes };

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  card: {
    width: "30%",
    flexGrow: 1,
    minWidth: 96,
    borderRadius: radius.md,
    borderCurve: "continuous",
    padding: spacing.md,
    alignItems: "center",
    gap: spacing.sm,
    overflow: "hidden",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    textAlign: "center",
  },
  labelSelected: {
    fontWeight: "600",
  },
});
