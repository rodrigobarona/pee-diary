import * as React from 'react';
import { Platform, StyleSheet } from 'react-native';

import { Text } from './text';
import { colors } from '@/lib/theme/colors';

interface SectionTitleProps {
  children: string;
}

/**
 * Title of a form or list section, marked as a heading for screen readers.
 * iOS: the grouped-list section header (footnote, uppercase, secondary).
 * Android: the Material 3 list subheader (title small, primary colour,
 * sentence case).
 */
export function SectionTitle({ children }: SectionTitleProps) {
  return (
    <Text
      variant={Platform.OS === 'ios' ? 'footnote' : 'subheadline'}
      tone={Platform.OS === 'ios' ? 'secondary' : 'accent'}
      style={styles.sectionTitle}
      accessibilityRole="header"
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  sectionTitle: Platform.select({
    ios: {
      textTransform: 'uppercase',
      marginBottom: 8,
      marginStart: 16,
    },
    default: {
      fontWeight: '500',
      color: colors.primary.DEFAULT,
      marginBottom: 8,
      marginStart: 4,
    },
  }),
});
