import * as React from 'react';
import { View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { cn } from '@/lib/theme';
import { Text } from '@/components/ui/text';
import { AnimatedPressable } from '@/components/ui/animated-pressable';
import { colors } from '@/lib/theme/colors';
import { useI18n } from '@/lib/i18n/context';
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
    labelKey: 'entry.urination',
  },
  fluid: {
    icon: 'cup-water' as const,
    color: colors.secondary.DEFAULT,
    bgColor: 'bg-secondary/10',
    labelKey: 'entry.fluid',
  },
  leak: {
    icon: 'water-alert' as const,
    color: colors.error,
    bgColor: 'bg-destructive/10',
    labelKey: 'entry.leak',
  },
};

// Memoized component for list performance - per list-performance-item-memo rule
export const EntryCard = React.memo(function EntryCard({
  entry,
  onPress,
}: EntryCardProps) {
  const { t, locale } = useI18n();
  const config = entryConfig[entry.type];
  
  // Create formatter based on current locale
  const timeFormatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    [locale]
  );
  
  const time = timeFormatter.format(new Date(entry.timestamp));
  const label = t(config.labelKey);

  const getDescription = () => {
    switch (entry.type) {
      case 'urination':
        return `${t(`urination.volume${entry.volume.charAt(0).toUpperCase()}${entry.volume.slice(1)}`)} • ${t('urination.urgency')} ${entry.urgency}/5`;
      case 'fluid':
        return `${t(`fluid.${entry.drinkType}`)} • ${entry.amount}ml`;
      case 'leak':
        return `${t(`leak.${entry.severity}`)} • ${t('leak.urgency')} ${entry.urgency}/5`;
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
        accessibilityLabel={`${label} entry at ${time}`}
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
            {label}
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
