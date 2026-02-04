import * as React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Text } from '@/components/ui/text';
import { AnimatedPressable } from '@/components/ui/animated-pressable';
import { useI18n } from '@/lib/i18n/context';

type UrgencyLevel = 1 | 2 | 3 | 4 | 5;

interface UrgencyScaleProps {
  value: UrgencyLevel;
  onChange: (value: UrgencyLevel) => void;
  disabled?: boolean;
}

// Urgency colors matching the original design
const urgencyColors: Record<UrgencyLevel, string> = {
  1: '#22C55E', // green-500
  2: '#84CC16', // lime-500
  3: '#EAB308', // yellow-500
  4: '#F97316', // orange-500
  5: '#EF4444', // red-500
};

export function UrgencyScale({ value, onChange, disabled }: UrgencyScaleProps) {
  const { t } = useI18n();

  const handlePress = React.useCallback(
    (level: UrgencyLevel) => {
      if (disabled) return;
      if (Platform.OS !== 'web') {
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
                    : 'rgba(0, 109, 119, 0.08)',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderCurve: 'continuous',
    paddingVertical: 16,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  levelText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#374151',
  },
  levelTextSelected: {
    color: '#FFFFFF',
  },
  description: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6B7280',
  },
});
