import * as React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { Text } from '@/components/ui/text';
import { AnimatedPressable } from '@/components/ui/animated-pressable';
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
    <View style={styles.container}>
      {(['small', 'medium', 'large'] as VolumeSize[]).map((size) => {
        const config = volumeConfig[size];
        const isSelected = value === size;

        return (
          <AnimatedPressable
            key={size}
            onPress={() => handlePress(size)}
            disabled={disabled}
            haptic={false}
            style={[
              styles.option,
              isSelected ? styles.optionSelected : styles.optionUnselected,
              disabled ? styles.optionDisabled : undefined,
            ]}
          >
            <MaterialCommunityIcons
              name={config.icon as any}
              size={config.size}
              color={isSelected ? '#FFFFFF' : colors.primary.DEFAULT}
            />
            <Text
              style={[
                styles.label,
                isSelected ? styles.labelSelected : undefined,
              ]}
            >
              {t(config.labelKey)}
            </Text>
            <Text
              style={[
                styles.description,
                isSelected ? styles.descriptionSelected : undefined,
              ]}
            >
              {config.description}
            </Text>
          </AnimatedPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderCurve: 'continuous',
    paddingVertical: 16,
    gap: 8,
  },
  optionSelected: {
    backgroundColor: colors.primary.DEFAULT,
  },
  optionUnselected: {
    backgroundColor: 'rgba(0, 109, 119, 0.08)',
  },
  optionDisabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  labelSelected: {
    color: '#FFFFFF',
  },
  description: {
    fontSize: 12,
    color: '#6B7280',
  },
  descriptionSelected: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
