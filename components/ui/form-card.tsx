import * as React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';

import { cardStyle } from '@/lib/theme/styles';

interface FormCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * White card for a form section: an inset grouped cell on iOS (no shadow),
 * a Material 3 outlined card on Android. Clips its rows' ripples.
 */
export function FormCard({ children, style }: FormCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    ...cardStyle,
    overflow: 'hidden',
  },
});
