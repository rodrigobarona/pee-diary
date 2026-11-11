import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import { AnimatedPressable } from '@/components/ui/animated-pressable';
import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { a11yLabel, choiceA11y, choiceGroupA11y } from '@/lib/a11y';
import { haptics } from '@/lib/haptics';
import { useI18n } from '@/lib/i18n/context';
import { colors } from '@/lib/theme/colors';
import {
  MIN_TOUCH_TARGET,
  radius,
  selectionStyle,
  spacing,
} from '@/lib/theme/styles';

type VolumeSize = 'small' | 'medium' | 'large';

interface VolumePickerProps {
  value: VolumeSize;
  onChange: (value: VolumeSize) => void;
  // The section title, the group's accessible name ("Volume")
  label: string;
  disabled?: boolean;
}

// Icon box: the same for every size so the labels line up
const ICON_BOX = 40;

const volumeConfig: Record<
  VolumeSize,
  {
    labelKey: string;
    icon: IconName;
    size: number;
    description: string;
    // Spoken range, in words
    rangeKey: string;
  }
> = {
  small: {
    labelKey: 'urination.volumeSmall',
    icon: 'water-outline',
    size: 24,
    description: '< 100 ml',
    rangeKey: 'a11y.forms.volumeSmallRange',
  },
  medium: {
    labelKey: 'urination.volumeMedium',
    icon: 'water',
    size: 32,
    description: '100–300 ml',
    rangeKey: 'a11y.forms.volumeMediumRange',
  },
  large: {
    labelKey: 'urination.volumeLarge',
    icon: 'water',
    size: 40,
    description: '> 300 ml',
    rangeKey: 'a11y.forms.volumeLargeRange',
  },
};

const SIZES: VolumeSize[] = ['small', 'medium', 'large'];

export function VolumePicker({ value, onChange, label, disabled }: VolumePickerProps) {
  const { t } = useI18n();

  const handlePress = React.useCallback(
    (size: VolumeSize) => {
      if (disabled || size === value) return;
      haptics.selection();
      onChange(size);
    },
    [disabled, onChange, value]
  );

  return (
    <View style={styles.container} {...choiceGroupA11y(label)}>
      {SIZES.map((size) => {
        const config = volumeConfig[size];
        const isSelected = value === size;

        return (
          <AnimatedPressable
            key={size}
            onPress={() => handlePress(size)}
            disabled={disabled}
            {...choiceA11y(isSelected)}
            accessibilityLabel={a11yLabel(t(config.labelKey), t(config.rangeKey))}
            style={[
              styles.option,
              isSelected ? selectionStyle.selected : selectionStyle.unselected,
              disabled ? styles.optionDisabled : undefined,
            ]}
          >
            <View style={styles.iconBox}>
              <Icon
                name={config.icon}
                size={config.size}
                color={isSelected ? colors.primary.onContainer : colors.primary.DEFAULT}
              />
            </View>
            <Text
              variant="subheadline"
              style={[
                styles.label,
                {
                  color: isSelected
                    ? selectionStyle.textSelected
                    : selectionStyle.textUnselected,
                },
              ]}
            >
              {t(config.labelKey)}
            </Text>
            <Text
              variant="caption1"
              tone="secondary"
              style={isSelected ? styles.descriptionSelected : undefined}
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
    gap: spacing.md,
  },
  option: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderCurve: 'continuous',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    gap: spacing.xs,
    overflow: 'hidden',
  },
  optionDisabled: {
    opacity: 0.5,
  },
  iconBox: {
    width: ICON_BOX,
    height: ICON_BOX,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  label: {
    fontWeight: '600',
    textAlign: 'center',
  },
  descriptionSelected: {
    color: colors.primary.onContainer,
  },
});
