import * as React from 'react';
import { View, Pressable, StyleSheet, Platform, Modal, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameDay,
  isToday,
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameWeek,
} from 'date-fns';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { Text } from '@/components/ui/text';
import { colors } from '@/lib/theme/colors';
import { useI18n } from '@/lib/i18n/context';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 50;
const WEEK_WIDTH = SCREEN_WIDTH - 16;

// Entry categories for each date
export interface DateEntryInfo {
  hasUrination: boolean;
  hasFluid: boolean;
  hasLeak: boolean;
}

interface CalendarHeaderProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  entriesByDate?: Map<string, DateEntryInfo>;
}

export function CalendarHeader({
  selectedDate,
  onSelectDate,
  entriesByDate = new Map(),
}: CalendarHeaderProps) {
  const { t } = useI18n();
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [currentWeekStart, setCurrentWeekStart] = React.useState(() => 
    startOfWeek(selectedDate, { weekStartsOn: 1 })
  );
  // Use selectedDate directly for picker, ensuring it's always valid
  const pickerDate = selectedDate instanceof Date && !isNaN(selectedDate.getTime()) 
    ? selectedDate 
    : new Date();
  
  const translateX = useSharedValue(0);
  const today = new Date();
  const todayWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  
  // Track previous selectedDate to detect external changes
  const prevSelectedDateRef = React.useRef(selectedDate);

  // Sync week view ONLY when selectedDate changes from external navigation
  // Do NOT include currentWeekStart in dependencies - that causes the revert bug
  React.useEffect(() => {
    // Only sync if selectedDate actually changed (external navigation)
    if (prevSelectedDateRef.current.getTime() !== selectedDate.getTime()) {
      const newWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      
      // Only update week view if the new date is in a different week than previous
      if (!isSameWeek(selectedDate, prevSelectedDateRef.current, { weekStartsOn: 1 })) {
        setCurrentWeekStart(newWeekStart);
      }
      prevSelectedDateRef.current = selectedDate;
    }
  }, [selectedDate]);

  // Check if we're viewing the current week
  const isCurrentWeek = isSameWeek(currentWeekStart, todayWeekStart, { weekStartsOn: 1 });

  // Week days for the current week strip
  const weekDays = React.useMemo(() => {
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: currentWeekStart, end: weekEnd });
  }, [currentWeekStart]);

  // Full month calendar for non-iOS fallback
  const monthDays = React.useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [selectedDate]);

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const animateWeekChange = React.useCallback((direction: 'left' | 'right', callback: () => void) => {
    const toValue = direction === 'left' ? -WEEK_WIDTH : WEEK_WIDTH;
    
    translateX.value = withTiming(toValue, { 
      duration: 200, 
      easing: Easing.out(Easing.cubic) 
    }, () => {
      translateX.value = -toValue;
      runOnJS(callback)();
      translateX.value = withTiming(0, { 
        duration: 200, 
        easing: Easing.out(Easing.cubic) 
      });
    });
  }, [translateX]);

  const goToPreviousWeek = React.useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    animateWeekChange('right', () => {
      setCurrentWeekStart((prev) => subWeeks(prev, 1));
    });
  }, [animateWeekChange]);

  const goToNextWeek = React.useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    animateWeekChange('left', () => {
      setCurrentWeekStart((prev) => addWeeks(prev, 1));
    });
  }, [animateWeekChange]);

  const goToToday = React.useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const todayDate = new Date();
    onSelectDate(todayDate);
    setCurrentWeekStart(startOfWeek(todayDate, { weekStartsOn: 1 }));
  }, [onSelectDate]);

  const handleSelectDate = React.useCallback(
    (date: Date) => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onSelectDate(date);
      setCurrentWeekStart(startOfWeek(date, { weekStartsOn: 1 }));
    },
    [onSelectDate]
  );

  const openDatePicker = React.useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowDatePicker(true);
  }, []);

  const handleDatePickerChange = React.useCallback((event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date && event.type !== 'dismissed') {
      handleSelectDate(date);
      if (Platform.OS === 'ios') {
        setShowDatePicker(false);
      }
    }
  }, [handleSelectDate]);

  // Swipe gesture for week navigation
  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10]) // Only activate after 10px horizontal movement
    .failOffsetY([-20, 20]) // Fail if vertical movement exceeds 20px (prevents conflict with scrolling)
    .onUpdate((event) => {
      translateX.value = event.translationX * 0.5;
    })
    .onEnd((event) => {
      // Check both displacement and velocity for better swipe detection (quick flicks)
      const shouldGoToPrevious = (event.translationX > SWIPE_THRESHOLD) || 
        (event.translationX > 20 && event.velocityX > 500);
      const shouldGoToNext = (event.translationX < -SWIPE_THRESHOLD) || 
        (event.translationX < -20 && event.velocityX < -500);
      
      if (shouldGoToPrevious) {
        runOnJS(goToPreviousWeek)();
      } else if (shouldGoToNext) {
        runOnJS(goToNextWeek)();
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const animatedWeekStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Render category dots for a day
  const renderCategoryDots = (dateKey: string) => {
    const info = entriesByDate.get(dateKey);
    if (!info) return <View style={styles.dotsPlaceholder} />;

    const dots: React.ReactNode[] = [];
    if (info.hasUrination) {
      dots.push(
        <View key="u" style={[styles.categoryDot, { backgroundColor: colors.primary.DEFAULT }]} />
      );
    }
    if (info.hasFluid) {
      dots.push(
        <View key="f" style={[styles.categoryDot, { backgroundColor: colors.secondary.DEFAULT }]} />
      );
    }
    if (info.hasLeak) {
      dots.push(
        <View key="l" style={[styles.categoryDot, { backgroundColor: colors.error }]} />
      );
    }

    if (dots.length === 0) return <View style={styles.dotsPlaceholder} />;
    return <View style={styles.dotsRow}>{dots}</View>;
  };

  // Get display month with year
  const displayMonth = React.useMemo(() => {
    const midWeek = weekDays[3];
    return format(midWeek, "MMMM yyyy");
  }, [weekDays]);

  // Check if week spans two months and get month label for each day
  const getMonthLabel = React.useCallback((day: Date, index: number, days: Date[]): string | null => {
    // Show month label on the first day of a new month (when day is 1)
    if (day.getDate() === 1 && index > 0) {
      return format(day, 'MMM');
    }
    return null;
  }, []);

  // Check if a day is in a different month than the first day of the week
  const isDifferentMonth = React.useCallback((day: Date): boolean => {
    return !isSameMonth(day, weekDays[0]);
  }, [weekDays]);

  return (
    <View style={styles.container}>
      {/* Header with Calendar Icon, Month, and Today button */}
      <View style={styles.header}>
        <Pressable 
          onPress={openDatePicker} 
          style={styles.monthSelector}
          hitSlop={8}
        >
          <MaterialCommunityIcons 
            name="calendar-month-outline" 
            size={20} 
            color={colors.primary.DEFAULT} 
          />
          <Text style={styles.monthTitle}>
            {displayMonth}
          </Text>
          <MaterialCommunityIcons 
            name="chevron-down" 
            size={18} 
            color="#9CA3AF" 
          />
        </Pressable>

        {/* Today button - always rendered but with opacity */}
        <Pressable 
          onPress={goToToday} 
          style={[styles.todayButton, { opacity: isCurrentWeek ? 0 : 1 }]} 
          hitSlop={8}
          disabled={isCurrentWeek}
        >
          <Text style={styles.todayText}>{t('history.today')}</Text>
        </Pressable>
      </View>

      {/* Week Strip - Day Labels */}
      <View style={styles.dayLabelsRow}>
        {dayLabels.map((label, index) => (
          <View key={index} style={styles.dayLabelCell}>
            <Text style={styles.dayLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Week Strip - Swipeable Dates */}
      <View style={styles.gestureContainer}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.weekRow, animatedWeekStyle]}>
            {weekDays.map((day, index) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);
              const monthLabel = getMonthLabel(day, index, weekDays);
              const isNewMonth = isDifferentMonth(day);

              return (
                <Pressable
                  key={dateKey}
                  onPress={() => handleSelectDate(day)}
                  style={styles.dayCell}
                >
                  {/* Month label for new month */}
                  {monthLabel ? (
                    <Text style={styles.monthLabel}>{monthLabel}</Text>
                  ) : (
                    <View style={styles.monthLabelPlaceholder} />
                  )}
                  
                  <View style={[
                    styles.dayNumberContainer,
                    isSelected && styles.dayNumberContainerSelected,
                    isTodayDate && !isSelected && styles.dayNumberContainerToday,
                  ]}>
                    <Text style={[
                      styles.dayNumber,
                      isNewMonth && !isSelected && !isTodayDate && styles.dayNumberNewMonth,
                      isSelected && styles.dayNumberSelected,
                      isTodayDate && !isSelected && styles.dayNumberToday,
                    ]}>
                      {format(day, 'd')}
                    </Text>
                  </View>
                  {renderCategoryDots(dateKey)}
                </Pressable>
              );
            })}
          </Animated.View>
        </GestureDetector>
      </View>

      {/* Week indicator line */}
      <View style={styles.weekIndicator} />

      {/* Native Date Picker for iOS */}
      {Platform.OS === 'ios' && showDatePicker ? <Modal
          visible={showDatePicker}
          animationType="fade"
          transparent
          onRequestClose={() => setShowDatePicker(false)}
        >
          <Pressable 
            style={styles.modalOverlay} 
            onPress={() => setShowDatePicker(false)}
          >
            <View style={styles.datePickerCard}>
              <DateTimePicker
                value={pickerDate}
                mode="date"
                display="inline"
                onChange={handleDatePickerChange}
                themeVariant="light"
                style={styles.datePicker}
              />
            </View>
          </Pressable>
        </Modal> : null}

      {/* Native Date Picker for Android */}
      {Platform.OS === 'android' && showDatePicker ? <DateTimePicker
          value={pickerDate}
          mode="date"
          display="default"
          onChange={handleDatePickerChange}
        /> : null}

      {/* Web fallback - custom modal */}
      {Platform.OS === 'web' && showDatePicker ? <Modal
          visible={showDatePicker}
          animationType="fade"
          transparent
          onRequestClose={() => setShowDatePicker(false)}
        >
          <Pressable 
            style={styles.modalOverlay} 
            onPress={() => setShowDatePicker(false)}
          >
            <View style={styles.monthPickerCard}>
              <Text style={styles.pickerMonthTitle}>
                {format(selectedDate, 'MMMM yyyy')}
              </Text>

              <View style={styles.pickerDayLabels}>
                {dayLabels.map((label, index) => (
                  <View key={index} style={styles.pickerDayLabelCell}>
                    <Text style={styles.pickerDayLabel}>{label}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.pickerGrid}>
                {monthDays.map((day) => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const isCurrentMonth = isSameMonth(day, selectedDate);
                  const isSelected = isSameDay(day, selectedDate);
                  const isTodayDate = isToday(day);

                  return (
                    <Pressable
                      key={dateKey}
                      onPress={() => {
                        handleSelectDate(day);
                        setShowDatePicker(false);
                      }}
                      style={[
                        styles.pickerDay,
                        isSelected && styles.pickerDaySelected,
                      ]}
                    >
                      <Text style={[
                        styles.pickerDayText,
                        !isCurrentMonth && styles.pickerDayTextOutside,
                        isSelected && styles.pickerDayTextSelected,
                        isTodayDate && !isSelected && styles.pickerDayTextToday,
                      ]}>
                        {format(day, 'd')}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </Pressable>
        </Modal> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  todayButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  todayText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary.DEFAULT,
  },
  // Day labels row
  dayLabelsRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  dayLabelCell: {
    flex: 1,
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  // Week row
  gestureContainer: {
    overflow: 'hidden',
  },
  weekRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 8,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary.DEFAULT,
    marginBottom: 2,
    height: 12,
  },
  monthLabelPlaceholder: {
    height: 14,
  },
  dayNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberContainerSelected: {
    backgroundColor: colors.primary.DEFAULT,
  },
  dayNumberContainerToday: {
    borderWidth: 1.5,
    borderColor: colors.primary.DEFAULT,
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  dayNumberNewMonth: {
    color: colors.primary.DEFAULT,
  },
  dayNumberSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dayNumberToday: {
    color: colors.primary.DEFAULT,
    fontWeight: '600',
  },
  // Category dots
  dotsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
    height: 4,
  },
  dotsPlaceholder: {
    height: 4,
    marginTop: 4,
  },
  categoryDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  // Week indicator
  weekIndicator: {
    height: 3,
    width: 40,
    backgroundColor: '#E5E7EB',
    borderRadius: 1.5,
    alignSelf: 'center',
    marginBottom: 8,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 24,
          elevation: 8,
        }),
  },
  datePicker: {
    height: 340,
    width: 320,
  },
  monthPickerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: SCREEN_WIDTH - 48,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 24,
          elevation: 8,
        }),
  },
  pickerMonthTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  pickerDayLabels: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  pickerDayLabelCell: {
    flex: 1,
    alignItems: 'center',
  },
  pickerDayLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pickerDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerDaySelected: {
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: 16,
  },
  pickerDayText: {
    fontSize: 14,
    color: '#111827',
  },
  pickerDayTextOutside: {
    color: '#D1D5DB',
  },
  pickerDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  pickerDayTextToday: {
    color: colors.primary.DEFAULT,
    fontWeight: '600',
  },
});
