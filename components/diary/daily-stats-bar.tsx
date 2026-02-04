import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { Text } from '@/components/ui/text';
import { colors } from '@/lib/theme/colors';

interface DailyStatsBarProps {
  voids: number;
  fluids: number;
  leaks: number;
  compact?: boolean;
}

export function DailyStatsBar({ voids, fluids, leaks, compact = false }: DailyStatsBarProps) {
  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {/* Voids */}
        <View style={styles.compactStat}>
          <MaterialCommunityIcons name="toilet" size={11} color={colors.primary.DEFAULT} />
          <Text style={styles.compactValue}>{voids}</Text>
        </View>

        {/* Fluids */}
        <View style={styles.compactStat}>
          <MaterialCommunityIcons name="cup-water" size={11} color={colors.secondary.DEFAULT} />
          <Text style={styles.compactValue}>{fluids}</Text>
        </View>

        {/* Leaks - only if > 0 */}
        {leaks > 0 && (
          <View style={styles.compactStat}>
            <MaterialCommunityIcons name="water-alert" size={11} color={colors.error} />
            <Text style={[styles.compactValue, { color: colors.error }]}>{leaks}</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Voids */}
      <View style={styles.stat}>
        <MaterialCommunityIcons name="toilet" size={12} color={colors.primary.DEFAULT} />
        <Text style={styles.statValue}>{voids}</Text>
      </View>

      <View style={styles.divider} />

      {/* Fluids */}
      <View style={styles.stat}>
        <MaterialCommunityIcons name="cup-water" size={12} color={colors.secondary.DEFAULT} />
        <Text style={styles.statValue}>{fluids}</Text>
        <Text style={styles.statUnit}>ml</Text>
      </View>

      {/* Only show leaks if > 0 */}
      {leaks > 0 && (
        <>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <MaterialCommunityIcons name="water-alert" size={12} color={colors.error} />
            <Text style={[styles.statValue, { color: colors.error }]}>{leaks}</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 24, // Align with timeline content
    marginRight: 16,
    marginBottom: 6,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  statUnit: {
    fontSize: 11,
    color: '#6B7280',
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 10,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  compactValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
});
