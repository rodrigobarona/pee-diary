import * as React from 'react';
import { View, Pressable, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { cn } from '@/lib/theme';
import { Text } from '@/components/ui/text';
import { colors } from '@/lib/theme/colors';
import { useI18n } from '@/lib/i18n/context';

type VolumeSize = 'small' | 'medium' | 'large';

interface VolumePickerProps {
  value: VolumeSize;
  onChange: (value: VolumeSize) => void;
  disabled?: boolean;
}

const volumeConfig: Record<
  VolumeSize,
  { labelKey: string; icon: string; size: number; description: string }
> = {
  small: {
    labelKey: 'urination.volumeSmall',
    icon: 'water-outline',
    size: 24,
    description: '< 100ml',
  },
  medium: {
    labelKey: 'urination.volumeMedium',
    icon: 'water',
    size: 32,
    description: '100-300ml',
  },
  large: {
    labelKey: 'urination.volumeLarge',
    icon: 'water',
    size: 40,
    description: '> 300ml',
  },
};

export function VolumePicker({ value, onChange, disabled }: VolumePickerProps) {
  const { t } = useI18n();
  
  const handlePress = React.useCallback(
    (size: VolumeSize) => {
      if (disabled) return;
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onChange(size);
    },
    [disabled, onChange]
  );

  return (
    <View className="flex-row justify-between gap-3">
      {(['small', 'medium', 'large'] as VolumeSize[]).map((size) => {
        const config = volumeConfig[size];
        const isSelected = value === size;

        return (
          <Pressable
            key={size}
            onPress={() => handlePress(size)}
            disabled={disabled}
            className={cn(
              'flex-1 items-center justify-center rounded-xl py-4 gap-2',
              isSelected ? 'bg-primary' : 'bg-muted/30',
              disabled && 'opacity-50'
            )}
            style={{ borderCurve: 'continuous' }}
          >
            <MaterialCommunityIcons
              name={config.icon as any}
              size={config.size}
              color={isSelected ? '#FFFFFF' : colors.primary.DEFAULT}
            />
            <Text
              className={cn(
                'font-semibold',
                isSelected ? 'text-white' : 'text-foreground'
              )}
            >
              {t(config.labelKey)}
            </Text>
            <Text
              className={cn(
                'text-xs',
                isSelected ? 'text-white/70' : 'text-muted-foreground'
              )}
            >
              {config.description}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
