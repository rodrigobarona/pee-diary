import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { Text } from './text';
import { AnimatedPressable } from './animated-pressable';
import { colors } from '@/lib/theme/colors';

interface OptionRowProps {
  icon: string;
  label: string;
  isSelected: boolean;
  onPress: () => void;
  color?: string;
  type?: 'radio' | 'check';
  haptic?: boolean;
}

/**
 * Row option component for selection lists (radio/check).
 * Uses AnimatedPressable for smooth press animations.
 */
export function OptionRow({
  icon,
  label,
  isSelected,
  onPress,
  color,
  type = 'radio',
  haptic = true,
}: OptionRowProps) {
  const handlePress = React.useCallback(() => {
    if (haptic && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  }, [haptic, onPress]);

  const iconColor = color || (isSelected ? colors.primary.DEFAULT : '#6B7280');

  return (
    <AnimatedPressable onPress={handlePress} style={styles.row} haptic={false}>
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: isSelected ? `${iconColor}15` : '#F3F4F6',
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon as any}
          size={22}
          color={iconColor}
        />
      </View>
      <Text
        style={[
          styles.label,
          isSelected && { color: colors.primary.DEFAULT, fontWeight: '600' },
        ]}
      >
        {label}
      </Text>
      {type === 'radio' ? (
        <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
          {isSelected ? <View style={styles.radioInner} /> : null}
        </View>
      ) : (
        <View style={[styles.checkOuter, isSelected && styles.checkOuterActive]}>
          {isSelected ? (
            <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
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
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  // Radio button styles
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: colors.primary.DEFAULT,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary.DEFAULT,
  },
  // Checkbox styles
  checkOuter: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOuterActive: {
    borderColor: colors.primary.DEFAULT,
    backgroundColor: colors.primary.DEFAULT,
  },
});
