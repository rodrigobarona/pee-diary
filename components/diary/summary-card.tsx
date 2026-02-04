import * as React from 'react';
import { View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { cn } from '@/lib/theme';
import { Text } from '@/components/ui/text';
import { colors } from '@/lib/theme/colors';

interface SummaryCardProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string | number;
  unit?: string;
  color?: 'primary' | 'secondary' | 'accent';
  className?: string;
}

export function SummaryCard({
  icon,
  label,
  value,
  unit,
  color = 'primary',
  className,
}: SummaryCardProps) {
  const iconColor =
    color === 'primary'
      ? colors.primary.DEFAULT
      : color === 'secondary'
      ? colors.secondary.DEFAULT
      : colors.primary.light;

  return (
    <View
      className={cn(
        'flex-1 rounded-xl bg-surface p-4 gap-2',
        className
      )}
      style={{
        borderCurve: 'continuous',
        // Modern styling: boxShadow CSS syntax
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}
    >
      <View className="flex-row items-center gap-2">
        <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
        <Text className="text-sm text-muted-foreground">{label}</Text>
      </View>
      <View className="flex-row items-baseline gap-1">
        <Text className="text-3xl font-bold text-foreground">{value}</Text>
        {unit ? (
          <Text className="text-sm text-muted-foreground">{unit}</Text>
        ) : null}
      </View>
    </View>
  );
}
