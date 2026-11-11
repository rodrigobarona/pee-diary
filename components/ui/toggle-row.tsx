import * as React from 'react';
import { View, Switch, StyleSheet, Platform, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Text } from './text';
import { colors } from '@/lib/theme/colors';

interface ToggleRowProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  haptic?: boolean;
  testID?: string;
}

/**
 * Row with label and toggle switch. The whole row toggles it and is the one
 * accessible element (role switch, the label as its name, checked state).
 */
export function ToggleRow({
  label,
  description,
  value,
  onValueChange,
  haptic = true,
  testID,
}: ToggleRowProps) {
  const handleValueChange = React.useCallback(
    (newValue: boolean) => {
      if (haptic && Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onValueChange(newValue);
    },
    [haptic, onValueChange]
  );

  return (
    <Pressable
      onPress={() => handleValueChange(!value)}
      style={styles.row}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={description}
      accessibilityState={{ checked: value }}
      android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}
      testID={testID}
    >
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}
      </View>
      {/* Shows the state only; the row takes the touch, so a tap anywhere
          toggles once */}
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Switch
          value={value}
          trackColor={{ false: '#E5E7EB', true: colors.primary.DEFAULT }}
          thumbColor="#FFFFFF"
          ios_backgroundColor="#E5E7EB"
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: Platform.OS === 'ios' ? 44 : 56,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
});
