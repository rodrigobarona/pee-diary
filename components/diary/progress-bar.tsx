import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AnimatedPressable } from '@/components/ui/animated-pressable';
import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors } from '@/lib/theme/colors';
import { cardStyle, iconSize, spacing } from '@/lib/theme/styles';

interface ProgressBarProps {
  progress: number; // 0-1
  value: number;
  target: number;
  unit?: string;
  label: string;
  icon: IconName;
  // Identity colour of the entry type, for the icon (meets 3:1 or more)
  color?: string;
  // Colour of the value (the identity colour by default)
  valueColor?: string;
  // Tint behind the icon
  iconBackground?: string;
  // Bar fill (may be a light brand colour: the value is also written out)
  fillColor?: string;
  onPress?: () => void;
  successLabel?: string; // Label to show when target is 0 and value is 0 (e.g. t("home.noLeaks"))
  // Spoken label of the whole row (the visible numbers in words)
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

/**
 * A day total on Today (fluids with the user's own target, voids and leaks
 * as counts). Colours mark the entry type only, never a judgement.
 */
export function ProgressBar({
  progress,
  value,
  target,
  unit = '',
  label,
  icon,
  color = colors.primary.DEFAULT,
  valueColor = color,
  iconBackground = colors.primary.subtle,
  fillColor,
  onPress,
  successLabel,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: ProgressBarProps) {
  // Clamp progress between 0 and 1
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  const animatedProgress = useSharedValue(0);

  React.useEffect(() => {
    animatedProgress.set(
      withTiming(clampedProgress, {
        duration: 600,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );
  }, [clampedProgress, animatedProgress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.get() * 100}%`,
  }));

  // For leaks (target = 0), show the empty label when 0, count when > 0
  const isNoTargetMode = target === 0;
  const showSuccess =
    isNoTargetMode && value === 0 && successLabel !== undefined;

  const content = (
    <>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <View style={[styles.iconContainer, { backgroundColor: iconBackground }]}>
            <Icon name={icon} size={iconSize.md} color={color} />
          </View>
          <Text variant="headline" style={styles.label}>
            {label}
          </Text>
        </View>
        <View style={styles.valueRow}>
          {showSuccess ? (
            <View style={styles.successBadge}>
              <Text variant="subheadline" tone="secondary">
                {successLabel}
              </Text>
            </View>
          ) : isNoTargetMode ? (
            <Text variant="title3" style={{ color: valueColor }}>
              {value}
            </Text>
          ) : (
            <>
              <Text variant="title3" style={{ color: valueColor }}>
                {value}
              </Text>
              <Text variant="subheadline" tone="secondary">
                /{target}
                {unit}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Only items with a target have a track; there is nothing to fill otherwise */}
      {!isNoTargetMode ? (
        <View style={styles.track}>
          <Animated.View
            style={[
              styles.fill,
              { backgroundColor: fillColor ?? color },
              animatedStyle,
            ]}
          />
        </View>
      ) : null}
    </>
  );

  const spokenLabel =
    accessibilityLabel ??
    `${label}, ${showSuccess ? successLabel : value}`;

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        style={styles.container}
        accessibilityRole="button"
        accessibilityLabel={spokenLabel}
        accessibilityHint={accessibilityHint}
        testID={testID}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return (
    <View
      style={styles.container}
      accessible
      accessibilityLabel={spokenLabel}
      testID={testID}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...cardStyle,
    overflow: 'hidden',
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexShrink: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flexShrink: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  successBadge: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 9999,
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: colors.separator,
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
