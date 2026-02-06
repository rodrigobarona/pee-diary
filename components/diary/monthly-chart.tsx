import * as React from 'react';
import { View, StyleSheet, Pressable, Platform, useWindowDimensions } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { format, startOfWeek, endOfWeek, isWithinInterval, isSameWeek } from 'date-fns';

import { Text } from '@/components/ui/text';
import { colors } from '@/lib/theme/colors';
import { useI18n } from '@/lib/i18n/context';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

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
  totalFluids: number;
  totalLeaks: number;
  daysWithData: number;
}

interface MonthlyChartProps {
  data: DayData[];
  onWeekPress?: (weekStart: Date) => void;
  voidTarget?: number;
  fluidTarget?: number;
}

// Chart dimensions
const CHART_HEIGHT = 100;
const LABEL_HEIGHT = 32;
const PADDING = 16;

export function MonthlyChart({ 
  data, 
  onWeekPress, 
  voidTarget = 7,
  fluidTarget = 2000,
}: MonthlyChartProps) {
  const { t } = useI18n();
  const { width: screenWidth } = useWindowDimensions();
  const today = new Date();
  
  // Group data into weeks dynamically (4-5 weeks depending on month)
  const weeklyData = React.useMemo((): WeekData[] => {
    const weeks: WeekData[] = [];
    const seenWeeks = new Set<string>();
    
    // Get all unique weeks from the data
    data.forEach(d => {
      const weekStart = startOfWeek(d.date, { weekStartsOn: 1 });
      const weekKey = weekStart.toISOString();
      
      if (!seenWeeks.has(weekKey)) {
        seenWeeks.add(weekKey);
        const weekEnd = endOfWeek(d.date, { weekStartsOn: 1 });
        
        // Filter data for this week
        const weekDays = data.filter(day => 
          isWithinInterval(day.date, { start: weekStart, end: weekEnd })
        );
        
        const daysWithData = weekDays.filter(day => day.voids > 0 || day.fluids > 0).length;
        const totalVoids = weekDays.reduce((sum, day) => sum + day.voids, 0);
        const totalFluids = weekDays.reduce((sum, day) => sum + day.fluids, 0);
        const totalLeaks = weekDays.reduce((sum, day) => sum + day.leaks, 0);
        
        weeks.push({
          weekStart,
          weekEnd,
          avgVoids: daysWithData > 0 ? totalVoids / daysWithData : 0,
          totalFluids: daysWithData > 0 ? totalFluids / daysWithData : 0,
          totalLeaks,
          daysWithData,
        });
      }
    });
    
    // Sort by week start date
    return weeks.sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());
  }, [data]);
  
  // Calculate responsive dimensions
  const containerWidth = screenWidth - 72;
  const weekCount = weeklyData.length || 1;
  const barGroupWidth = (containerWidth - PADDING * 2) / weekCount;
  const barWidth = Math.min((barGroupWidth - 16) / 2, 24);
  const barGap = 4;
  
  // Calculate max values for scaling
  const maxVoids = Math.max(...weeklyData.map(w => w.avgVoids), voidTarget, 1);
  const maxFluids = Math.max(...weeklyData.map(w => w.totalFluids), fluidTarget, 1);
  
  // Scale factor for bars
  const voidScale = (CHART_HEIGHT - 8) / maxVoids;
  const fluidScale = (CHART_HEIGHT - 8) / maxFluids;
  
  const handleWeekPress = React.useCallback((weekStart: Date) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onWeekPress?.(weekStart);
  }, [onWeekPress]);

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
          
          {/* Bars for each week */}
          {weeklyData.map((week, index) => {
            const groupX = PADDING + index * barGroupWidth;
            const centerX = groupX + barGroupWidth / 2;
            const isCurrentWeek = isSameWeek(week.weekStart, today, { weekStartsOn: 1 });
            
            // Bar positions
            const voidBarX = centerX - barWidth - barGap / 2;
            const fluidBarX = centerX + barGap / 2;
            
            // Void bar height (based on daily average)
            const voidHeight = Math.max(week.avgVoids * voidScale, week.avgVoids > 0 ? 4 : 0);
            const voidY = CHART_HEIGHT - voidHeight;
            
            // Fluid bar height (based on daily average)
            const fluidHeight = Math.max((week.totalFluids / fluidTarget) * (CHART_HEIGHT - 8), week.totalFluids > 0 ? 4 : 0);
            const fluidY = CHART_HEIGHT - fluidHeight;
            
            return (
              <G key={week.weekStart.toISOString()}>
                {/* Current week highlight */}
                {isCurrentWeek ? <Rect
                    x={groupX + 4}
                    y={0}
                    width={barGroupWidth - 8}
                    height={CHART_HEIGHT + LABEL_HEIGHT}
                    fill="#E0FBFC"
                    rx={8}
                  /> : null}
                
                {/* Void bar (primary color) */}
                <AnimatedBar
                  x={voidBarX}
                  y={voidY}
                  width={barWidth}
                  height={voidHeight}
                  fill={colors.primary.DEFAULT}
                  delay={index * 80}
                  chartHeight={CHART_HEIGHT}
                />
                
                {/* Fluid bar (secondary color) */}
                <AnimatedBar
                  x={fluidBarX}
                  y={fluidY}
                  width={barWidth}
                  height={fluidHeight}
                  fill={colors.secondary.DEFAULT}
                  delay={index * 80 + 40}
                  chartHeight={CHART_HEIGHT}
                />
                
                {/* Leak indicator dot */}
                {week.totalLeaks > 0 && (
                  <Rect
                    x={centerX - 4}
                    y={4}
                    width={8}
                    height={8}
                    fill={colors.primary.light} // Design brief: Soft teal, no red for leaks
                    rx={4}
                  />
                )}
                
                {/* Week label */}
                <SvgText
                  x={centerX}
                  y={CHART_HEIGHT + 16}
                  fontSize={10}
                  fontWeight={isCurrentWeek ? '600' : '400'}
                  fill={isCurrentWeek ? colors.primary.DEFAULT : '#9CA3AF'}
                  textAnchor="middle"
                >
                  {isCurrentWeek ? t('insights.thisWeek') : `${format(week.weekStart, 'd')}-${format(week.weekEnd, 'd')}`}
                </SvgText>
                <SvgText
                  x={centerX}
                  y={CHART_HEIGHT + 28}
                  fontSize={9}
                  fontWeight="400"
                  fill="#9CA3AF"
                  textAnchor="middle"
                >
                  {isCurrentWeek ? '' : format(week.weekStart, 'MMM')}
                </SvgText>
              </G>
            );
          })}
        </Svg>
        
        {/* Tap targets overlay */}
        <View style={[styles.tapOverlay, { width: containerWidth }]}>
          {weeklyData.map((week, index) => {
            const groupX = PADDING + index * barGroupWidth;
            return (
              <Pressable
                key={week.weekStart.toISOString()}
                onPress={() => handleWeekPress(week.weekStart)}
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
          <View style={[styles.legendDot, { backgroundColor: colors.primary.DEFAULT }]} />
          <Text style={styles.legendText}>{t('insights.avgVoids')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.secondary.DEFAULT }]} />
          <Text style={styles.legendText}>{t('insights.avgFluids')}</Text>
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

function AnimatedBar({ x, y, width, height, fill, delay, chartHeight }: AnimatedBarProps) {
  const animatedHeight = useSharedValue(0);
  const animatedY = useSharedValue(chartHeight);
  
  React.useEffect(() => {
    animatedHeight.value = withDelay(
      delay,
      withTiming(height, { duration: 400, easing: Easing.out(Easing.cubic) })
    );
    animatedY.value = withDelay(
      delay,
      withTiming(y, { duration: 400, easing: Easing.out(Easing.cubic) })
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
  },
  chartContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  tapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: CHART_HEIGHT + LABEL_HEIGHT,
    flexDirection: 'row',
  },
  tapTarget: {
    position: 'absolute',
    top: 0,
    height: '100%',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#6B7280',
  },
});
