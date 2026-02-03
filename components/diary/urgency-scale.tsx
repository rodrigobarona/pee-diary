import * as React from 'react';
import { View, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { cn } from '@/lib/theme';
import { Text } from '@/components/ui/text';

type UrgencyLevel = 1 | 2 | 3 | 4 | 5;

interface UrgencyScaleProps {
  value: UrgencyLevel;
  onChange: (value: UrgencyLevel) => void;
  disabled?: boolean;
}

const urgencyLabels: Record<UrgencyLevel, string> = {
  1: 'None',
  2: 'Mild',
  3: 'Moderate',
  4: 'Strong',
  5: 'Urgent',
};

const urgencyColors: Record<UrgencyLevel, string> = {
  1: 'bg-green-500',
  2: 'bg-lime-500',
  3: 'bg-yellow-500',
  4: 'bg-orange-500',
  5: 'bg-red-500',
};

export function UrgencyScale({ value, onChange, disabled }: UrgencyScaleProps) {
  const handlePress = React.useCallback(
    (level: UrgencyLevel) => {
      if (disabled) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(level);
    },
    [disabled, onChange]
  );

  return (
    <View className="gap-3">
      <View className="flex-row justify-between gap-2">
        {([1, 2, 3, 4, 5] as UrgencyLevel[]).map((level) => (
          <Pressable
            key={level}
            onPress={() => handlePress(level)}
            disabled={disabled}
            className={cn(
              'flex-1 items-center justify-center rounded-xl py-4',
              value === level
                ? urgencyColors[level]
                : 'bg-muted/30',
              disabled && 'opacity-50'
            )}
            style={{ borderCurve: 'continuous' }}
          >
            <Text
              className={cn(
                'text-2xl font-bold',
                value === level ? 'text-white' : 'text-foreground'
              )}
            >
              {level}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text className="text-center text-sm text-muted-foreground">
        {urgencyLabels[value]}
      </Text>
    </View>
  );
}
