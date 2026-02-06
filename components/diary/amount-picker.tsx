import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import * as React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useI18n } from "@/lib/i18n/context";
import type { DrinkType } from "@/lib/store/types";
import { colors } from "@/lib/theme/colors";
import { drinkTypes } from "./drink-type-picker";

// Quick amounts
const quickAmounts = [
  { value: 100, label: "100" },
  { value: 200, label: "200" },
  { value: 250, label: "250" },
  { value: 330, label: "330" },
  { value: 500, label: "500" },
];

interface AmountPickerProps {
  value: string;
  onChange: (amount: string) => void;
  drinkType?: DrinkType;
  showInput?: boolean;
}

export function AmountPicker({
  value,
  onChange,
  drinkType = "water",
  showInput = true,
}: AmountPickerProps) {
  const { t } = useI18n();

  // Get current drink config for icon display
  const currentDrink =
    drinkTypes.find((d) => d.type === drinkType) ?? drinkTypes[0];

  const handleQuickAmount = React.useCallback(
    (amount: number) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onChange(amount.toString());
    },
    [onChange]
  );

  const adjustAmount = React.useCallback(
    (delta: number) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      const current = parseInt(value, 10) || 0;
      const newAmount = Math.max(0, current + delta);
      onChange(newAmount.toString());
    },
    [value, onChange]
  );

  return (
    <View style={styles.container}>
      {/* Large Amount Display with +/- */}
      <View style={styles.amountContainer}>
        {/* Minus Button */}
        <Pressable
          onPress={() => adjustAmount(-50)}
          style={styles.adjustButton}
        >
          <MaterialCommunityIcons
            name="minus"
            size={24}
            color={colors.primary.DEFAULT}
          />
        </Pressable>

        {/* Amount Display */}
        <View style={styles.amountDisplay}>
          <View
            style={[
              styles.amountIconBg,
              { backgroundColor: currentDrink.bgColor },
            ]}
          >
            <MaterialCommunityIcons
              name={currentDrink.icon as any}
              size={32}
              color={currentDrink.color}
            />
          </View>
          <Text style={styles.amountValue}>{value || "0"}</Text>
          <Text style={styles.amountUnit}>ml</Text>
        </View>

        {/* Plus Button */}
        <Pressable onPress={() => adjustAmount(50)} style={styles.adjustButton}>
          <MaterialCommunityIcons
            name="plus"
            size={24}
            color={colors.primary.DEFAULT}
          />
        </Pressable>
      </View>

      {/* Quick Amount Pills */}
      <View style={styles.quickAmounts}>
        {quickAmounts.map((item) => {
          const isSelected = value === item.value.toString();
          return (
            <Pressable
              key={item.value}
              onPress={() => handleQuickAmount(item.value)}
              style={[
                styles.quickAmountPill,
                isSelected && styles.quickAmountPillSelected,
              ]}
            >
              <Text
                style={[
                  styles.quickAmountText,
                  isSelected && styles.quickAmountTextSelected,
                ]}
              >
                {item.label}ml
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Custom Amount Input */}
      {showInput ? (
        <Input
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
          placeholder={t("fluid.amount")}
          style={{ textAlign: "center" }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 12, // Design brief: 8-12px max
    padding: 16,
    gap: 16,
    borderCurve: "continuous",
  },
  adjustButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderCurve: "continuous",
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  amountDisplay: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  amountIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  amountValue: {
    fontSize: 40,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 48,
  },
  amountUnit: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: -4,
  },
  quickAmounts: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  quickAmountPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8, // Design brief: 8-12px - using 8 for pill-like elements
    borderCurve: "continuous",
    backgroundColor: "#F3F4F6",
    minWidth: 60,
    alignItems: "center",
  },
  quickAmountPillSelected: {
    backgroundColor: "#006D77",
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4B5563",
  },
  quickAmountTextSelected: {
    color: "#FFFFFF",
  },
});
