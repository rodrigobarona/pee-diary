import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { a11yLabel, hiddenA11y } from '@/lib/a11y';
import { numberFormatters } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/context';
import { colors } from '@/lib/theme/colors';
import { iconSize, spacing } from '@/lib/theme/styles';

interface DailyStatsBarProps {
  voids: number;
  fluids: number;
  leaks: number;
  /**
   * Hide from screen readers when a parent element already reads the
   * counts (the History day header).
   */
  hideFromAccessibility?: boolean;
}

/** Spoken summary of a day's counts: "8 bathroom visits, 1780 millilitres". */
export function useDayCountsLabel() {
  const { t } = useI18n();
  return React.useCallback(
    (voids: number, fluids: number, leaks: number) =>
      a11yLabel(
        t('a11y.history.voidCount', { count: voids }),
        t('a11y.history.millilitres', { count: fluids }),
        leaks > 0 ? t('a11y.history.leakCount', { count: leaks }) : null
      ),
    [t]
  );
}

/**
 * A day's counts (bathroom visits, fluid intake, leaks), as neutral totals.
 * One accessible element read in words.
 */
export function DailyStatsBar({
  voids,
  fluids,
  leaks,
  hideFromAccessibility = false,
}: DailyStatsBarProps) {
  const countsLabel = useDayCountsLabel();

  return (
    <View
      style={styles.container}
      {...(hideFromAccessibility
        ? hiddenA11y
        : { accessible: true, accessibilityLabel: countsLabel(voids, fluids, leaks) })}
    >
      <View style={styles.stat}>
        <Icon name="toilet" size={iconSize.sm} color={colors.category.urination.accent} />
        <Text variant="footnote" style={styles.value}>
          {numberFormatters.decimal.format(voids)}
        </Text>
      </View>

      <View style={styles.stat}>
        <Icon name="cup-water" size={iconSize.sm} color={colors.category.fluid.accent} />
        <Text variant="footnote" style={styles.value}>
          {`${numberFormatters.decimal.format(fluids)} ml`}
        </Text>
      </View>

      {/* Leaks only when there are some */}
      {leaks > 0 ? (
        <View style={styles.stat}>
          <Icon name="water-alert" size={iconSize.sm} color={colors.category.leak.accent} />
          <Text
            variant="footnote"
            style={[styles.value, { color: colors.category.leak.accent }]}
          >
            {numberFormatters.decimal.format(leaks)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: spacing.md,
    rowGap: spacing.xs,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  value: {
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});
