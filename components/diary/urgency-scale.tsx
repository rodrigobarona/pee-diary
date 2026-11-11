import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import { AnimatedPressable } from '@/components/ui/animated-pressable';
import { Text } from '@/components/ui/text';
import { a11yLabel, adjustableA11y, hiddenA11y } from '@/lib/a11y';
import { haptics } from '@/lib/haptics';
import { useI18n } from '@/lib/i18n/context';
import { colors } from '@/lib/theme/colors';
import { MIN_TOUCH_TARGET, radius, spacing } from '@/lib/theme/styles';

type UrgencyLevel = 1 | 2 | 3 | 4 | 5;

const LEVELS: UrgencyLevel[] = [1, 2, 3, 4, 5];

interface UrgencyScaleProps {
  value: UrgencyLevel;
  onChange: (value: UrgencyLevel) => void;
  // The section title, the control's accessible name ("Urgency Level")
  label: string;
  disabled?: boolean;
}

/**
 * Urgency from 1 to 5. One neutral treatment for every level (no colour
 * ramp): the selected level is filled with the brand teal and outlined, the
 * others are a faint teal tint.
 *
 * Screen readers see one adjustable control ("Urgency Level, 3 of 5,
 * Moderate"): swipe up or down (VoiceOver) or use the adjust actions
 * (TalkBack) to change it. The five buttons stay tappable but are hidden
 * from screen readers.
 */
export function UrgencyScale({ value, onChange, label, disabled }: UrgencyScaleProps) {
  const { t } = useI18n();

  const select = React.useCallback(
    (level: UrgencyLevel) => {
      if (disabled || level === value) return;
      haptics.selection();
      onChange(level);
    },
    [disabled, onChange, value]
  );

  const valueText = a11yLabel(
    t('a11y.forms.urgencyValue', { value }),
    t(`urgency.${value}`)
  );

  return (
    <View
      style={styles.container}
      {...adjustableA11y({
        label,
        valueText,
        min: 1,
        max: 5,
        now: value,
        onIncrement: () => select(Math.min(5, value + 1) as UrgencyLevel),
        onDecrement: () => select(Math.max(1, value - 1) as UrgencyLevel),
      })}
      accessibilityState={{ disabled: !!disabled }}
    >
      <View style={styles.scaleContainer} {...hiddenA11y}>
        {LEVELS.map((level) => {
          const isSelected = value === level;
          return (
            <AnimatedPressable
              key={level}
              onPress={() => select(level)}
              disabled={disabled}
              accessible={false}
              importantForAccessibility="no"
              style={[
                styles.option,
                isSelected ? styles.optionSelected : styles.optionUnselected,
                disabled ? styles.optionDisabled : undefined,
              ]}
            >
              <Text
                variant="title2"
                tone={isSelected ? 'onAccent' : 'primary'}
                style={styles.levelText}
                maxFontSizeMultiplier={1.5}
              >
                {level}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>
      <Text
        variant="subheadline"
        tone="secondary"
        style={styles.description}
        {...hiddenA11y}
      >
        {t(`urgency.${value}`)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  scaleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  option: {
    flex: 1,
    minHeight: Math.max(MIN_TOUCH_TARGET, 56),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderCurve: 'continuous',
    borderWidth: 2,
    paddingVertical: spacing.sm,
    overflow: 'hidden',
  },
  optionSelected: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.dark,
  },
  optionUnselected: {
    backgroundColor: colors.primary.subtle,
    borderColor: colors.primary.subtle,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  levelText: {
    fontWeight: '700',
  },
  description: {
    textAlign: 'center',
  },
});
