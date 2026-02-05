import * as React from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
  useWindowDimensions,
} from "react-native";
import Svg, { Rect, Line, Text as SvgText, G } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { format, isSameDay } from "date-fns";

import { Text } from "@/components/ui/text";
import { colors } from "@/lib/theme/colors";
import { useI18n } from "@/lib/i18n/context";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface DayData {
  date: Date;
  voids: number;
  fluids: number;
  leaks: number;
}

interface WeeklyChartProps {
  data: DayData[];
  onDayPress?: (date: Date) => void;
  voidTarget?: number;
  fluidTarget?: number;
}

// Chart dimensions
const CHART_HEIGHT = 100;
const LABEL_HEIGHT = 20;
const PADDING = 8;

export function WeeklyChart({
  data,
  onDayPress,
  voidTarget = 7,
  fluidTarget = 2000,
}: WeeklyChartProps) {
  const { t } = useI18n();
  const { width: screenWidth } = useWindowDimensions();
  const today = new Date();

  // Calculate responsive dimensions
  const containerWidth = screenWidth - 72; // Account for padding
  const dayCount = data.length;
  const barGroupWidth = (containerWidth - PADDING * 2) / dayCount;
  const barWidth = Math.min((barGroupWidth - 8) / 2, 16); // Max 16px per bar
  const barGap = 2;

  // Calculate max values for scaling
  const maxVoids = Math.max(...data.map((d) => d.voids), voidTarget, 1);
  const maxFluids = Math.max(...data.map((d) => d.fluids), fluidTarget, 1);

  // Scale factor for bars
  const voidScale = (CHART_HEIGHT - 8) / maxVoids;
  const fluidScale = (CHART_HEIGHT - 8) / maxFluids;

  const handleDayPress = React.useCallback(
    (date: Date) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onDayPress?.(date);
    },
    [onDayPress],
  );

  // Get day label (localized short weekday)
  const getDayLabel = (date: Date): string => {
    return format(date, "EEEEE"); // Single letter
  };

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <Svg width={containerWidth} height={CHART_HEIGHT + LABEL_HEIGHT}>
          {/* Grid line at bottom */}
          <Line
            x1={PADDING}
            y1={CHART_HEIGHT}
            x2={containerWidth - PADDING}
            y2={CHART_HEIGHT}
            stroke="#E5E7EB"
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
              day.voids > 0 ? 4 : 0,
            );
            const voidY = CHART_HEIGHT - voidHeight;

            // Fluid bar height
            const fluidHeight = Math.max(
              (day.fluids / fluidTarget) * (CHART_HEIGHT - 8),
              day.fluids > 0 ? 4 : 0,
            );
            const fluidY = CHART_HEIGHT - fluidHeight;

            return (
              <G key={day.date.toISOString()}>
                {/* Today highlight */}
                {isToday ? <Rect
                    x={groupX + 2}
                    y={0}
                    width={barGroupWidth - 4}
                    height={CHART_HEIGHT + LABEL_HEIGHT}
                    fill="#E0FBFC"
                    rx={6}
                  /> : null}

                {/* Void bar (primary color) */}
                <AnimatedBar
                  x={voidBarX}
                  y={voidY}
                  width={barWidth}
                  height={voidHeight}
                  fill={colors.primary.DEFAULT}
                  delay={index * 40}
                  chartHeight={CHART_HEIGHT}
                />

                {/* Fluid bar (secondary color) */}
                <AnimatedBar
                  x={fluidBarX}
                  y={fluidY}
                  width={barWidth}
                  height={fluidHeight}
                  fill={colors.secondary.DEFAULT}
                  delay={index * 40 + 20}
                  chartHeight={CHART_HEIGHT}
                />

                {/* Leak indicator dot */}
                {day.leaks > 0 && (
                  <Rect
                    x={centerX - 3}
                    y={4}
                    width={6}
                    height={6}
                    fill={colors.error}
                    rx={3}
                  />
                )}

                {/* Day label */}
                <SvgText
                  x={centerX}
                  y={CHART_HEIGHT + 14}
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
              { backgroundColor: colors.primary.DEFAULT },
            ]}
          />
          <Text style={styles.legendText}>{t("home.summary.voids")}</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: colors.secondary.DEFAULT },
            ]}
          />
          <Text style={styles.legendText}>{t("home.summary.fluids")}</Text>
        </View>
        {data.some((d) => d.leaks > 0) && (
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: colors.error }]}
            />
            <Text style={styles.legendText}>{t("home.summary.leaks")}</Text>
          </View>
        )}
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
      withTiming(height, { duration: 300, easing: Easing.out(Easing.cubic) }),
    );
    animatedY.value = withDelay(
      delay,
      withTiming(y, { duration: 300, easing: Easing.out(Easing.cubic) }),
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
      rx={3}
      ry={3}
      animatedProps={animatedProps}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
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
    gap: 16,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 11,
    color: "#9CA3AF",
  },
});
