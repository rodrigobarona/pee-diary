import * as React from "react";
import {
  type LayoutChangeEvent,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, {
  Defs,
  G,
  Line,
  LinearGradient,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";

import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { Text } from "@/components/ui/text";
import { dateFormatters, numberFormatters } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/context";
import { colors } from "@/lib/theme/colors";
import { cardStyle, spacing } from "@/lib/theme/styles";
import { CONTROL_MAX_FONT_SCALE, typography } from "@/lib/theme/typography";


interface DayData {
  date: Date;
  fluidIntake: number; // ml
  urinationOutput: number; // ml (estimated or precise)
}

interface FluidBalanceChartProps {
  data: DayData[];
  onDayPress?: (date: Date) => void;
}

// Chart dimensions
const CHART_HEIGHT = 120;
const PADDING = 8;

// Volumes used to estimate output when no exact amount in ml was entered
export const VOLUME_ESTIMATES = {
  small: 100,
  medium: 250,
  large: 400,
} as const;

/**
 * Fluid intake and estimated output for each of the last 7 days: neutral
 * totals only, no ratio and no judgement.
 */
export function FluidBalanceChart({
  data,
  onDayPress,
}: FluidBalanceChartProps) {
  const { t } = useI18n();
  const { fontScale } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = React.useState(0);

  const labelFontSize =
    (typography.caption1.fontSize ?? 12) *
    Math.min(Math.max(fontScale, 1), CONTROL_MAX_FONT_SCALE);
  const labelHeight = Math.ceil(labelFontSize * 1.4) + spacing.sm;

  const handleLayout = React.useCallback((event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  }, []);

  // Responsive dimensions
  const dayCount = data.length || 1;
  const barGroupWidth = Math.max(containerWidth - PADDING * 2, 0) / dayCount;
  const barWidth = Math.max(Math.min((barGroupWidth - 12) / 2, 18), 2);
  const barGap = 4;

  // Calculate max values for scaling
  const maxIntake = Math.max(...data.map((d) => d.fluidIntake), 1);
  const maxOutput = Math.max(...data.map((d) => d.urinationOutput), 1);
  const maxValue = Math.max(maxIntake, maxOutput);

  // Calculate totals
  const totalIntake = data.reduce((sum, d) => sum + d.fluidIntake, 0);
  const totalOutput = data.reduce((sum, d) => sum + d.urinationOutput, 0);

  const dayLabel = (day: DayData) =>
    t("a11y.today.chartDay", {
      date: dateFormatters.weekdayDayMonth.format(day.date),
      details: t("a11y.today.intakeOutput", {
        intake: day.fluidIntake,
        output: day.urinationOutput,
      }),
    });

  return (
    <View style={styles.container}>
      {/* Totals for the 7 days */}
      <View style={styles.summaryHeader}>
        <View
          style={styles.summaryItem}
          accessible
          accessibilityLabel={`${t("insights.fluidIntake")}, ${t(
            "a11y.today.millilitres",
            { amount: totalIntake }
          )}`}
        >
          <View
            style={[
              styles.summaryDot,
              { backgroundColor: colors.secondary.DEFAULT },
            ]}
          />
          <Text variant="footnote" tone="secondary" style={styles.centered}>
            {t("insights.fluidIntake")}
          </Text>
          <Text variant="headline">{numberFormatters.decimal.format(totalIntake)} ml</Text>
        </View>
        <View
          style={styles.summaryItem}
          accessible
          accessibilityLabel={`${t("insights.urinationOutput")}, ${t(
            "a11y.today.millilitres",
            { amount: totalOutput }
          )}`}
        >
          <View
            style={[
              styles.summaryDot,
              { backgroundColor: colors.primary.DEFAULT },
            ]}
          />
          <Text variant="footnote" tone="secondary" style={styles.centered}>
            {t("insights.urinationOutput")}
          </Text>
          <Text variant="headline">{numberFormatters.decimal.format(totalOutput)} ml</Text>
        </View>
      </View>

      {/* How output is estimated */}
      <Text variant="footnote" tone="secondary" style={styles.estimateNote}>
        {t("insights.outputEstimateNote")}
      </Text>

      {/* Chart */}
      <View style={styles.chartContainer} onLayout={handleLayout}>
        {containerWidth > 0 ? (
          <>
            <View
              accessible
              accessibilityRole="image"
              accessibilityLabel={t("a11y.today.fluidBalanceChart")}
            >
              <Svg width={containerWidth} height={CHART_HEIGHT + labelHeight}>
                <Defs>
                  <LinearGradient
                    id="intakeGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <Stop offset="0" stopColor={colors.secondary.DEFAULT} />
                    <Stop
                      offset="1"
                      stopColor={colors.secondary.DEFAULT}
                      stopOpacity={0.5}
                    />
                  </LinearGradient>
                  <LinearGradient
                    id="outputGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <Stop offset="0" stopColor={colors.primary.DEFAULT} />
                    <Stop
                      offset="1"
                      stopColor={colors.primary.DEFAULT}
                      stopOpacity={0.5}
                    />
                  </LinearGradient>
                </Defs>

                {/* Grid line at bottom */}
                <Line
                  x1={PADDING}
                  y1={CHART_HEIGHT}
                  x2={containerWidth - PADDING}
                  y2={CHART_HEIGHT}
                  stroke={colors.separator}
                  strokeWidth={1}
                />

                {/* Middle reference line (50% of max) */}
                <Line
                  x1={PADDING}
                  y1={CHART_HEIGHT / 2}
                  x2={containerWidth - PADDING}
                  y2={CHART_HEIGHT / 2}
                  stroke={colors.surfaceMuted}
                  strokeWidth={1}
                  strokeDasharray="4,4"
                />

                {/* Bars for each day */}
                {data.map((day, index) => {
                  const groupX = PADDING + index * barGroupWidth;
                  const centerX = groupX + barGroupWidth / 2;

                  const intakeBarX = centerX - barWidth - barGap / 2;
                  const outputBarX = centerX + barGap / 2;

                  const intakeHeight = Math.max(
                    (day.fluidIntake / maxValue) * (CHART_HEIGHT - 8),
                    day.fluidIntake > 0 ? 4 : 0
                  );
                  const intakeY = CHART_HEIGHT - intakeHeight;

                  const outputHeight = Math.max(
                    (day.urinationOutput / maxValue) * (CHART_HEIGHT - 8),
                    day.urinationOutput > 0 ? 4 : 0
                  );
                  const outputY = CHART_HEIGHT - outputHeight;

                  const isToday = index === data.length - 1;

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

                      <Bar
                        x={intakeBarX}
                        y={intakeY}
                        width={barWidth}
                        height={intakeHeight}
                        fill="url(#intakeGradient)"
                        delay={index * 50}
                        chartHeight={CHART_HEIGHT}
                      />

                      <Bar
                        x={outputBarX}
                        y={outputY}
                        width={barWidth}
                        height={outputHeight}
                        fill="url(#outputGradient)"
                        delay={index * 50 + 25}
                        chartHeight={CHART_HEIGHT}
                      />

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
              { backgroundColor: colors.secondary.DEFAULT },
            ]}
          />
          <Text variant="footnote" tone="secondary">
            {t("insights.intake")}
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: colors.primary.DEFAULT },
            ]}
          />
          <Text variant="footnote" tone="secondary">
            {t("insights.output")}
          </Text>
        </View>
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
    padding: spacing.lg,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs,
  },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  centered: {
    textAlign: "center",
  },
  estimateNote: {
    textAlign: "center",
    marginBottom: spacing.lg,
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
    marginTop: spacing.md,
    paddingTop: spacing.md,
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
