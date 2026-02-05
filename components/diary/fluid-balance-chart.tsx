import * as Haptics from "expo-haptics";
import * as React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Defs,
  G,
  Line,
  LinearGradient,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";

import { Text } from "@/components/ui/text";
import { useI18n } from "@/lib/i18n/context";
import { colors } from "@/lib/theme/colors";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

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
const LABEL_HEIGHT = 24;
const PADDING = 16;

// Estimated volume outputs for when precise ml is not available
export const VOLUME_ESTIMATES = {
  small: 100,
  medium: 250,
  large: 400,
} as const;

export function FluidBalanceChart({
  data,
  onDayPress,
}: FluidBalanceChartProps) {
  const { t } = useI18n();
  const { width: screenWidth } = useWindowDimensions();

  // Calculate responsive dimensions
  const containerWidth = screenWidth - 72;
  const dayCount = data.length;
  const barGroupWidth = (containerWidth - PADDING * 2) / dayCount;
  const barWidth = Math.min((barGroupWidth - 12) / 2, 18);
  const barGap = 4;

  // Calculate max values for scaling
  const maxIntake = Math.max(...data.map((d) => d.fluidIntake), 1);
  const maxOutput = Math.max(...data.map((d) => d.urinationOutput), 1);
  const maxValue = Math.max(maxIntake, maxOutput);

  // Calculate totals
  const totalIntake = data.reduce((sum, d) => sum + d.fluidIntake, 0);
  const totalOutput = data.reduce((sum, d) => sum + d.urinationOutput, 0);

  // Calculate ratio (output/intake) - ideally close to 1
  const ratio = totalIntake > 0 ? totalOutput / totalIntake : 0;
  const ratioPercent = Math.round(ratio * 100);

  // Get ratio status color
  const getRatioColor = () => {
    if (ratio >= 0.7 && ratio <= 1.2) return "#10B981"; // Green - normal
    if (ratio >= 0.5 && ratio <= 1.4) return "#F59E0B"; // Amber - slightly off
    return colors.error; // Red - concerning
  };

  const handleDayPress = React.useCallback(
    (date: Date) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onDayPress?.(date);
    },
    [onDayPress]
  );

  // Get day label
  const getDayLabel = (date: Date): string => {
    return date.toLocaleDateString("en", { weekday: "narrow" });
  };

  return (
    <View style={styles.container}>
      {/* Summary Header */}
      <View style={styles.summaryHeader}>
        <View style={styles.summaryItem}>
          <View
            style={[
              styles.summaryDot,
              { backgroundColor: colors.secondary.DEFAULT },
            ]}
          />
          <Text style={styles.summaryLabel}>{t("insights.fluidIntake")}</Text>
          <Text style={styles.summaryValue}>{totalIntake}ml</Text>
        </View>
        <View style={styles.summaryItem}>
          <View
            style={[
              styles.summaryDot,
              { backgroundColor: colors.primary.DEFAULT },
            ]}
          />
          <Text style={styles.summaryLabel}>
            {t("insights.urinationOutput")}
          </Text>
          <Text style={styles.summaryValue}>{totalOutput}ml</Text>
        </View>
      </View>

      {/* Ratio Indicator */}
      <View style={styles.ratioContainer}>
        <Text style={styles.ratioLabel}>{t("insights.outputRatio")}</Text>
        <View
          style={[
            styles.ratioBadge,
            { backgroundColor: getRatioColor() + "20" },
          ]}
        >
          <Text style={[styles.ratioValue, { color: getRatioColor() }]}>
            {ratioPercent}%
          </Text>
        </View>
        <Text style={styles.ratioHint}>
          {ratio >= 0.7 && ratio <= 1.2
            ? t("insights.ratioNormal")
            : ratio < 0.7
            ? t("insights.ratioLow")
            : t("insights.ratioHigh")}
        </Text>
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <Svg width={containerWidth} height={CHART_HEIGHT + LABEL_HEIGHT}>
          <Defs>
            <LinearGradient id="intakeGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.secondary.DEFAULT} />
              <Stop offset="1" stopColor={colors.secondary.DEFAULT + "80"} />
            </LinearGradient>
            <LinearGradient id="outputGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.primary.DEFAULT} />
              <Stop offset="1" stopColor={colors.primary.DEFAULT + "80"} />
            </LinearGradient>
          </Defs>

          {/* Grid line at bottom */}
          <Line
            x1={PADDING}
            y1={CHART_HEIGHT}
            x2={containerWidth - PADDING}
            y2={CHART_HEIGHT}
            stroke="#E5E7EB"
            strokeWidth={1}
          />

          {/* Middle reference line (50% of max) */}
          <Line
            x1={PADDING}
            y1={CHART_HEIGHT / 2}
            x2={containerWidth - PADDING}
            y2={CHART_HEIGHT / 2}
            stroke="#F3F4F6"
            strokeWidth={1}
            strokeDasharray="4,4"
          />

          {/* Bars for each day */}
          {data.map((day, index) => {
            const groupX = PADDING + index * barGroupWidth;
            const centerX = groupX + barGroupWidth / 2;

            // Bar positions
            const intakeBarX = centerX - barWidth - barGap / 2;
            const outputBarX = centerX + barGap / 2;

            // Intake bar height
            const intakeHeight = Math.max(
              (day.fluidIntake / maxValue) * (CHART_HEIGHT - 8),
              day.fluidIntake > 0 ? 4 : 0
            );
            const intakeY = CHART_HEIGHT - intakeHeight;

            // Output bar height
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
                    width={barGroupWidth - 4}
                    height={CHART_HEIGHT + LABEL_HEIGHT}
                    fill="#E0FBFC"
                    rx={6}
                  />
                ) : null}

                {/* Fluid intake bar */}
                <AnimatedBar
                  x={intakeBarX}
                  y={intakeY}
                  width={barWidth}
                  height={intakeHeight}
                  fill="url(#intakeGradient)"
                  delay={index * 50}
                  chartHeight={CHART_HEIGHT}
                />

                {/* Urination output bar */}
                <AnimatedBar
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
                  y={CHART_HEIGHT + 16}
                  fontSize={11}
                  fontWeight={isToday ? "700" : "500"}
                  fill={isToday ? colors.primary.DEFAULT : "#9CA3AF"}
                  textAnchor="middle"
                >
                  {getDayLabel(day.date)}
                </SvgText>
              </G>
            );
          })}
        </Svg>

        {/* Tap targets overlay */}
        <View style={[styles.tapOverlay, { width: containerWidth }]}>
          {data.map((day, index) => {
            const groupX = PADDING + index * barGroupWidth;
            return (
              <Pressable
                key={day.date.toISOString()}
                onPress={() => handleDayPress(day.date)}
                style={[
                  styles.tapTarget,
                  { left: groupX, width: barGroupWidth },
                ]}
              />
            );
          })}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: colors.secondary.DEFAULT },
            ]}
          />
          <Text style={styles.legendText}>{t("insights.intake")}</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: colors.primary.DEFAULT },
            ]}
          />
          <Text style={styles.legendText}>{t("insights.output")}</Text>
        </View>
      </View>
    </View>
  );
}

// Animated bar component
interface AnimatedBarProps {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  delay: number;
  chartHeight: number;
}

function AnimatedBar({
  x,
  y,
  width,
  height,
  fill,
  delay,
  chartHeight,
}: AnimatedBarProps) {
  const animatedHeight = useSharedValue(0);
  const animatedY = useSharedValue(chartHeight);

  React.useEffect(() => {
    animatedHeight.value = withDelay(
      delay,
      withTiming(height, { duration: 300, easing: Easing.out(Easing.cubic) })
    );
    animatedY.value = withDelay(
      delay,
      withTiming(y, { duration: 300, easing: Easing.out(Easing.cubic) })
    );
  }, [height, y, delay, animatedHeight, animatedY]);

  const animatedProps = useAnimatedProps(() => ({
    height: animatedHeight.value,
    y: animatedY.value,
  }));

  return (
    <AnimatedRect
      x={x}
      width={width}
      fill={fill}
      rx={4}
      ry={4}
      animatedProps={animatedProps}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  summaryItem: {
    alignItems: "center",
    gap: 4,
  },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  ratioContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  ratioLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  ratioBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratioValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  ratioHint: {
    fontSize: 11,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  chartContainer: {
    position: "relative",
    alignItems: "center",
  },
  tapOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    height: CHART_HEIGHT + LABEL_HEIGHT,
    flexDirection: "row",
  },
  tapTarget: {
    position: "absolute",
    top: 0,
    height: "100%",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: "#6B7280",
  },
});
