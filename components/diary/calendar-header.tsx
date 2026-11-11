import * as React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type AccessibilityActionEvent,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isSameWeek,
  isToday,
  startOfMonth,
  startOfWeek,
  subWeeks,
} from 'date-fns';

import { AnimatedPressable } from '@/components/ui/animated-pressable';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useDayCountsLabel } from '@/components/diary/daily-stats-bar';
import { a11yLabel, hiddenA11y } from '@/lib/a11y';
import { haptics } from '@/lib/haptics';
import { dateFormatters, getWeekdayLabels, numberFormatters } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/context';
import { colors } from '@/lib/theme/colors';
import {
  MIN_TOUCH_TARGET,
  iconSize,
  radius,
  ripple,
  rippleBorderless,
  spacing,
} from '@/lib/theme/styles';
import { weekOptions } from '@/lib/utils/date';

const SWIPE_THRESHOLD = 50;

// The day number's circle; grows with the text size
const DAY_CIRCLE = 36;

// Entry categories and counts for each date
export interface DateEntryInfo {
  hasUrination: boolean;
  hasFluid: boolean;
  hasLeak: boolean;
  voids: number;
  fluidMl: number;
  leaks: number;
}

interface CalendarHeaderProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  entriesByDate?: Map<string, DateEntryInfo>;
}

const NO_ENTRIES = new Map<string, DateEntryInfo>();

export function CalendarHeader({
  selectedDate,
  onSelectDate,
  entriesByDate = NO_ENTRIES,
}: CalendarHeaderProps) {
  const { t } = useI18n();
  const countsLabel = useDayCountsLabel();
  const { width: windowWidth } = useWindowDimensions();
  const weekWidth = windowWidth - spacing.lg;
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [currentWeekStart, setCurrentWeekStart] = React.useState(() =>
    startOfWeek(selectedDate, weekOptions())
  );
  // Use selectedDate directly for picker, ensuring it's always valid
  const pickerDate =
    selectedDate instanceof Date && !isNaN(selectedDate.getTime())
      ? selectedDate
      : new Date();

  const translateX = useSharedValue(0);
  const today = new Date();

  // When the selected date changes from outside (Today, a link), show its
  // week; a date picked in this strip already set the week. Adjusting state
  // during render, as React recommends for state that follows a prop.
  const [prevSelectedDate, setPrevSelectedDate] = React.useState(selectedDate);
  if (prevSelectedDate.getTime() !== selectedDate.getTime()) {
    setPrevSelectedDate(selectedDate);
    if (!isSameWeek(selectedDate, prevSelectedDate, weekOptions())) {
      setCurrentWeekStart(startOfWeek(selectedDate, weekOptions()));
    }
  }

  // The week on screen, starting on the device's first weekday (re-read on
  // every render: the user may change it in the system settings)
  const weekStart = startOfWeek(currentWeekStart, weekOptions());
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(weekStart, weekOptions()),
  });
  const isCurrentWeek = isSameWeek(weekStart, today, weekOptions());

  // Full month grid for the web fallback picker
  const monthStart = startOfMonth(selectedDate);
  const monthDays = eachDayOfInterval({
    start: startOfWeek(monthStart, weekOptions()),
    end: endOfWeek(endOfMonth(selectedDate), weekOptions()),
  });

  const dayLabels = getWeekdayLabels();

  const animateWeekChange = React.useCallback(
    (direction: 'left' | 'right', callback: () => void) => {
      const toValue = direction === 'left' ? -weekWidth : weekWidth;

      translateX.set(
        withTiming(
          toValue,
          { duration: 200, easing: Easing.out(Easing.cubic) },
          () => {
            translateX.set(-toValue);
            runOnJS(callback)();
            translateX.set(
              withTiming(0, { duration: 200, easing: Easing.out(Easing.cubic) })
            );
          }
        )
      );
    },
    [translateX, weekWidth]
  );

  // Week changes are navigation: no haptic
  const goToPreviousWeek = React.useCallback(() => {
    animateWeekChange('right', () => {
      setCurrentWeekStart((prev) => subWeeks(prev, 1));
    });
  }, [animateWeekChange]);

  const goToNextWeek = React.useCallback(() => {
    animateWeekChange('left', () => {
      setCurrentWeekStart((prev) => addWeeks(prev, 1));
    });
  }, [animateWeekChange]);

  const handleSelectDate = React.useCallback(
    (date: Date) => {
      if (!isSameDay(date, selectedDate)) {
        haptics.selection();
      }
      onSelectDate(date);
      setCurrentWeekStart(startOfWeek(date, weekOptions()));
    },
    [onSelectDate, selectedDate]
  );

  const goToToday = React.useCallback(() => {
    handleSelectDate(new Date());
  }, [handleSelectDate]);

  const openDatePicker = React.useCallback(() => {
    setShowDatePicker(true);
  }, []);

  const closeDatePicker = React.useCallback(() => {
    setShowDatePicker(false);
  }, []);

  const handleDatePickerChange = React.useCallback(
    (event: { type: string }, date?: Date) => {
      if (Platform.OS === 'android') {
        setShowDatePicker(false);
      }
      if (date && event.type !== 'dismissed') {
        handleSelectDate(date);
        if (Platform.OS === 'ios') {
          setShowDatePicker(false);
        }
      }
    },
    [handleSelectDate]
  );

  // Screen readers cannot swipe the strip: each day offers the previous and
  // next week as actions
  const weekActions = React.useMemo(
    () => [
      { name: 'previousWeek', label: t('a11y.history.previousWeek') },
      { name: 'nextWeek', label: t('a11y.history.nextWeek') },
    ],
    [t]
  );
  const handleWeekAction = React.useCallback(
    (event: AccessibilityActionEvent) => {
      if (event.nativeEvent.actionName === 'previousWeek') goToPreviousWeek();
      else if (event.nativeEvent.actionName === 'nextWeek') goToNextWeek();
    },
    [goToNextWeek, goToPreviousWeek]
  );

  // Swipe gesture for week navigation
  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10]) // Only activate after 10px horizontal movement
    .failOffsetY([-20, 20]) // Fail if vertical movement exceeds 20px (prevents conflict with scrolling)
    .onUpdate((event) => {
      translateX.set(event.translationX * 0.5);
    })
    .onEnd((event) => {
      // Check both displacement and velocity for better swipe detection (quick flicks)
      const shouldGoToPrevious =
        event.translationX > SWIPE_THRESHOLD ||
        (event.translationX > 20 && event.velocityX > 500);
      const shouldGoToNext =
        event.translationX < -SWIPE_THRESHOLD ||
        (event.translationX < -20 && event.velocityX < -500);

      if (shouldGoToPrevious) {
        runOnJS(goToPreviousWeek)();
      } else if (shouldGoToNext) {
        runOnJS(goToNextWeek)();
      } else {
        translateX.set(withSpring(0, { damping: 20, stiffness: 200 }));
      }
    });

  const animatedWeekStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.get() }],
  }));

  // Spoken name of a day: "Wednesday 11 November, Today, 8 bathroom
  // visits, 1780 millilitres" (counts only)
  const dayAccessibilityLabel = (day: Date, dateKey: string) => {
    const info = entriesByDate.get(dateKey);
    return a11yLabel(
      dateFormatters.weekdayDayMonth.format(day),
      isToday(day) ? t('history.today') : null,
      info ? countsLabel(info.voids, info.fluidMl, info.leaks) : null
    );
  };

  // Category dots under a day (the counts are in the day's label)
  const renderCategoryDots = (dateKey: string) => {
    const info = entriesByDate.get(dateKey);
    const dots: React.ReactNode[] = [];
    if (info?.hasUrination) {
      dots.push(
        <View
          key="u"
          style={[styles.categoryDot, { backgroundColor: colors.category.urination.accent }]}
        />
      );
    }
    if (info?.hasFluid) {
      dots.push(
        <View
          key="f"
          style={[styles.categoryDot, { backgroundColor: colors.category.fluid.fill }]}
        />
      );
    }
    if (info?.hasLeak) {
      dots.push(
        <View
          key="l"
          style={[styles.categoryDot, { backgroundColor: colors.category.leak.accent }]}
        />
      );
    }
    return (
      <View style={styles.dotsRow} {...hiddenA11y}>
        {dots}
      </View>
    );
  };

  // Month and year of the week on screen (formatted on every render:
  // dateFormatters is updated in place when the language or the device
  // settings change, and useI18n re-renders this component then)
  const displayMonth = dateFormatters.monthYear.format(weekDays[3]);

  // Short month name on the 1st of a month that starts mid-week
  const getMonthLabel = (day: Date, index: number): string | null =>
    day.getDate() === 1 && index > 0 ? dateFormatters.monthShort.format(day) : null;

  return (
    <View style={styles.container}>
      {/* Month (opens the date picker) and Today */}
      <View style={styles.header}>
        <AnimatedPressable
          onPress={openDatePicker}
          style={styles.monthSelector}
          accessibilityRole="button"
          accessibilityLabel={displayMonth}
          accessibilityHint={t('a11y.history.chooseDateHint')}
          testID="history-month-picker"
        >
          <Icon
            name="calendar-month-outline"
            size={iconSize.md}
            color={colors.primary.DEFAULT}
          />
          <Text variant="headline">{displayMonth}</Text>
          <Icon name="chevron-down" size={iconSize.md} color={colors.textSecondary} />
        </AnimatedPressable>

        {/* Today: kept in the layout but hidden on the current week */}
        <AnimatedPressable
          onPress={goToToday}
          style={[styles.todayButton, isCurrentWeek ? styles.hidden : null]}
          disabled={isCurrentWeek}
          accessibilityRole="button"
          accessibilityLabel={t('history.today')}
          accessibilityHint={t('a11y.history.goToTodayHint')}
          accessibilityElementsHidden={isCurrentWeek}
          importantForAccessibility={isCurrentWeek ? 'no-hide-descendants' : 'auto'}
          testID="history-today"
        >
          <Text variant="subheadline" tone="accent" style={styles.todayText}>
            {t('history.today')}
          </Text>
        </AnimatedPressable>
      </View>

      {/* Weekday initials (each day cell says its weekday in full) */}
      <View style={styles.dayLabelsRow} {...hiddenA11y}>
        {dayLabels.map((label, index) => (
          <View key={index} style={styles.dayLabelCell}>
            <Text variant="caption1" tone="secondary" style={styles.dayLabel}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      {/* Week strip: swipe for the previous or next week */}
      <View style={styles.gestureContainer}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.weekRow, animatedWeekStyle]}>
            {weekDays.map((day, index) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);
              const monthLabel = getMonthLabel(day, index);
              const isOtherMonth = !isSameMonth(day, weekDays[0]);

              return (
                <Pressable
                  key={dateKey}
                  onPress={() => handleSelectDate(day)}
                  style={styles.dayCell}
                  android_ripple={rippleBorderless(MIN_TOUCH_TARGET)}
                  accessibilityRole="button"
                  accessibilityLabel={dayAccessibilityLabel(day, dateKey)}
                  accessibilityState={{ selected: isSelected }}
                  accessibilityActions={weekActions}
                  onAccessibilityAction={handleWeekAction}
                  testID={`history-day-${dateKey}`}
                >
                  {/* Month name on the 1st when the week spans two months
                      (a blank line otherwise keeps the rows aligned) */}
                  <Text variant="caption2" tone="accent" style={styles.monthLabel}>
                    {monthLabel ?? ' '}
                  </Text>

                  <View
                    style={[
                      styles.dayCircle,
                      isSelected
                        ? styles.dayCircleSelected
                        : isTodayDate
                          ? styles.dayCircleToday
                          : null,
                    ]}
                  >
                    <Text
                      variant="callout"
                      style={[
                        styles.dayNumber,
                        isSelected
                          ? styles.dayNumberSelected
                          : isTodayDate
                            ? styles.dayNumberToday
                            : isOtherMonth
                              ? styles.dayNumberOtherMonth
                              : null,
                      ]}
                    >
                      {numberFormatters.decimal.format(day.getDate())}
                    </Text>
                  </View>
                  {renderCategoryDots(dateKey)}
                </Pressable>
              );
            })}
          </Animated.View>
        </GestureDetector>
      </View>

      {/* iOS: the system inline calendar in a centred card */}
      {Platform.OS === 'ios' && showDatePicker ? (
        <Modal
          visible={showDatePicker}
          animationType="fade"
          transparent
          onRequestClose={closeDatePicker}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={closeDatePicker}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          >
            <View
              style={styles.datePickerCard}
              accessibilityViewIsModal
              onAccessibilityEscape={closeDatePicker}
            >
              <DateTimePicker
                value={pickerDate}
                mode="date"
                display="inline"
                onChange={handleDatePickerChange}
                themeVariant="light"
                accentColor={colors.primary.DEFAULT}
                style={styles.datePicker}
              />
            </View>
          </Pressable>
        </Modal>
      ) : null}

      {/* Android: the Material 3 date picker */}
      {Platform.OS === 'android' && showDatePicker ? (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          design="material"
          title={t('time.date')}
          onChange={handleDatePickerChange}
        />
      ) : null}

      {/* Web fallback: a month grid */}
      {Platform.OS === 'web' && showDatePicker ? (
        <Modal
          visible={showDatePicker}
          animationType="fade"
          transparent
          onRequestClose={closeDatePicker}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={closeDatePicker}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          >
            <View style={[styles.monthPickerCard, { width: windowWidth - 48 }]}>
              <Text
                variant="headline"
                style={styles.pickerMonthTitle}
                accessibilityRole="header"
              >
                {dateFormatters.monthYear.format(selectedDate)}
              </Text>

              <View style={styles.pickerDayLabels} {...hiddenA11y}>
                {dayLabels.map((label, index) => (
                  <View key={index} style={styles.pickerDayLabelCell}>
                    <Text variant="caption1" tone="secondary" style={styles.dayLabel}>
                      {label}
                    </Text>
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
                        closeDatePicker();
                      }}
                      style={styles.pickerDay}
                      android_ripple={ripple}
                      accessibilityRole="button"
                      accessibilityLabel={dayAccessibilityLabel(day, dateKey)}
                      accessibilityState={{ selected: isSelected }}
                    >
                      <View
                        style={[
                          styles.dayCircle,
                          isSelected ? styles.dayCircleSelected : null,
                        ]}
                      >
                        <Text
                          variant="subheadline"
                          style={[
                            styles.dayNumber,
                            !isCurrentMonth ? styles.dayNumberOutside : null,
                            isTodayDate && !isSelected ? styles.dayNumberToday : null,
                            isSelected ? styles.dayNumberSelected : null,
                          ]}
                        >
                          {numberFormatters.decimal.format(day.getDate())}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    overflow: 'hidden',
    flexShrink: 1,
  },
  todayButton: {
    minHeight: MIN_TOUCH_TARGET,
    minWidth: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  hidden: {
    opacity: 0,
  },
  todayText: {
    fontWeight: '600',
  },
  // Day labels row
  dayLabelsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
  },
  dayLabelCell: {
    flex: 1,
    alignItems: 'center',
  },
  dayLabel: {
    fontWeight: '500',
  },
  // Week row
  gestureContainer: {
    overflow: 'hidden',
  },
  weekRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET,
    paddingBottom: spacing.xs,
  },
  monthLabel: {
    fontWeight: '600',
  },
  // A circle that stays a circle on Android: the background and border are
  // always set (transparent when unselected), only their colours change
  dayCircle: {
    minWidth: DAY_CIRCLE,
    minHeight: DAY_CIRCLE,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.DEFAULT,
  },
  dayCircleToday: {
    borderColor: colors.primary.DEFAULT,
  },
  dayNumber: {
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  dayNumberOtherMonth: {
    color: colors.primary.DEFAULT,
  },
  dayNumberOutside: {
    color: colors.textTertiary,
  },
  dayNumberSelected: {
    color: colors.onPrimary,
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
    marginTop: spacing.xs,
    height: 4,
  },
  categoryDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    padding: spacing.lg,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
  },
  datePicker: {
    height: 340,
    width: 320,
  },
  monthPickerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
  },
  pickerMonthTitle: {
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  pickerDayLabels: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  pickerDayLabelCell: {
    flex: 1,
    alignItems: 'center',
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pickerDay: {
    width: '14.28%',
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
