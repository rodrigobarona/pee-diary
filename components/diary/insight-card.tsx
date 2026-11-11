import * as React from "react";
import { StyleSheet, View } from "react-native";

import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { Icon, type IconName } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useI18n } from "@/lib/i18n/context";
import { a11yLabel } from "@/lib/a11y";
import { colors } from "@/lib/theme/colors";
import { cardStyle, iconSize, spacing } from "@/lib/theme/styles";

// Trends are shown in one neutral colour: a change in the user's own counts
// is neither good nor bad.
const TREND_COLOR = colors.textSecondary;

interface InsightCardProps {
  title: string;
  value: string;
  // Spoken form of the value when the visible one is not read well
  // ("3/7" is read as "3 of 7 days")
  valueAccessibilityText?: string;
  subtitle?: string;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  icon: IconName;
  // Identity colour of the icon (a token with at least 3:1)
  color: string;
  // Tint behind the icon
  iconBackground?: string;
  onPress?: () => void;
}

/**
 * A figure of the Today summary. One accessible element whose label is the
 * title, the value and the change from the previous period, in words.
 */
export function InsightCard({
  title,
  value,
  valueAccessibilityText,
  subtitle,
  trend,
  trendValue,
  icon,
  color,
  iconBackground = colors.surfaceMuted,
  onPress,
}: InsightCardProps) {
  const { t } = useI18n();

  const trendIcon: IconName =
    trend === "up"
      ? "trending-up"
      : trend === "down"
        ? "trending-down"
        : "minus";

  const showTrend = trend !== undefined && trendValue !== undefined;
  const trendText =
    showTrend && trend === "up"
      ? t("a11y.today.trendUp", { value: trendValue })
      : showTrend && trend === "down"
        ? t("a11y.today.trendDown", { value: trendValue })
        : undefined;

  const label = a11yLabel(
    title,
    valueAccessibilityText ?? value,
    trendText,
    !showTrend ? subtitle : undefined
  );

  const content = (
    <>
      <View style={[styles.iconContainer, { backgroundColor: iconBackground }]}>
        <Icon name={icon} size={iconSize.md} color={color} />
      </View>

      {/* Value - centered and prominent; wraps rather than shrinking */}
      <Text variant="title3" style={styles.centered}>
        {value}
      </Text>

      {/* Title wraps for longer labels in Spanish and Portuguese */}
      <Text variant="footnote" tone="secondary" style={styles.centered}>
        {title}
      </Text>

      {/* Trend indicator or subtitle */}
      {showTrend ? (
        <View style={styles.trendContainer}>
          <Icon name={trendIcon} size={iconSize.sm} color={TREND_COLOR} />
          <Text variant="caption1" tone="secondary">
            {trendValue}
          </Text>
        </View>
      ) : subtitle ? (
        <Text variant="caption1" tone="secondary" style={styles.centered}>
          {subtitle}
        </Text>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        style={styles.container}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return (
    <View style={styles.container} accessible accessibilityLabel={label}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...cardStyle,
    overflow: "hidden",
    flex: 1,
    minWidth: 0,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    gap: spacing.xs,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  centered: {
    textAlign: "center",
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xxs,
  },
});
