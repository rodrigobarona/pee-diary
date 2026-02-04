import * as React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';

interface FormCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * White card container with shadow for form sections.
 * Uses modern styling: borderCurve, boxShadow, gap.
 */
export function FormCard({ children, style }: FormCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderCurve: 'continuous',
    marginBottom: 16,
    // Modern shadow syntax (Rule 9.2)
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },
});
