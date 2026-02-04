import * as React from 'react';
import { View, Switch, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Text } from './text';
import { colors } from '@/lib/theme/colors';

interface ToggleRowProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  haptic?: boolean;
}

/**
 * Row with label and toggle switch.
 * Used in settings and form screens.
 */
export function ToggleRow({
  label,
  description,
  value,
  onValueChange,
  haptic = true,
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
    <View style={styles.row}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={handleValueChange}
        trackColor={{ false: '#E5E7EB', true: colors.primary.DEFAULT }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#E5E7EB"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
