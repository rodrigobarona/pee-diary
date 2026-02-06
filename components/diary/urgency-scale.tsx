import * as Haptics from "expo-haptics";
import * as React from "react";
import { Platform, StyleSheet, View } from "react-native";

import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { Text } from "@/components/ui/text";
import { useI18n } from "@/lib/i18n/context";
import { urgencyColors as themeUrgencyColors } from "@/lib/theme/colors";

type UrgencyLevel = 1 | 2 | 3 | 4 | 5;

interface UrgencyScaleProps {
  value: UrgencyLevel;
  onChange: (value: UrgencyLevel) => void;
  disabled?: boolean;
}

// Design brief: Muted urgency colors - avoid red/green traffic light colors
const urgencyColors: Record<UrgencyLevel, string> = themeUrgencyColors;

export function UrgencyScale({ value, onChange, disabled }: UrgencyScaleProps) {
  const { t } = useI18n();

  const handlePress = React.useCallback(
    (level: UrgencyLevel) => {
      if (disabled) return;
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onChange(level);
    },
    [disabled, onChange]
  );

  return (
    <View style={styles.container}>
      <View style={styles.scaleContainer}>
        {([1, 2, 3, 4, 5] as UrgencyLevel[]).map((level) => {
          const isSelected = value === level;
          return (
            <AnimatedPressable
              key={level}
              onPress={() => handlePress(level)}
              disabled={disabled}
              haptic={false}
              style={[
                styles.option,
                {
                  backgroundColor: isSelected
                    ? urgencyColors[level]
                    : "rgba(0, 109, 119, 0.08)",
                },
                disabled ? styles.optionDisabled : undefined,
              ]}
            >
              <Text
                style={[
                  styles.levelText,
                  isSelected ? styles.levelTextSelected : undefined,
                ]}
              >
                {level}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>
      <Text style={styles.description}>{t(`urgency.${value}`)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  scaleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  option: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12, // Design brief: 8-12px max
    borderCurve: "continuous",
    paddingVertical: 16,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  levelText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#374151",
  },
  levelTextSelected: {
    color: "#FFFFFF",
  },
  description: {
    textAlign: "center",
    fontSize: 14,
    color: "#6B7280",
  },
});
