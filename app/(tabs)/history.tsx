import * as React from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import {
  format,
  parseISO,
  isToday,
  isYesterday,
  isSameDay,
  eachDayOfInterval,
  subDays,
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
import { colors } from '@/lib/theme/colors';

type TimePeriod = 'morning' | 'afternoon' | 'evening' | 'night';

interface PeriodGroup {
  period: TimePeriod;
  entries: DiaryEntry[];
}

interface DayGroup {
  date: Date;
  dateKey: string;
  hasEntries: boolean;
  periods: PeriodGroup[];
  summary: {
    voids: number;
    fluids: number;
    leaks: number;
  };
}

export default function HistoryScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const dayGroupRefs = React.useRef<Map<string, number>>(new Map());
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

  // Handle date selection from calendar - scroll to that date
  const handleDateSelect = React.useCallback((date: Date) => {
    setSelectedDate(date);
    
    // Small delay to ensure layout is calculated
    setTimeout(() => {
      const dateKey = format(date, 'yyyy-MM-dd');
      const yPosition = dayGroupRefs.current.get(dateKey);
      if (yPosition !== undefined) {
        scrollViewRef.current?.scrollTo({ y: yPosition, animated: true });
      }
    }, 100);
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

  // Compute entries by date with category info
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

  // Filter entries by type
  const filteredEntries = React.useMemo(() => {
    if (filter === 'all') return entries;
    return entries.filter((entry) => entry.type === filter);
  }, [entries, filter]);

  // Count entries by type for filter chips
  const filterCounts = React.useMemo(() => ({
    all: entries.length,
    urination: entries.filter((e) => e.type === 'urination').length,
    fluid: entries.filter((e) => e.type === 'fluid').length,
    leak: entries.filter((e) => e.type === 'leak').length,
  }), [entries]);

  // Build continuous timeline with all days (with and without entries)
  // Order: oldest at top, newest at bottom (scroll down = go to future/today)
  const dayGroups = React.useMemo((): DayGroup[] => {
    // Get date range: from oldest entry to today (or last 7 days if no entries)
    const today = new Date();
    let startDate = subDays(today, 7);
    
    if (entries.length > 0) {
      const oldestEntry = entries.reduce((oldest, entry) => {
        const entryDate = parseISO(entry.timestamp);
        return entryDate < oldest ? entryDate : oldest;
      }, today);
      startDate = oldestEntry < startDate ? oldestEntry : startDate;
    }

    // Generate all days in range
    const allDays = eachDayOfInterval({ start: startDate, end: today });
    
    // Group filtered entries by date
    const entriesByDateKey = new Map<string, DiaryEntry[]>();
    filteredEntries.forEach((entry) => {
      const dateKey = format(parseISO(entry.timestamp), 'yyyy-MM-dd');
      if (!entriesByDateKey.has(dateKey)) {
        entriesByDateKey.set(dateKey, []);
      }
      entriesByDateKey.get(dateKey)!.push(entry);
    });

    // Build day groups for each day
    return allDays
      .map((date) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        const dayEntries = entriesByDateKey.get(dateKey) || [];
        const hasEntries = dayEntries.length > 0;
        
        // Sort entries by time (earliest first - ascending)
        const sortedEntries = dayEntries.sort(
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

        // Order periods: morning, afternoon, evening, night (ascending time)
        const periodOrder: TimePeriod[] = ['morning', 'afternoon', 'evening', 'night'];
        const periods: PeriodGroup[] = periodOrder
          .filter(p => periodMap.has(p))
          .map(period => ({
            period,
            entries: periodMap.get(period)!,
          }));

        // Calculate summary from ALL entries for the day (not filtered)
        const allDayEntries = entries.filter(
          (e) => format(parseISO(e.timestamp), 'yyyy-MM-dd') === dateKey
        );
        const voids = allDayEntries.filter((e) => e.type === 'urination').length;
        const fluids = allDayEntries
          .filter((e) => e.type === 'fluid')
          .reduce((sum, e) => sum + (e.type === 'fluid' ? e.amount : 0), 0);
        const leaks = allDayEntries.filter((e) => e.type === 'leak').length;

        return {
          date,
          dateKey,
          hasEntries,
          periods,
          summary: { voids, fluids, leaks },
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime()); // Oldest first (past at top)
  }, [filteredEntries, entries]);

  // Handle add entry for empty day
  const handleAddEntry = React.useCallback(() => {
    router.push('/add-menu');
  }, [router]);

  // Check if we have any entries at all
  const hasAnyEntries = entries.length > 0;

  // Auto-scroll to today on mount
  React.useEffect(() => {
    if (hasAnyEntries) {
      // Small delay to ensure layout is ready
      const timer = setTimeout(() => {
        const todayKey = format(new Date(), 'yyyy-MM-dd');
        const yPosition = dayGroupRefs.current.get(todayKey);
        if (yPosition !== undefined) {
          scrollViewRef.current?.scrollTo({ y: yPosition, animated: false });
        } else {
          // If today not found, scroll to end (most recent)
          scrollViewRef.current?.scrollToEnd({ animated: false });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [hasAnyEntries]);

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

      {/* Timeline List */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!hasAnyEntries ? (
          /* Global Empty State - No entries at all */
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="clipboard-text-outline"
              size={64}
              color="#D1D5DB"
            />
            <Text style={styles.emptyTitle}>
              {t('history.noEntriesYet')}
            </Text>
            <Text style={styles.emptySubtitle}>
              {t('history.startTracking')}
            </Text>
            <Pressable onPress={handleAddEntry} style={styles.addButton}>
              <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
              <Text style={styles.addButtonText}>{t('add.title')}</Text>
            </Pressable>
          </View>
        ) : (
          /* Continuous Timeline */
          <View style={styles.timeline}>
            {dayGroups.map((group) => {
              const isSelected = isSameDay(group.date, selectedDate);
              
              return (
                <View 
                  key={group.dateKey}
                  style={[styles.dayGroup, isSelected && styles.dayGroupSelected]}
                  onLayout={(event) => {
                    const { y } = event.nativeEvent.layout;
                    dayGroupRefs.current.set(group.dateKey, y);
                  }}
                >
                  {/* Day Header - All on one line */}
                  <View style={styles.dayHeader}>
                    <Text style={[styles.dayTitle, isSelected ? styles.dayTitleSelected : undefined]}>
                      {formatDateHeader(group.date)}
                    </Text>
                    <Text style={styles.dayDot}>·</Text>
                    <Text style={styles.dayDate}>
                      {format(group.date, 'MMM d')}
                    </Text>
                    {group.hasEntries ? (
                      <>
                        <View style={styles.daySpacer} />
                        <DailyStatsBar
                          voids={group.summary.voids}
                          fluids={group.summary.fluids}
                          leaks={group.summary.leaks}
                          compact
                        />
                      </>
                    ) : null}
                  </View>

                  {/* Day Content */}
                  {group.hasEntries ? (
                    /* Time Period Groups */
                    group.periods.map((periodGroup) => (
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
                    ))
                  ) : (
                    /* Empty Day - Compact indicator */
                    <View style={styles.emptyDay}>
                      <View style={styles.emptyDayLine} />
                      <Text style={styles.emptyDayText}>{t('history.noDataForDay')}</Text>
                      <View style={styles.emptyDayLine} />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Timeline
  timeline: {
    paddingTop: 8,
  },
  // Day group
  dayGroup: {
    marginBottom: 4,
  },
  dayGroupSelected: {
    backgroundColor: 'rgba(0, 109, 119, 0.03)',
    borderRadius: 12,
    marginHorizontal: 8,
    paddingBottom: 8,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  dayTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  dayTitleSelected: {
    color: colors.primary.DEFAULT,
  },
  dayDot: {
    fontSize: 14,
    color: '#D1D5DB',
    marginHorizontal: 6,
  },
  dayDate: {
    fontSize: 13,
    color: '#6B7280',
  },
  daySpacer: {
    flex: 1,
  },
  entriesList: {
    paddingHorizontal: 8,
  },
  // Empty day
  emptyDay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  emptyDayLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  emptyDayText: {
    fontSize: 12,
    color: '#D1D5DB',
  },
});
