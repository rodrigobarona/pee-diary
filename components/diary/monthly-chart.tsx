import {
  endOfWeek,
  isSameWeek,
  isWithinInterval,
  startOfWeek,
} from "date-fns";
import * as React from "react";
import {
  type LayoutChangeEvent,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { G, Line, Rect, Text as SvgText } from "react-native-svg";

import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { Text } from "@/components/ui/text";
import { a11yLabel } from "@/lib/a11y";
import { dateFormatters } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/context";
import { colors } from "@/lib/theme/colors";
import { cardStyle, spacing } from "@/lib/theme/styles";
import { CONTROL_MAX_FONT_SCALE, typography } from "@/lib/theme/typography";
import { weekOptions } from "@/lib/utils/date";


interface DayData {
  date: Date;
  voids: number;
  fluids: number;
  leaks: number;
}

interface WeekData {
  weekStart: Date;
  weekEnd: Date;
  avgVoids: number;
  avgFluids: number;
  totalLeaks: number;
  daysWithData: number;
}

interface MonthlyChartProps {
  data: DayData[];
  onWeekPress?: (weekStart: Date) => void;
  fluidTarget?: number;
}

// Chart dimensions
const CHART_HEIGHT = 100;
const PADDING = 8;

/**
 * Daily averages of voids and fluids, week by week (weeks start on the
 * device's first day of the week). Each week is a button named with its
 * dates and averages that opens it in History.
 */
export function MonthlyChart({
  data,
  onWeekPress,
  fluidTarget,
}: MonthlyChartProps) {
  const { t, formatVersion } = useI18n();
  const { fontScale } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = React.useState(0);
  // The data ends on today (see the Today screen), which follows the change
  // of day; a new Date() here would keep yesterday after midnight.
  const today = data[data.length - 1]?.date ?? new Date();

  const labelFontSize =
    (typography.caption1.fontSize ?? 12) *
    Math.min(Math.max(fontScale, 1), CONTROL_MAX_FONT_SCALE);
  const labelLineHeight = Math.ceil(labelFontSize * 1.3);
  const labelHeight = labelLineHeight * 2 + spacing.sm;

  // Group the days into weeks (4-5 weeks depending on the dates)
  const weeklyData = React.useMemo((): WeekData[] => {
    // Re-group when the device's first day of the week may have changed
    void formatVersion;
    const options = weekOptions();
    const weeks: WeekData[] = [];
    const seenWeeks = new Set<string>();

    data.forEach((d) => {
      const weekStart = startOfWeek(d.date, options);
      const weekKey = weekStart.toISOString();

      if (!seenWeeks.has(weekKey)) {
        seenWeeks.add(weekKey);
        const weekEnd = endOfWeek(d.date, options);

        const weekDays = data.filter((day) =>
          isWithinInterval(day.date, { start: weekStart, end: weekEnd })
        );

        const daysWithData = weekDays.filter(
          (day) => day.voids > 0 || day.fluids > 0
        ).length;
        const totalVoids = weekDays.reduce((sum, day) => sum + day.voids, 0);
        const totalFluids = weekDays.reduce((sum, day) => sum + day.fluids, 0);
        const totalLeaks = weekDays.reduce((sum, day) => sum + day.leaks, 0);

        weeks.push({
          weekStart,
          weekEnd,
          avgVoids: daysWithData > 0 ? totalVoids / daysWithData : 0,
          avgFluids: daysWithData > 0 ? totalFluids / daysWithData : 0,
          totalLeaks,
          daysWithData,
        });
      }
    });

    return weeks.sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());
  }, [data, formatVersion]);

  const handleLayout = React.useCallback((event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  }, []);

  // Responsive dimensions
  const weekCount = weeklyData.length || 1;
  const barGroupWidth = Math.max(containerWidth - PADDING * 2, 0) / weekCount;
  const barWidth = Math.max(Math.min((barGroupWidth - 16) / 2, 24), 2);
  const barGap = 4;

  // Fluid bars: the user's target if set, or the largest weekly average,
  // whichever is higher, so no bar is cut off
  const fluidScaleMax = Math.max(
    fluidTarget ?? 0,
    ...weeklyData.map((w) => w.avgFluids),
    1
  );

  // The visit scale follows the logged averages only: there is no visit target
  const maxVoids = Math.max(...weeklyData.map((w) => w.avgVoids), 1);
  const voidScale = (CHART_HEIGHT - 8) / maxVoids;

  const weekLabel = (week: WeekData) =>
    t("a11y.today.chartWeek", {
      start: dateFormatters.dayMonth.format(week.weekStart),
      end: dateFormatters.dayMonth.format(week.weekEnd),
      details: a11yLabel(
        t("a11y.today.avgVoidsPerDay", {
          count: Math.round(week.avgVoids * 10) / 10,
        }),
        t("a11y.today.avgFluidsPerDay", {
          amount: Math.round(week.avgFluids),
        }),
        week.totalLeaks > 0 &&
          t("a11y.today.leaks", { count: week.totalLeaks })
      ),
    });

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer} onLayout={handleLayout}>
        {containerWidth > 0 ? (
          <>
            <View
              accessible
              accessibilityRole="image"
              accessibilityLabel={t("a11y.today.monthlyChart")}
            >
              <Svg width={containerWidth} height={CHART_HEIGHT + labelHeight}>
                {/* Grid line at bottom */}
                <Line
                  x1={PADDING}
                  y1={CHART_HEIGHT}
                  x2={containerWidth - PADDING}
                  y2={CHART_HEIGHT}
                  stroke={colors.separator}
                  strokeWidth={1}
                />

                {/* Bars for each week */}
                {weeklyData.map((week, index) => {
                  const groupX = PADDING + index * barGroupWidth;
                  const centerX = groupX + barGroupWidth / 2;
                  const isCurrentWeek = isSameWeek(
                    week.weekStart,
                    today,
                    weekOptions()
                  );

                  const voidBarX = centerX - barWidth - barGap / 2;
                  const fluidBarX = centerX + barGap / 2;

                  // Void bar height (daily average)
                  const voidHeight = Math.max(
                    week.avgVoids * voidScale,
                    week.avgVoids > 0 ? 4 : 0
                  );
                  const voidY = CHART_HEIGHT - voidHeight;

                  // Fluid bar height (daily average, against the user's target)
                  const fluidHeight = Math.min(
                    Math.max(
                      (week.avgFluids / fluidScaleMax) *
                        (CHART_HEIGHT - 8),
                      week.avgFluids > 0 ? 4 : 0
                    ),
                    CHART_HEIGHT
                  );
                  const fluidY = CHART_HEIGHT - fluidHeight;

                  return (
                    <G key={week.weekStart.toISOString()}>
                      {/* Current week highlight */}
                      {isCurrentWeek ? (
                        <Rect
                          x={groupX + 4}
                          y={0}
                          width={Math.max(barGroupWidth - 8, 0)}
                          height={CHART_HEIGHT + labelHeight}
                          fill={colors.accent}
                          rx={8}
                        />
                      ) : null}

                      <Bar
                        x={voidBarX}
                        y={voidY}
                        width={barWidth}
                        height={voidHeight}
                        fill={colors.primary.DEFAULT}
                        delay={index * 80}
                        chartHeight={CHART_HEIGHT}
                      />

                      <Bar
                        x={fluidBarX}
                        y={fluidY}
                        width={barWidth}
                        height={fluidHeight}
                        fill={colors.secondary.DEFAULT}
                        delay={index * 80 + 40}
                        chartHeight={CHART_HEIGHT}
                      />

                      {/* Leak marker: the category colour, not a warning */}
                      {week.totalLeaks > 0 ? (
                        <Rect
                          x={centerX - 4}
                          y={2}
                          width={8}
                          height={8}
                          fill={colors.category.leak.accent}
                          rx={4}
                        />
                      ) : null}

                      {/* Week label: "This week", or the days and month */}
                      <SvgText
                        x={centerX}
                        y={CHART_HEIGHT + labelLineHeight + 2}
                        fontSize={labelFontSize}
                        fontWeight={isCurrentWeek ? "600" : "400"}
                        fill={
                          isCurrentWeek
                            ? colors.primary.DEFAULT
                            : colors.textSecondary
                        }
                        textAnchor="middle"
                      >
                        {isCurrentWeek
                          ? t("insights.thisWeek")
                          : `${week.weekStart.getDate()}–${week.weekEnd.getDate()}`}
                      </SvgText>
                      {isCurrentWeek ? null : (
                        <SvgText
                          x={centerX}
                          y={CHART_HEIGHT + labelLineHeight * 2 + 2}
                          fontSize={labelFontSize}
                          fontWeight="400"
                          fill={colors.textSecondary}
                          textAnchor="middle"
                        >
                          {dateFormatters.monthShort.format(week.weekStart)}
                        </SvgText>
                      )}
                    </G>
                  );
                })}
              </Svg>
            </View>

            {/* One button per week, over its column */}
            <View
              style={[
                styles.tapOverlay,
                { width: containerWidth, height: CHART_HEIGHT + labelHeight },
              ]}
            >
              {weeklyData.map((week, index) => (
                <AnimatedPressable
                  key={week.weekStart.toISOString()}
                  onPress={() => onWeekPress?.(week.weekStart)}
                  disabled={!onWeekPress}
                  style={[
                    styles.tapTarget,
                    {
                      left: PADDING + index * barGroupWidth,
                      width: barGroupWidth,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={weekLabel(week)}
                  accessibilityHint={t("a11y.today.dayHint")}
                />
              ))}
            </View>
          </>
        ) : (
          <View style={{ height: CHART_HEIGHT + labelHeight }} />
        )}
      </View>

      {/* Legend (the chart is described to screen readers above) */}
      <View
        style={styles.legend}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: colors.primary.DEFAULT },
            ]}
          />
          <Text variant="footnote" tone="secondary">
            {t("insights.avgVoids")}
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: colors.secondary.DEFAULT },
            ]}
          />
          <Text variant="footnote" tone="secondary">
            {t("insights.avgFluids")}
          </Text>
        </View>
        {weeklyData.some((w) => w.totalLeaks > 0) ? (
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: colors.category.leak.accent },
              ]}
            />
            <Text variant="footnote" tone="secondary">
              {t("home.summary.leaks")}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

// Bar component
interface BarProps {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  delay: number;
  chartHeight: number;
}

/**
 * One bar, drawn at its size. (Bars used to grow in with Reanimated animated
 * props, which left them at zero height on some mounts.)
 */
function Bar({ x, y, width, height, fill }: BarProps) {
  return (
    <Rect x={x} y={y} width={width} height={height} fill={fill} rx={4} ry={4} />
  );
}

const styles = StyleSheet.create({
  container: {
    ...cardStyle,
    padding: spacing.md,
  },
  chartContainer: {
    position: "relative",
  },
  tapOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  tapTarget: {
    position: "absolute",
    top: 0,
    height: "100%",
    borderRadius: 8,
    overflow: "hidden",
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    columnGap: spacing.lg,
    rowGap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
