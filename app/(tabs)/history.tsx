import * as React from 'react';
import { View, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import {
  format,
  parseISO,
  startOfDay,
  endOfDay,
  isWithinInterval,
  isToday,
  isYesterday,
} from 'date-fns';
import { useShallow } from 'zustand/shallow';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { Text } from '@/components/ui/text';
import { Calendar, EntryCard, SummaryCard } from '@/components/diary';
import { useDiaryStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/theme';
import type { DiaryEntry } from '@/lib/store/types';

type ViewMode = 'list' | 'calendar';

interface DayGroup {
  date: Date;
  dateKey: string;
  entries: DiaryEntry[];
  summary: {
    voids: number;
    fluids: number;
    leaks: number;
    avgUrgency: number | null;
  };
}

export default function HistoryScreen() {
  const { t } = useI18n();
  const [viewMode, setViewMode] = React.useState<ViewMode>('list');
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const entries = useDiaryStore(useShallow((state) => state.entries));

  // Format date with relative labels
  const formatDateHeader = React.useCallback(
    (date: Date): string => {
      if (isToday(date)) return t('history.today');
      if (isYesterday(date)) return t('history.yesterday');
      return format(date, 'EEEE, MMMM d');
    },
    [t]
  );

  // Compute dates with entries
  const datesWithEntries = React.useMemo(() => {
    const dates = new Set<string>();
    entries.forEach((entry) => {
      dates.add(format(parseISO(entry.timestamp), 'yyyy-MM-dd'));
    });
    return dates;
  }, [entries]);

  // Group entries by day for list view
  const dayGroups = React.useMemo((): DayGroup[] => {
    const groups = new Map<string, DiaryEntry[]>();

    // Group entries by date
    entries.forEach((entry) => {
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

        // Calculate summary
        const voids = sortedEntries.filter((e) => e.type === 'urination').length;
        const fluids = sortedEntries
          .filter((e) => e.type === 'fluid')
          .reduce((sum, e) => sum + (e.type === 'fluid' ? e.amount : 0), 0);
        const leaks = sortedEntries.filter((e) => e.type === 'leak').length;

        // Calculate average urgency from urination and leak entries
        const urgencyEntries = sortedEntries.filter(
          (e) => e.type === 'urination' || e.type === 'leak'
        );
        const avgUrgency =
          urgencyEntries.length > 0
            ? urgencyEntries.reduce(
                (sum, e) =>
                  sum + (e.type === 'urination' || e.type === 'leak' ? e.urgency : 0),
                0
              ) / urgencyEntries.length
            : null;

        return {
          date,
          dateKey,
          entries: sortedEntries,
          summary: { voids, fluids, leaks, avgUrgency },
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [entries]);

  // Filter entries for selected date (calendar view)
  const selectedDateEntries = React.useMemo(() => {
    return entries
      .filter((entry) =>
        isWithinInterval(parseISO(entry.timestamp), {
          start: startOfDay(selectedDate),
          end: endOfDay(selectedDate),
        })
      )
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }, [entries, selectedDate]);

  // Summary for selected date
  const selectedSummary = React.useMemo(() => {
    const voids = selectedDateEntries.filter((e) => e.type === 'urination').length;
    const fluids = selectedDateEntries
      .filter((e) => e.type === 'fluid')
      .reduce((sum, e) => sum + (e.type === 'fluid' ? e.amount : 0), 0);
    const leaks = selectedDateEntries.filter((e) => e.type === 'leak').length;
    return { voids, fluids, leaks };
  }, [selectedDateEntries]);

  return (
    <View className="flex-1 bg-background">
      {/* View Toggle */}
      <View style={styles.toggleContainer}>
        <Pressable
          onPress={() => setViewMode('list')}
          style={[
            styles.toggleButton,
            viewMode === 'list' && styles.toggleButtonActive,
          ]}
        >
          <MaterialCommunityIcons
            name="format-list-bulleted"
            size={20}
            color={viewMode === 'list' ? '#FFFFFF' : '#6B7280'}
          />
          <Text
            className={cn(
              'font-medium ml-2',
              viewMode === 'list' ? 'text-white' : 'text-muted-foreground'
            )}
          >
            {t('history.list')}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setViewMode('calendar')}
          style={[
            styles.toggleButton,
            viewMode === 'calendar' && styles.toggleButtonActive,
          ]}
        >
          <MaterialCommunityIcons
            name="calendar-month"
            size={20}
            color={viewMode === 'calendar' ? '#FFFFFF' : '#6B7280'}
          />
          <Text
            className={cn(
              'font-medium ml-2',
              viewMode === 'calendar' ? 'text-white' : 'text-muted-foreground'
            )}
          >
            {t('history.calendar')}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
      >
        {viewMode === 'list' ? (
          /* List View - Grouped by Day */
          <View className="gap-6">
            {dayGroups.length === 0 ? (
              <View className="items-center py-16">
                <MaterialCommunityIcons
                  name="clipboard-text-outline"
                  size={64}
                  color="#D1D5DB"
                />
                <Text className="text-lg font-medium text-muted-foreground mt-4">
                  {t('history.noEntriesYet')}
                </Text>
                <Text className="text-sm text-muted-foreground mt-1">
                  {t('history.startTracking')}
                </Text>
              </View>
            ) : (
              dayGroups.map((group) => (
                <View key={group.dateKey}>
                  {/* Day Header */}
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-lg font-semibold text-foreground">
                      {formatDateHeader(group.date)}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      {format(group.date, 'MMM d, yyyy')}
                    </Text>
                  </View>

                  {/* Day Summary Stats */}
                  <View style={styles.daySummary}>
                    <View style={styles.statItem}>
                      <MaterialCommunityIcons
                        name="toilet"
                        size={18}
                        color="#006D77"
                      />
                      <Text className="text-sm font-semibold text-foreground ml-1">
                        {group.summary.voids}
                      </Text>
                      <Text className="text-xs text-muted-foreground ml-1">
                        {t('history.voids')}
                      </Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <MaterialCommunityIcons
                        name="cup-water"
                        size={18}
                        color="#E29578"
                      />
                      <Text className="text-sm font-semibold text-foreground ml-1">
                        {group.summary.fluids}
                      </Text>
                      <Text className="text-xs text-muted-foreground ml-1">
                        ml
                      </Text>
                    </View>
                    {group.summary.leaks > 0 ? (
                      <>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                          <MaterialCommunityIcons
                            name="water-alert"
                            size={18}
                            color="#EF4444"
                          />
                          <Text className="text-sm font-semibold text-foreground ml-1">
                            {group.summary.leaks}
                          </Text>
                          <Text className="text-xs text-muted-foreground ml-1">
                            {t('history.leaks')}
                          </Text>
                        </View>
                      </>
                    ) : null}
                    {group.summary.avgUrgency !== null ? (
                      <>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                          <MaterialCommunityIcons
                            name="speedometer"
                            size={18}
                            color="#F59E0B"
                          />
                          <Text className="text-sm font-semibold text-foreground ml-1">
                            {group.summary.avgUrgency.toFixed(1)}
                          </Text>
                          <Text className="text-xs text-muted-foreground ml-1">
                            {t('history.avgUrgency')}
                          </Text>
                        </View>
                      </>
                    ) : null}
                  </View>

                  {/* Day Entries */}
                  <View className="gap-2 mt-3">
                    {group.entries.map((entry) => (
                      <EntryCard key={entry.id} entry={entry} />
                    ))}
                  </View>
                </View>
              ))
            )}
          </View>
        ) : (
          /* Calendar View */
          <View className="gap-4">
            <Calendar
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              datesWithEntries={datesWithEntries}
            />

            {/* Selected Date Info */}
            <View>
              <Text className="text-lg font-semibold text-foreground mb-3">
                {formatDateHeader(selectedDate)}
              </Text>

              {/* Summary Cards */}
              <View className="flex-row gap-3 mb-4">
                <SummaryCard
                  icon="toilet"
                  label={t('home.summary.voids')}
                  value={selectedSummary.voids}
                  color="primary"
                />
                <SummaryCard
                  icon="cup-water"
                  label={t('home.summary.fluids')}
                  value={selectedSummary.fluids}
                  unit="ml"
                  color="secondary"
                />
                <SummaryCard
                  icon="water-alert"
                  label={t('home.summary.leaks')}
                  value={selectedSummary.leaks}
                  color="accent"
                />
              </View>

              {/* Entries */}
              {selectedDateEntries.length === 0 ? (
                <View className="items-center py-8 bg-surface rounded-xl">
                  <MaterialCommunityIcons
                    name="calendar-blank"
                    size={40}
                    color="#D1D5DB"
                  />
                  <Text className="text-muted-foreground mt-2">
                    {t('history.noEntries')}
                  </Text>
                </View>
              ) : (
                <View className="gap-2">
                  {selectedDateEntries.map((entry) => (
                    <EntryCard key={entry.id} entry={entry} />
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  toggleButtonActive: {
    backgroundColor: '#006D77',
  },
  daySummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        }),
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
});
