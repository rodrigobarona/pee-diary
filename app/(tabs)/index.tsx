import * as React from 'react';
import { View } from 'react-native';
import { LegendList } from '@legendapp/list';
import { startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import { useShallow } from 'zustand/shallow';
import { useRouter } from 'expo-router';

import { Text } from '@/components/ui/text';
import { EntryCard, SummaryCard, FABMenu } from '@/components/diary';
import { useDiaryStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n/context';
import { formatDateHeader } from '@/lib/utils/date';
import type { DiaryEntry } from '@/lib/store/types';

// Hoisted keyExtractor - per list-performance-callbacks rule
const keyExtractor = (item: DiaryEntry) => item.id;

// getItemType for heterogeneous list - per list-performance-item-types rule
const getItemType = (item: DiaryEntry) => item.type;

// Estimated sizes per item type - for better scroll performance
const getEstimatedItemSize = (
  _index: number,
  _item: DiaryEntry,
  itemType: string
) => {
  switch (itemType) {
    case 'urination':
      return 80;
    case 'fluid':
      return 80;
    case 'leak':
      return 80;
    default:
      return 80;
  }
};

// Empty state component - receives t function as prop
function EmptyState({ t }: { t: (key: string) => string }) {
  return (
    <View className="flex-1 items-center justify-center py-20 gap-4">
      <Text className="text-6xl">📝</Text>
      <Text className="text-lg font-semibold text-foreground">
        {t('home.noEntries')}
      </Text>
      <Text className="text-sm text-muted-foreground text-center px-8">
        {t('home.addFirst')}
      </Text>
    </View>
  );
}

// Helper to check if entry is from today
const isEntryFromToday = (entry: DiaryEntry) => {
  const today = new Date();
  return isWithinInterval(parseISO(entry.timestamp), {
    start: startOfDay(today),
    end: endOfDay(today),
  });
};

export default function HomeScreen() {
  const { t } = useI18n();
  const router = useRouter();
  
  // Get all entries and compute today's entries in useMemo
  const allEntries = useDiaryStore(useShallow((state) => state.entries));

  // Navigation handler for entry press
  const handleEntryPress = React.useCallback(
    (id: string) => {
      router.push(`/entry/${id}`);
    },
    [router]
  );

  // Render item with navigation - uses useCallback per list-performance-callbacks rule
  const renderItem = React.useCallback(
    ({ item }: { item: DiaryEntry }) => (
      <EntryCard entry={item} onPress={() => handleEntryPress(item.id)} />
    ),
    [handleEntryPress]
  );

  // Filter and sort entries for today
  const sortedEntries = React.useMemo(() => {
    return allEntries
      .filter(isEntryFromToday)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }, [allEntries]);

  // Compute summary from filtered entries
  const summary = React.useMemo(() => {
    const todayEntries = allEntries.filter(isEntryFromToday);
    const voids = todayEntries.filter((e) => e.type === 'urination').length;
    const fluids = todayEntries
      .filter((e) => e.type === 'fluid')
      .reduce((sum, e) => sum + (e.type === 'fluid' ? e.amount : 0), 0);
    const leaks = todayEntries.filter((e) => e.type === 'leak').length;
    return { voids, fluids, leaks };
  }, [allEntries]);

  const today = new Date();
  const dateLabel = formatDateHeader(today);

  return (
    <View className="flex-1 bg-background">
      {/* Summary Cards */}
      <View className="px-4 pt-4 pb-2">
        <Text className="text-sm text-muted-foreground mb-3">{dateLabel}</Text>
        <View className="flex-row gap-3">
          <SummaryCard
            icon="toilet"
            label={t('home.summary.voids')}
            value={summary.voids}
            color="primary"
          />
          <SummaryCard
            icon="cup-water"
            label={t('home.summary.fluids')}
            value={summary.fluids}
            unit="ml"
            color="secondary"
          />
          <SummaryCard
            icon="water-alert"
            label={t('home.summary.leaks')}
            value={summary.leaks}
            color="accent"
          />
        </View>
      </View>

      {/* Timeline */}
      <View className="flex-1 px-4">
        <Text className="text-lg font-semibold text-foreground py-3">
          {t('home.timeline')}
        </Text>
        {sortedEntries.length === 0 ? (
          <EmptyState t={t} />
        ) : (
          <LegendList
            data={sortedEntries}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            getItemType={getItemType}
            estimatedItemSize={80}
            getEstimatedItemSize={getEstimatedItemSize}
            contentContainerStyle={{ paddingBottom: 100, gap: 12 }}
            showsVerticalScrollIndicator={false}
            recycleItems
          />
        )}
      </View>

      {/* FAB Menu */}
      <FABMenu />
    </View>
  );
}
