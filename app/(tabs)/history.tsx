import * as React from 'react';
import { View, ScrollView, StyleSheet, Platform } from 'react-native';
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
  DailyStatsBar,
} from '@/components/diary';
import type { DateEntryInfo } from '@/components/diary/calendar-header';
import { useDiaryStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n/context';
import type { DiaryEntry } from '@/lib/store/types';
import type { FilterType } from '@/components/diary/filter-chips';

interface DayGroup {
  date: Date;
  dateKey: string;
  entries: DiaryEntry[];
  summary: {
    voids: number;
    fluids: number;
    leaks: number;
  };
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

  // Group filtered entries by day
  const dayGroups = React.useMemo((): DayGroup[] => {
    const groups = new Map<string, DiaryEntry[]>();

    // Group entries by date
    filteredEntries.forEach((entry) => {
      const dateKey = format(parseISO(entry.timestamp), 'yyyy-MM-dd');
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(entry);
    });

    // Convert to array and sort by date (most recent first)
    return Array.from(groups.entries())
      .map(([dateKey, dayEntries]) => {
        const date = parseISO(dateKey);
        const sortedEntries = dayEntries.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

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
          entries: sortedEntries,
          summary: { voids, fluids, leaks },
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [filteredEntries, entries]);

  return (
    <View style={styles.container}>
      {/* Collapsible Calendar Header */}
      <CalendarHeader
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
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
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {dayGroups.length === 0 ? (
          /* Empty State */
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
          </View>
        ) : (
          /* Day Groups with Timeline */
          dayGroups.map((group) => (
            <View key={group.dateKey} style={styles.dayGroup}>
              {/* Day Header */}
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>
                  {formatDateHeader(group.date)}
                </Text>
                <Text style={styles.dayDate}>
                  {format(group.date, 'MMM d')}
                </Text>
              </View>

              {/* Daily Stats Bar */}
              <DailyStatsBar
                voids={group.summary.voids}
                fluids={group.summary.fluids}
                leaks={group.summary.leaks}
              />

              {/* Timeline Entries */}
              <View style={styles.entriesList}>
                {group.entries.map((entry, index) => (
                  <TimelineEntry
                    key={entry.id}
                    entry={entry}
                    isLast={index === group.entries.length - 1}
                    onPress={() => handleEntryPress(entry.id)}
                  />
                ))}
              </View>
            </View>
          ))
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
  // Day group
  dayGroup: {
    marginBottom: 16,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dayTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  dayDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  entriesList: {
    paddingLeft: 16,
  },
});
