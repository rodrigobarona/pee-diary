import * as React from 'react';
import { View, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/theme';
import { colors } from '@/lib/theme/colors';

interface CalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  datesWithEntries?: Set<string>;
}

export function Calendar({
  selectedDate,
  onSelectDate,
  datesWithEntries = new Set(),
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(selectedDate);

  const days = React.useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const goToPreviousMonth = React.useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentMonth((prev) => subMonths(prev, 1));
  }, []);

  const goToNextMonth = React.useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentMonth((prev) => addMonths(prev, 1));
  }, []);

  const handleSelectDate = React.useCallback(
    (date: Date) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelectDate(date);
    },
    [onSelectDate]
  );

  return (
    <View className="bg-surface rounded-xl p-4" style={{ borderCurve: 'continuous' }}>
      {/* Month Navigation */}
      <View className="flex-row items-center justify-between mb-4">
        <Pressable onPress={goToPreviousMonth} className="p-2">
          <MaterialCommunityIcons
            name="chevron-left"
            size={24}
            color={colors.text}
          />
        </Pressable>
        <Text className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </Text>
        <Pressable onPress={goToNextMonth} className="p-2">
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={colors.text}
          />
        </Pressable>
      </View>

      {/* Week Day Headers */}
      <View className="flex-row mb-2">
        {weekDays.map((day) => (
          <View key={day} className="flex-1 items-center py-2">
            <Text className="text-xs text-muted-foreground font-medium">
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View className="flex-row flex-wrap">
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const isCurrentMonth =
            day.getMonth() === currentMonth.getMonth();
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          const hasEntries = datesWithEntries.has(dateKey);

          return (
            <Pressable
              key={dateKey}
              onPress={() => handleSelectDate(day)}
              className={cn(
                'w-[14.28%] aspect-square items-center justify-center',
                isSelected && 'bg-primary rounded-full'
              )}
            >
              <Text
                className={cn(
                  'text-sm',
                  !isCurrentMonth && 'text-muted-foreground/50',
                  isCurrentMonth && !isSelected && 'text-foreground',
                  isSelected && 'text-white font-semibold',
                  isTodayDate && !isSelected && 'text-primary font-semibold'
                )}
              >
                {format(day, 'd')}
              </Text>
              {hasEntries && !isSelected ? (
                <View className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
