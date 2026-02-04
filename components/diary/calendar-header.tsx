import * as React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameDay,
  isToday,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { Text } from '@/components/ui/text';
import { colors } from '@/lib/theme/colors';

// Entry categories for each date
export interface DateEntryInfo {
  hasUrination: boolean;
  hasFluid: boolean;
  hasLeak: boolean;
}

interface CalendarHeaderProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  // Map of date string (yyyy-MM-dd) to entry info per category
  entriesByDate?: Map<string, DateEntryInfo>;
}

export function CalendarHeader({
  selectedDate,
  onSelectDate,
  entriesByDate = new Map(),
}: CalendarHeaderProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [currentWeekStart, setCurrentWeekStart] = React.useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const expandAnimation = useSharedValue(0);

  // Week days for the current week strip
  const weekDays = React.useMemo(() => {
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: currentWeekStart, end: weekEnd });
  }, [currentWeekStart]);

  // Full month days for expanded view
  const monthDays = React.useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [selectedDate]);

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const toggleExpand = React.useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    expandAnimation.value = withTiming(newExpanded ? 1 : 0, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });
  }, [isExpanded, expandAnimation]);

  const goToPreviousWeek = React.useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setCurrentWeekStart((prev) => subWeeks(prev, 1));
  }, []);

  const goToNextWeek = React.useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setCurrentWeekStart((prev) => addWeeks(prev, 1));
  }, []);

  const goToPreviousMonth = React.useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const newDate = subMonths(selectedDate, 1);
    onSelectDate(newDate);
    setCurrentWeekStart(startOfWeek(newDate, { weekStartsOn: 1 }));
  }, [selectedDate, onSelectDate]);

  const goToNextMonth = React.useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const newDate = addMonths(selectedDate, 1);
    onSelectDate(newDate);
    setCurrentWeekStart(startOfWeek(newDate, { weekStartsOn: 1 }));
  }, [selectedDate, onSelectDate]);

  const handleSelectDate = React.useCallback(
    (date: Date) => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onSelectDate(date);
      setCurrentWeekStart(startOfWeek(date, { weekStartsOn: 1 }));
      // Close expanded calendar after selection
      if (isExpanded) {
        setIsExpanded(false);
        expandAnimation.value = withTiming(0, {
          duration: 200,
          easing: Easing.out(Easing.cubic),
        });
      }
    },
    [onSelectDate, isExpanded, expandAnimation]
  );

  // Render category dots for a day
  const renderCategoryDots = (dateKey: string, isSelected: boolean) => {
    const info = entriesByDate.get(dateKey);
    if (!info) return null;

    const dots: React.ReactNode[] = [];
    if (info.hasUrination) {
      dots.push(
        <View 
          key="urination" 
          style={[
            styles.categoryDot, 
            { backgroundColor: isSelected ? 'rgba(255,255,255,0.8)' : colors.primary.DEFAULT }
          ]} 
        />
      );
    }
    if (info.hasFluid) {
      dots.push(
        <View 
          key="fluid" 
          style={[
            styles.categoryDot, 
            { backgroundColor: isSelected ? 'rgba(255,255,255,0.8)' : colors.secondary.DEFAULT }
          ]} 
        />
      );
    }
    if (info.hasLeak) {
      dots.push(
        <View 
          key="leak" 
          style={[
            styles.categoryDot, 
            { backgroundColor: isSelected ? 'rgba(255,255,255,0.8)' : colors.error }
          ]} 
        />
      );
    }

    if (dots.length === 0) return null;

    return <View style={styles.dotsRow}>{dots}</View>;
  };

  const expandedStyle = useAnimatedStyle(() => ({
    maxHeight: expandAnimation.value * 280,
    opacity: expandAnimation.value,
    overflow: 'hidden',
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${expandAnimation.value * 180}deg` }],
  }));

  return (
    <View style={styles.container}>
      {/* Month Header */}
      <View style={styles.monthHeader}>
        <Pressable onPress={goToPreviousMonth} style={styles.monthNavButton}>
          <MaterialCommunityIcons name="chevron-left" size={20} color="#9CA3AF" />
        </Pressable>
        <Text style={styles.monthText}>{format(currentWeekStart, 'MMMM yyyy')}</Text>
        <Pressable onPress={goToNextMonth} style={styles.monthNavButton}>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
        </Pressable>
        <Pressable onPress={toggleExpand} style={styles.expandButton}>
          <Animated.View style={chevronStyle}>
            <MaterialCommunityIcons 
              name="chevron-down" 
              size={16} 
              color={colors.primary.DEFAULT} 
            />
          </Animated.View>
        </Pressable>
      </View>

      {/* Week Strip */}
      <View style={styles.weekStrip}>
        <Pressable onPress={goToPreviousWeek} style={styles.weekNavButton}>
          <MaterialCommunityIcons name="chevron-left" size={16} color="#9CA3AF" />
        </Pressable>
        
        <View style={styles.weekDaysContainer}>
          {weekDays.map((day, index) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const isSelected = isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);

            return (
              <Pressable
                key={dateKey}
                onPress={() => handleSelectDate(day)}
                style={[
                  styles.dayButton,
                  isSelected && styles.dayButtonSelected,
                ]}
              >
                <Text style={[
                  styles.dayLabel,
                  isSelected && styles.dayLabelSelected,
                ]}>
                  {dayLabels[index]}
                </Text>
                <Text style={[
                  styles.dayNumber,
                  isSelected && styles.dayNumberSelected,
                  isTodayDate && !isSelected && styles.dayNumberToday,
                ]}>
                  {format(day, 'd')}
                </Text>
                {renderCategoryDots(dateKey, isSelected)}
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={goToNextWeek} style={styles.weekNavButton}>
          <MaterialCommunityIcons name="chevron-right" size={16} color="#9CA3AF" />
        </Pressable>
      </View>

      {/* Expanded Full Calendar */}
      <Animated.View style={expandedStyle}>
        <View style={styles.fullCalendar}>
          {/* Week Day Headers */}
          <View style={styles.fullCalendarHeader}>
            {dayLabels.map((label, index) => (
              <View key={index} style={styles.fullCalendarHeaderCell}>
                <Text style={styles.fullCalendarHeaderText}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.fullCalendarGrid}>
            {monthDays.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);

              return (
                <Pressable
                  key={dateKey}
                  onPress={() => handleSelectDate(day)}
                  style={[
                    styles.fullCalendarDay,
                    isSelected && styles.fullCalendarDaySelected,
                  ]}
                >
                  <Text style={[
                    styles.fullCalendarDayText,
                    !isCurrentMonth && styles.fullCalendarDayTextOutside,
                    isSelected && styles.fullCalendarDayTextSelected,
                    isTodayDate && !isSelected && styles.fullCalendarDayTextToday,
                  ]}>
                    {format(day, 'd')}
                  </Text>
                  {renderCategoryDots(dateKey, isSelected)}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }),
  },
  // Month header
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
  },
  monthNavButton: {
    padding: 4,
  },
  monthText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  expandButton: {
    padding: 6,
    marginLeft: 4,
  },
  // Week strip
  weekStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingBottom: 10,
  },
  weekNavButton: {
    padding: 6,
  },
  weekDaysContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dayButton: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 10,
    minWidth: 34,
  },
  dayButtonSelected: {
    backgroundColor: colors.primary.DEFAULT,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 1,
  },
  dayLabelSelected: {
    color: 'rgba(255,255,255,0.7)',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  dayNumberSelected: {
    color: '#FFFFFF',
  },
  dayNumberToday: {
    color: colors.primary.DEFAULT,
  },
  // Category dots
  dotsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  categoryDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  // Full calendar (expanded)
  fullCalendar: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 4,
  },
  fullCalendarHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  fullCalendarHeaderCell: {
    flex: 1,
    alignItems: 'center',
  },
  fullCalendarHeaderText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  fullCalendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  fullCalendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullCalendarDaySelected: {
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: 16,
  },
  fullCalendarDayText: {
    fontSize: 13,
    color: '#111827',
  },
  fullCalendarDayTextOutside: {
    color: '#D1D5DB',
  },
  fullCalendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  fullCalendarDayTextToday: {
    color: colors.primary.DEFAULT,
    fontWeight: '600',
  },
});
