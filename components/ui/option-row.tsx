import * as React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { AnimatedPressable } from './animated-pressable';
import { Icon, type IconName } from './icon';
import { Text } from './text';
import { choiceA11y } from '@/lib/a11y';
import { haptics } from '@/lib/haptics';
import { colors } from '@/lib/theme/colors';
import { iconSize, radius, spacing } from '@/lib/theme/styles';

const IS_IOS = Platform.OS === 'ios';

interface OptionRowProps {
  icon: IconName;
  label: string;
  isSelected: boolean;
  onPress: () => void;
  /** Identity colour of the option's icon (an accessible accent token). */
  color?: string;
  type?: 'radio' | 'check';
  /** Plays the selection feedback (on by default). */
  haptic?: boolean;
  testID?: string;
}

/**
 * One row of a selection list.
 * - type 'radio' (one choice in a group): iOS shows a trailing checkmark on
 *   the chosen row, as UIKit lists do; Android shows Material radio buttons.
 *   Put the rows in a container with choiceGroupA11y(title).
 * - type 'check' (several choices): a checkbox on both platforms.
 */
export function OptionRow({
  icon,
  label,
  isSelected,
  onPress,
  color,
  type = 'radio',
  haptic = true,
  testID,
}: OptionRowProps) {
  const handlePress = React.useCallback(() => {
    if (haptic && !isSelected) {
      haptics.selection();
    }
    onPress();
  }, [haptic, isSelected, onPress]);

  const iconColor = color ?? (isSelected ? colors.primary.DEFAULT : colors.textSecondary);

  const a11y =
    type === 'radio'
      ? choiceA11y(isSelected)
      : {
          accessibilityRole: 'checkbox' as const,
          accessibilityState: { checked: isSelected },
        };

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={styles.row}
      feedback="highlight"
      highlightColor={colors.highlight}
      accessibilityLabel={label}
      testID={testID}
      {...a11y}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.surfaceMuted }]}>
        <Icon name={icon} size={iconSize.md} color={iconColor} />
      </View>
      <Text
        variant="body"
        style={[
          styles.label,
          isSelected && !IS_IOS ? styles.labelSelected : undefined,
        ]}
      >
        {label}
      </Text>
      {type === 'radio' ? (
        IS_IOS ? (
          // iOS: a checkmark marks the chosen row; the others show nothing
          <View style={styles.checkmarkSlot}>
            {isSelected ? (
              <Icon name="check" size={iconSize.lg} color={colors.primary.DEFAULT} />
            ) : null}
          </View>
        ) : (
          <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
            {isSelected ? <View style={styles.radioInner} /> : null}
          </View>
        )
      ) : (
        <View style={[styles.checkOuter, isSelected && styles.checkOuterActive]}>
          {isSelected ? (
            <Icon name="check" size={iconSize.sm} color={colors.onPrimary} />
          ) : null}
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: IS_IOS ? 44 : 56,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
  },
  labelSelected: {
    fontWeight: '500',
  },
  checkmarkSlot: {
    width: iconSize.lg,
    alignItems: 'center',
  },
  // Material 3 radio button: 20dp, 2dp outline (colors.outline, 4.48:1)
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: colors.primary.DEFAULT,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary.DEFAULT,
  },
  // Checkbox: 18dp, 2dp outline
  checkOuter: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOuterActive: {
    borderColor: colors.primary.DEFAULT,
    backgroundColor: colors.primary.DEFAULT,
  },
});
