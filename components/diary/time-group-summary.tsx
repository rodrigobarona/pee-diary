import { getHours, parseISO } from "date-fns";
import * as React from "react";
import { StyleSheet, View } from "react-native";

import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { Icon, type IconName } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { a11yLabel } from "@/lib/a11y";
import { dateFormatters, formatHourRange } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/context";
import type { DiaryEntry } from "@/lib/store/types";
import { colors } from "@/lib/theme/colors";
import { cardStyle, iconSize, spacing } from "@/lib/theme/styles";

export type TimePeriod =
  | "earlyMorning"
  | "morning"
  | "afternoon"
  | "evening"
  | "night";

/** The hours each time of day covers (start inclusive, end exclusive). */
export const TIME_PERIOD_HOURS: Record<TimePeriod, [number, number]> = {
  earlyMorning: [0, 5],
  morning: [5, 12],
  afternoon: [12, 17],
  evening: [17, 21],
  night: [21, 24],
};

const PERIODS: TimePeriod[] = [
  "earlyMorning",
  "morning",
  "afternoon",
  "evening",
  "night",
];

interface TimeGroupSummaryProps {
  entries: DiaryEntry[];
  onPeriodPress?: (period: TimePeriod) => void;
}

// Helper to categorize entry by time period (matching history page)
const getTimePeriod = (timestamp: string): TimePeriod => {
  const hour = getHours(parseISO(timestamp));
  return (
    PERIODS.find((period) => hour < TIME_PERIOD_HOURS[period][1]) ?? "night"
  );
};

const PERIOD_ICONS: Record<TimePeriod, IconName> = {
  earlyMorning: "weather-night",
  morning: "weather-sunny",
  afternoon: "white-balance-sunny",
  evening: "weather-sunset",
  night: "weather-night",
};

// A whole hour in the device's clock (24 is the midnight that ends the day)
const formatHour = (hour: number) =>
  dateFormatters.hour.format(new Date(2023, 0, 1, hour % 24));

interface PeriodSummary {
  voids: number;
  fluids: number;
  fluidAmount: number;
  leaks: number;
}

/**
 * Today's entries by time of day, in the device's 12- or 24-hour clock. Each
 * time of day is one button that opens it in History.
 */
export function TimeGroupSummary({
  entries,
  onPeriodPress,
}: TimeGroupSummaryProps) {
  const { t } = useI18n();

  // Group entries by time period
  const groupedEntries = React.useMemo(() => {
    const groups: Record<TimePeriod, PeriodSummary> = {
      earlyMorning: { voids: 0, fluids: 0, fluidAmount: 0, leaks: 0 },
      morning: { voids: 0, fluids: 0, fluidAmount: 0, leaks: 0 },
      afternoon: { voids: 0, fluids: 0, fluidAmount: 0, leaks: 0 },
      evening: { voids: 0, fluids: 0, fluidAmount: 0, leaks: 0 },
      night: { voids: 0, fluids: 0, fluidAmount: 0, leaks: 0 },
    };

    entries.forEach((entry) => {
      const period = getTimePeriod(entry.timestamp);
      if (entry.type === "urination") {
        groups[period].voids++;
      } else if (entry.type === "fluid") {
        groups[period].fluids++;
        groups[period].fluidAmount += entry.amount;
      } else if (entry.type === "leak") {
        groups[period].leaks++;
      }
    });

    return groups;
  }, [entries]);

  return (
    <View style={styles.container}>
      {PERIODS.map((period, index) => {
        const summary = groupedEntries[period];
        const hasEntries =
          summary.voids > 0 || summary.fluids > 0 || summary.leaks > 0;
        const [startHour, endHour] = TIME_PERIOD_HOURS[period];
        const name = t(`timePeriod.${period}`);

        const label = a11yLabel(
          name,
          t("a11y.today.timeRange", {
            start: formatHour(startHour),
            end: formatHour(endHour),
          }),
          summary.voids > 0 &&
            t("a11y.today.voids", { count: summary.voids }),
          summary.fluids > 0 &&
            t("a11y.today.drinks", {
              count: summary.fluids,
              amount: summary.fluidAmount,
            }),
          summary.leaks > 0 &&
            t("a11y.today.leaks", { count: summary.leaks }),
          !hasEntries && t("timePeriod.noEntries")
        );

        return (
          <React.Fragment key={period}>
            {index > 0 ? <View style={styles.separator} /> : null}
            <AnimatedPressable
              onPress={() => onPeriodPress?.(period)}
              feedback="highlight"
              highlightColor={colors.highlight}
              style={styles.periodRow}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityHint={t("a11y.today.periodHint")}
            >
              <View style={styles.periodHeader}>
                <View style={styles.periodTitleRow}>
                  <Icon
                    name={PERIOD_ICONS[period]}
                    size={iconSize.md}
                    color={colors.primary.DEFAULT}
                  />
                  <Text variant="headline" style={styles.shrink}>
                    {name}
                  </Text>
                </View>
                <Text variant="footnote" tone="secondary">
                  {formatHourRange(startHour, endHour)}
                </Text>
              </View>

              {hasEntries ? (
                <View style={styles.entrySummary}>
                  {summary.voids > 0 ? (
                    <View style={styles.entryItem}>
                      <Icon
                        name="toilet"
                        size={iconSize.sm}
                        color={colors.category.urination.accent}
                      />
                      <Text variant="subheadline" style={styles.count}>
                        ×{summary.voids}
                      </Text>
                    </View>
                  ) : null}
                  {summary.fluids > 0 ? (
                    <View style={styles.entryItem}>
                      <Icon
                        name="cup-water"
                        size={iconSize.sm}
                        color={colors.category.fluid.accent}
                      />
                      <Text variant="subheadline" style={styles.count}>
                        ×{summary.fluids}
                      </Text>
                      <Text variant="footnote" tone="secondary">
                        ({summary.fluidAmount} ml)
                      </Text>
                    </View>
                  ) : null}
                  {summary.leaks > 0 ? (
                    <View style={styles.entryItem}>
                      <Icon
                        name="water-alert"
                        size={iconSize.sm}
                        color={colors.category.leak.accent}
                      />
                      <Text
                        variant="subheadline"
                        style={[styles.count, styles.leakCount]}
                      >
                        ×{summary.leaks}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : (
                <Text variant="subheadline" tone="secondary">
                  {t("timePeriod.noEntries")}
                </Text>
              )}
            </AnimatedPressable>
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...cardStyle,
    overflow: "hidden",
  },
  periodRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginStart: spacing.lg,
  },
  periodHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    columnGap: spacing.sm,
  },
  periodTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexShrink: 1,
  },
  shrink: {
    flexShrink: 1,
  },
  entrySummary: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: spacing.lg,
    rowGap: spacing.xs,
  },
  entryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  count: {
    fontWeight: "600",
  },
  leakCount: {
    color: colors.category.leak.accent,
  },
});
