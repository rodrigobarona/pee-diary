import * as React from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
} from "react-native-reanimated";

import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useI18n } from "@/lib/i18n/context";
import { colors } from "@/lib/theme/colors";
import {
  MIN_TOUCH_TARGET,
  hitSlopFor,
  iconSize,
  spacing,
} from "@/lib/theme/styles";

interface StreakBadgeProps {
  streak: number;
  showLabel?: boolean;
  onPress?: () => void;
}

// The pill is 32 tall; the touch target grows to 44pt / 48dp around it
const BADGE_HEIGHT = 32;

/**
 * The number of days in a row with entries. One neutral colour whatever the
 * length: a longer run is not "better" health.
 */
export function StreakBadge({
  streak,
  showLabel = true,
  onPress,
}: StreakBadgeProps) {
  const { t } = useI18n();
  const scale = useSharedValue(1);
  const prevStreak = React.useRef(streak);

  // Animate when streak increases
  React.useEffect(() => {
    if (streak > prevStreak.current) {
      scale.set(
        withSequence(
          withSpring(1.2, { damping: 10, stiffness: 300 }),
          withDelay(100, withSpring(1, { damping: 15, stiffness: 200 }))
        )
      );
    }
    prevStreak.current = streak;
  }, [streak, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  if (streak === 0) {
    return null;
  }

  const label = t("a11y.today.streak", { count: streak });

  const badge = (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Icon name="fire" size={iconSize.md} color={colors.amber.accent} />
      <Text variant="subheadline" style={styles.text}>
        {streak}
        {showLabel
          ? ` ${streak === 1 ? t("streak.day") : t("streak.days")}`
          : null}
      </Text>
    </Animated.View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={t("a11y.today.streakHint")}
        hitSlop={hitSlopFor(MIN_TOUCH_TARGET, BADGE_HEIGHT)}
        style={styles.pressable}
      >
        {badge}
      </AnimatedPressable>
    );
  }

  return (
    <Animated.View accessible accessibilityLabel={label}>
      {badge}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: 9999,
    overflow: "hidden",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: BADGE_HEIGHT,
    backgroundColor: colors.amber.container,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 9999,
  },
  text: {
    fontWeight: "600",
    color: colors.amber.accent, // 6.37:1 on the amber container
  },
});
