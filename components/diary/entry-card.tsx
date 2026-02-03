import * as React from 'react';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { cn } from '@/lib/theme';
import { Text } from '@/components/ui/text';
import { AnimatedPressable } from '@/components/ui/animated-pressable';
import { colors } from '@/lib/theme/colors';
import type { DiaryEntry } from '@/lib/store/types';

interface EntryCardProps {
  entry: DiaryEntry;
  onPress?: () => void;
}

const entryConfig = {
  urination: {
    icon: 'toilet' as const,
    color: colors.primary.DEFAULT,
    bgColor: 'bg-primary/10',
    label: 'Urination',
  },
  fluid: {
    icon: 'cup-water' as const,
    color: colors.secondary.DEFAULT,
    bgColor: 'bg-secondary/10',
    label: 'Fluid Intake',
  },
  leak: {
    icon: 'water-alert' as const,
    color: colors.error,
    bgColor: 'bg-destructive/10',
    label: 'Leak',
  },
};

// Hoisted date formatter - per js-hoist-intl rule
const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

// Memoized component for list performance - per list-performance-item-memo rule
export const EntryCard = React.memo(function EntryCard({
  entry,
  onPress,
}: EntryCardProps) {
  const config = entryConfig[entry.type];
  const time = timeFormatter.format(new Date(entry.timestamp));

  const getDescription = () => {
    switch (entry.type) {
      case 'urination':
        return `${entry.volume} volume • Urgency ${entry.urgency}/5`;
      case 'fluid':
        return `${entry.drinkType} • ${entry.amount}ml`;
      case 'leak':
        return `${entry.severity} • Urgency ${entry.urgency}/5`;
      default:
        return '';
    }
  };

  const description = getDescription();

  return (
    <AnimatedPressable onPress={onPress}>
      <View
        className={cn('flex-row items-center gap-4 rounded-xl bg-surface p-4')}
        style={{
          borderCurve: 'continuous',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        }}
        accessibilityRole="button"
        accessibilityLabel={`${config.label} entry at ${time}`}
        accessibilityHint={description}
      >
        <View
          className={cn('h-12 w-12 items-center justify-center rounded-xl', config.bgColor)}
          style={{ borderCurve: 'continuous' }}
        >
          <MaterialCommunityIcons
            name={config.icon}
            size={24}
            color={config.color}
          />
        </View>
        <View className="flex-1 gap-1">
          <Text className="font-semibold text-foreground">
            {config.label}
          </Text>
          <Text className="text-sm text-muted-foreground">
            {description}
          </Text>
        </View>
        <Text className="text-sm text-muted-foreground">{time}</Text>
      </View>
    </AnimatedPressable>
  );
});
