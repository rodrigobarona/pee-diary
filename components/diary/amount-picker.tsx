import * as React from "react";
import { StyleSheet, View } from "react-native";

import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { adjustableA11y, choiceA11y, choiceGroupA11y } from "@/lib/a11y";
import { haptics } from "@/lib/haptics";
import { useI18n } from "@/lib/i18n/context";
import type { DrinkType } from "@/lib/store/types";
import { colors } from "@/lib/theme/colors";
import {
  cardStyle,
  MIN_TOUCH_TARGET,
  radius,
  spacing,
} from "@/lib/theme/styles";
import { drinkTypes } from "./drink-type-picker";

// Quick amounts (ml)
const QUICK_AMOUNTS = [100, 200, 250, 330, 500];
// The -/+ buttons change the amount by this many ml
const STEP = 50;
// The round -/+ buttons: at least the platform's touch target
const STEP_BUTTON = Math.max(MIN_TOUCH_TARGET, 48);

interface AmountPickerProps {
  value: string;
  onChange: (amount: string) => void;
  // The section title, the control's accessible name ("Amount (ml)")
  label: string;
  drinkType?: DrinkType;
  showInput?: boolean;
}

export function AmountPicker({
  value,
  onChange,
  label,
  drinkType = "water",
  showInput = true,
}: AmountPickerProps) {
  const { t } = useI18n();

  // Get current drink config for icon display
  const currentDrink =
    drinkTypes.find((d) => d.type === drinkType) ?? drinkTypes[0];

  const current = parseInt(value, 10) || 0;

  const handleQuickAmount = React.useCallback(
    (amount: number) => {
      if (amount.toString() === value) return;
      haptics.selection();
      onChange(amount.toString());
    },
    [onChange, value],
  );

  const adjustAmount = React.useCallback(
    (delta: number) => {
      const newAmount = Math.max(0, current + delta);
      if (newAmount === current) return;
      haptics.selection();
      onChange(newAmount.toString());
    },
    [current, onChange],
  );

  const amountText = t("a11y.forms.amountValue", { amount: current });

  return (
    <View style={styles.container}>
      {/* Stepper: the value is one adjustable element, with labelled -/+ */}
      <View style={styles.amountContainer}>
        <AnimatedPressable
          onPress={() => adjustAmount(-STEP)}
          disabled={current <= 0}
          accessibilityRole="button"
          accessibilityLabel={t("a11y.forms.decreaseAmount", { step: STEP })}
          style={[styles.adjustButton, current <= 0 ? styles.disabled : undefined]}
        >
          <Icon name="minus" size={24} color={colors.primary.DEFAULT} />
        </AnimatedPressable>

        <View
          style={styles.amountDisplay}
          {...adjustableA11y({
            label,
            valueText: amountText,
            min: 0,
            now: current,
            onIncrement: () => adjustAmount(STEP),
            onDecrement: () => adjustAmount(-STEP),
          })}
        >
          <View
            style={[
              styles.amountIconBg,
              { backgroundColor: currentDrink.bgColor },
            ]}
          >
            <Icon name={currentDrink.icon} size={32} color={currentDrink.color} />
          </View>
          <Text variant="largeTitle" style={styles.amountValue}>
            {value || "0"}
          </Text>
          <Text variant="callout" tone="secondary">
            ml
          </Text>
        </View>

        <AnimatedPressable
          onPress={() => adjustAmount(STEP)}
          accessibilityRole="button"
          accessibilityLabel={t("a11y.forms.increaseAmount", { step: STEP })}
          style={styles.adjustButton}
        >
          <Icon name="plus" size={24} color={colors.primary.DEFAULT} />
        </AnimatedPressable>
      </View>

      {/* Quick amounts: a single choice */}
      <View
        style={styles.quickAmounts}
        {...choiceGroupA11y(t("a11y.forms.quickAmounts"))}
      >
        {QUICK_AMOUNTS.map((amount) => {
          const isSelected = value === amount.toString();
          return (
            <AnimatedPressable
              key={amount}
              onPress={() => handleQuickAmount(amount)}
              {...choiceA11y(isSelected)}
              accessibilityLabel={t("a11y.forms.amountValue", { amount })}
              style={[
                styles.quickAmountPill,
                isSelected
                  ? styles.quickAmountPillSelected
                  : styles.quickAmountPillUnselected,
              ]}
            >
              <Text
                variant="subheadline"
                style={[
                  styles.quickAmountText,
                  {
                    color: isSelected
                      ? colors.primary.onContainer
                      : colors.text,
                  },
                ]}
              >
                {amount} ml
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>

      {/* Custom Amount Input */}
      {showInput ? (
        <Input
          value={value}
          onChangeText={(text) => onChange(text.replace(/[^0-9]/g, ""))}
          keyboardType="number-pad"
          placeholder={label}
          accessibilityLabel={label}
          style={styles.input}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  amountContainer: {
    ...cardStyle,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    gap: spacing.lg,
  },
  adjustButton: {
    width: STEP_BUTTON,
    height: STEP_BUTTON,
    borderRadius: radius.full,
    backgroundColor: colors.primary.subtle,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  disabled: {
    opacity: 0.4,
  },
  amountDisplay: {
    flex: 1,
    alignItems: "center",
    gap: spacing.sm,
  },
  amountIconBg: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  amountValue: {
    fontWeight: "700",
  },
  quickAmounts: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  quickAmountPill: {
    minHeight: MIN_TOUCH_TARGET,
    minWidth: 64,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.full,
    borderWidth: 2,
    overflow: "hidden",
  },
  quickAmountPillUnselected: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  quickAmountPillSelected: {
    backgroundColor: colors.primary.container,
    borderColor: colors.primary.DEFAULT,
  },
  quickAmountText: {
    fontWeight: "500",
  },
  input: {
    textAlign: "center",
  },
});
