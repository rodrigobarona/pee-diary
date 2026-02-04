import * as React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from './text';

interface SectionTitleProps {
  children: string;
}

/**
 * Uppercase section label for form sections.
 */
export function SectionTitle({ children }: SectionTitleProps) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
});
