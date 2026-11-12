import { isSameDay } from "date-fns";
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


interface DayData {
  date: Date;
  voids: number;
  fluids: number;
  leaks: number;
}

interface WeeklyChartProps {
  data: DayData[];
  onDayPress?: (date: Date) => void;
  fluidTarget?: number;
}

// Chart dimensions
const CHART_HEIGHT = 100;
const PADDING = 8;

/**
 * Voids and fluids for each of the last 7 days. The drawing is one image
 * for screen readers with a summary; each day is a button named with its
 * date and counts that opens it in History.
 */
export function WeeklyChart({
  data,
  onDayPress,
  fluidTarget,
}: WeeklyChartProps) {
  const { t } = useI18n();
  const { fontScale } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = React.useState(0);
  // The data ends on today (see the Today screen), which follows the change
  // of day; a new Date() here would keep yesterday after midnight.
  const today = data[data.length - 1]?.date ?? new Date();

  // Axis labels: the caption size, grown with the system font size up to a
  // cap so they still fit under the bars (SVG text does not scale by itself)
  const labelFontSize =
    (typography.caption1.fontSize ?? 12) *
    Math.min(Math.max(fontScale, 1), CONTROL_MAX_FONT_SCALE);
  const labelHeight = Math.ceil(labelFontSize * 1.4) + spacing.sm;

  const handleLayout = React.useCallback((event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  }, []);

  // Fluid bars share one scale: the user's target if they set one, or the
  // largest day, whichever is higher, so no bar is cut off
  const fluidScaleMax = Math.max(
    fluidTarget ?? 0,
    ...data.map((day) => day.fluids),
    1
  );

  // Responsive dimensions
  const dayCount = data.length || 1;
  const barGroupWidth = Math.max(containerWidth - PADDING * 2, 0) / dayCount;
  const barWidth = Math.max(Math.min((barGroupWidth - 8) / 2, 16), 2); // Max 16px per bar
  const barGap = 2;

  // The visit scale follows the logged counts only: there is no visit target
  const maxVoids = Math.max(...data.map((d) => d.voids), 1);
  const voidScale = (CHART_HEIGHT - 8) / maxVoids;

  const dayLabel = (day: DayData) =>
    t("a11y.today.chartDay", {
      date: dateFormatters.weekdayDayMonth.format(day.date),
      details: a11yLabel(
        t("a11y.today.voids", { count: day.voids }),
        `${t("home.summary.fluids")} ${t("a11y.today.millilitres", {
          amount: day.fluids,
        })}`,
        day.leaks > 0 && t("a11y.today.leaks", { count: day.leaks })
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
              accessibilityLabel={t("a11y.today.weeklyChart")}
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

                {/* Bars for each day */}
                {data.map((day, index) => {
                  const groupX = PADDING + index * barGroupWidth;
                  const centerX = groupX + barGroupWidth / 2;
                  const isToday = isSameDay(day.date, today);

                  // Bar positions
                  const voidBarX = centerX - barWidth - barGap / 2;
                  const fluidBarX = centerX + barGap / 2;

                  // Void bar height
                  const voidHeight = Math.max(
                    day.voids * voidScale,
                    day.voids > 0 ? 4 : 0
                  );
                  const voidY = CHART_HEIGHT - voidHeight;

                  // Fluid bar height, against the user's own target
                  const fluidHeight = Math.min(
                    Math.max(
                      (day.fluids / fluidScaleMax) *
                        (CHART_HEIGHT - 8),
                      day.fluids > 0 ? 4 : 0
                    ),
                    CHART_HEIGHT
                  );
                  const fluidY = CHART_HEIGHT - fluidHeight;

                  return (
                    <G key={day.date.toISOString()}>
                      {/* Today highlight */}
                      {isToday ? (
                        <Rect
                          x={groupX + 2}
                          y={0}
                          width={Math.max(barGroupWidth - 4, 0)}
                          height={CHART_HEIGHT + labelHeight}
                          fill={colors.accent}
                          rx={6}
                        />
                      ) : null}

                      {/* Void bar (primary color) */}
                      <Bar
                        x={voidBarX}
                        y={voidY}
                        width={barWidth}
                        height={voidHeight}
                        fill={colors.primary.DEFAULT}
                        delay={index * 40}
                        chartHeight={CHART_HEIGHT}
                      />

                      {/* Fluid bar (secondary color) */}
                      <Bar
                        x={fluidBarX}
                        y={fluidY}
                        width={barWidth}
                        height={fluidHeight}
                        fill={colors.secondary.DEFAULT}
                        delay={index * 40 + 20}
                        chartHeight={CHART_HEIGHT}
                      />

                      {/* Leak marker: the category colour, not a warning */}
                      {day.leaks > 0 ? (
                        <Rect
                          x={centerX - 4}
                          y={2}
                          width={8}
                          height={8}
                          fill={colors.category.leak.accent}
                          rx={4}
                        />
                      ) : null}

                      {/* Day label */}
                      <SvgText
                        x={centerX}
                        y={CHART_HEIGHT + labelFontSize + 4}
                        fontSize={labelFontSize}
                        fontWeight={isToday ? "700" : "500"}
                        fill={
                          isToday ? colors.primary.DEFAULT : colors.textSecondary
                        }
                        textAnchor="middle"
                      >
                        {dateFormatters.weekdayAxis.format(day.date)}
                      </SvgText>
                    </G>
                  );
                })}
              </Svg>
            </View>

            {/* One button per day, over its column */}
            <View
              style={[
                styles.tapOverlay,
                { width: containerWidth, height: CHART_HEIGHT + labelHeight },
              ]}
            >
              {data.map((day, index) => (
                <AnimatedPressable
                  key={day.date.toISOString()}
                  onPress={() => onDayPress?.(day.date)}
                  disabled={!onDayPress}
                  style={[
                    styles.tapTarget,
                    {
                      left: PADDING + index * barGroupWidth,
                      width: barGroupWidth,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={dayLabel(day)}
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
            {t("home.summary.voids")}
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
            {t("home.summary.fluids")}
          </Text>
        </View>
        {data.some((d) => d.leaks > 0) ? (
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
    <Rect x={x} y={y} width={width} height={height} fill={fill} rx={3} ry={3} />
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
    borderRadius: 6,
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
