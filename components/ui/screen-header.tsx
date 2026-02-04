import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './text';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
}

/**
 * Centered screen header with title and optional subtitle.
 * Used for modal screens like add-menu, export, goals.
 */
export function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
  },
});
