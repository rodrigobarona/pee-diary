import * as React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  format,
  parseISO,
  isToday,
  isYesterday,
} from 'date-fns';
import { useShallow } from 'zustand/shallow';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { Text } from '@/components/ui/text';
import {
  CalendarHeader,
  FilterChips,
  TimelineEntry,
  TimePeriodHeader,
  getTimePeriod,
  DailyStatsBar,
} from '@/components/diary';
import type { DateEntryInfo } from '@/components/diary/calendar-header';
import { useDiaryStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n/context';
import type { DiaryEntry } from '@/lib/store/types';
import type { FilterType } from '@/components/diary/filter-chips';

type TimePeriod = 'morning' | 'afternoon' | 'evening' | 'night';

interface PeriodGroup {
  period: TimePeriod;
  entries: DiaryEntry[];
}

export default function HistoryScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [filter, setFilter] = React.useState<FilterType>('all');
  const entries = useDiaryStore(useShallow((state) => state.entries));

  // Navigation handler for entry press
  const handleEntryPress = React.useCallback(
    (id: string) => {
      router.push(`/entry/${id}`);
    },
    [router]
  );

  // Handle date selection from calendar
  const handleDateSelect = React.useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  // Format date with relative labels
  const formatDateHeader = React.useCallback(
    (date: Date): string => {
      if (isToday(date)) return t('history.today');
      if (isYesterday(date)) return t('history.yesterday');
      return format(date, 'EEEE, MMMM d');
    },
    [t]
  );

  // Compute entries by date with category info (for calendar dots)
  const entriesByDate = React.useMemo(() => {
    const dateMap = new Map<string, DateEntryInfo>();
    
    entries.forEach((entry) => {
      const dateKey = format(parseISO(entry.timestamp), 'yyyy-MM-dd');
      const existing = dateMap.get(dateKey) || {
        hasUrination: false,
        hasFluid: false,
        hasLeak: false,
      };
      
      if (entry.type === 'urination') existing.hasUrination = true;
      if (entry.type === 'fluid') existing.hasFluid = true;
      if (entry.type === 'leak') existing.hasLeak = true;
      
      dateMap.set(dateKey, existing);
    });
    
    return dateMap;
  }, [entries]);

  // Count entries by type for filter chips (all entries)
  const filterCounts = React.useMemo(() => ({
    all: entries.length,
    urination: entries.filter((e) => e.type === 'urination').length,
    fluid: entries.filter((e) => e.type === 'fluid').length,
    leak: entries.filter((e) => e.type === 'leak').length,
  }), [entries]);

  // Get entries for the selected date only
  const selectedDayData = React.useMemo(() => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    
    // Get all entries for this day
    const dayEntries = entries.filter(
      (entry) => format(parseISO(entry.timestamp), 'yyyy-MM-dd') === dateKey
    );
    
    // Apply filter
    const filteredDayEntries = filter === 'all' 
      ? dayEntries 
      : dayEntries.filter((entry) => entry.type === filter);
    
    // Sort by time (earliest first)
    const sortedEntries = filteredDayEntries.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Group by time period
    const periodMap = new Map<TimePeriod, DiaryEntry[]>();
    sortedEntries.forEach((entry) => {
      const period = getTimePeriod(entry.timestamp);
      if (!periodMap.has(period)) {
        periodMap.set(period, []);
      }
      periodMap.get(period)!.push(entry);
    });

    // Order periods: morning, afternoon, evening, night
    const periodOrder: TimePeriod[] = ['morning', 'afternoon', 'evening', 'night'];
    const periods: PeriodGroup[] = periodOrder
      .filter(p => periodMap.has(p))
      .map(period => ({
        period,
        entries: periodMap.get(period)!,
      }));

    // Calculate summary from ALL entries for the day (not filtered)
    const voids = dayEntries.filter((e) => e.type === 'urination').length;
    const fluids = dayEntries
      .filter((e) => e.type === 'fluid')
      .reduce((sum, e) => sum + (e.type === 'fluid' ? e.amount : 0), 0);
    const leaks = dayEntries.filter((e) => e.type === 'leak').length;

    return {
      hasEntries: filteredDayEntries.length > 0,
      hasAnyEntries: dayEntries.length > 0,
      periods,
      summary: { voids, fluids, leaks },
    };
  }, [selectedDate, entries, filter]);

  return (
    <View style={styles.container}>
      {/* Calendar Header */}
      <CalendarHeader
        selectedDate={selectedDate}
        onSelectDate={handleDateSelect}
        entriesByDate={entriesByDate}
      />

      {/* Filter Chips */}
      <FilterChips
        selected={filter}
        onSelect={setFilter}
        counts={filterCounts}
      />

      {/* Day Header */}
      <View style={styles.dayHeader}>
        <Text style={styles.dayTitle}>
          {formatDateHeader(selectedDate)}
        </Text>
        <Text style={styles.dayDot}>·</Text>
        <Text style={styles.dayDate}>
          {format(selectedDate, 'MMM d')}
        </Text>
        {selectedDayData.hasAnyEntries ? (
          <>
            <View style={styles.daySpacer} />
            <DailyStatsBar
              voids={selectedDayData.summary.voids}
              fluids={selectedDayData.summary.fluids}
              leaks={selectedDayData.summary.leaks}
              compact
            />
          </>
        ) : null}
      </View>

      {/* Day Content - Full height */}
      <View style={styles.contentContainer}>
        {selectedDayData.hasEntries ? (
          /* Entries List */
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {selectedDayData.periods.map((periodGroup) => (
              <View key={periodGroup.period}>
                {/* Period Header */}
                <TimePeriodHeader 
                  period={periodGroup.period} 
                  count={periodGroup.entries.length} 
                />

                {/* Entries in this period */}
                <View style={styles.entriesList}>
                  {periodGroup.entries.map((entry, entryIndex) => (
                    <TimelineEntry
                      key={entry.id}
                      entry={entry}
                      isFirst={entryIndex === 0}
                      isLast={entryIndex === periodGroup.entries.length - 1}
                      onPress={() => handleEntryPress(entry.id)}
                    />
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        ) : (
          /* Empty State - Full height centered */
          <View style={styles.emptyState}>
            <View style={styles.emptyContent}>
              <MaterialCommunityIcons
                name="calendar-blank-outline"
                size={64}
                color="#D1D5DB"
              />
              <Text style={styles.emptyTitle}>
                {t('history.noDataForDay')}
              </Text>
              <Text style={styles.emptySubtitle}>
                {isToday(selectedDate) 
                  ? t('history.startTracking')
                  : t('history.noEntriesForDate')}
              </Text>
            </View>
            
            {/* Handwriting arrow pointing to add button */}
            <View style={styles.arrowHint}>
              <Text style={styles.arrowText}>{t('history.tapToAdd')}</Text>
              <MaterialCommunityIcons
                name="chevron-double-down"
                size={28}
                color="#9CA3AF"
                style={styles.arrowIcon}
              />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  dayDot: {
    fontSize: 16,
    color: '#D1D5DB',
    marginHorizontal: 8,
  },
  dayDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  daySpacer: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 100,
  },
  entriesList: {
    paddingHorizontal: 8,
  },
  // Empty state - full height with arrow at bottom
  emptyState: {
    flex: 1,
    paddingHorizontal: 32,
  },
  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  // Handwriting arrow hint
  arrowHint: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  arrowText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  arrowIcon: {
    opacity: 0.5,
  },
});
