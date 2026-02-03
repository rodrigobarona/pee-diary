import * as React from 'react';
import { View } from 'react-native';
import { LegendList } from '@legendapp/list';
import { format } from 'date-fns';

import { Text } from '@/components/ui/text';
import { EntryCard, SummaryCard, FABMenu } from '@/components/diary';
import { useDiaryStore, selectTodayEntries, selectTodaySummary } from '@/lib/store';
import { i18n } from '@/lib/i18n';
import type { DiaryEntry } from '@/lib/store/types';

// Hoisted renderItem function - per list-performance-callbacks rule
const renderItem = ({ item }: { item: DiaryEntry }) => (
  <EntryCard entry={item} />
);

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

// Empty state component
function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center py-20 gap-4">
      <Text className="text-6xl">📝</Text>
      <Text className="text-lg font-semibold text-foreground">
        {i18n.t('home.noEntries')}
      </Text>
      <Text className="text-sm text-muted-foreground text-center px-8">
        {i18n.t('home.addFirst')}
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  // Zustand selectors - granular subscriptions
  const entries = useDiaryStore(selectTodayEntries);
  const summary = useDiaryStore(selectTodaySummary);

  // Sort entries by timestamp descending (most recent first)
  const sortedEntries = React.useMemo(
    () =>
      [...entries].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    [entries]
  );

  const today = new Date();
  const dateLabel = format(today, 'EEEE, MMMM d');

  return (
    <View className="flex-1 bg-background">
      {/* Summary Cards */}
      <View className="px-4 pt-4 pb-2">
        <Text className="text-sm text-muted-foreground mb-3">{dateLabel}</Text>
        <View className="flex-row gap-3">
          <SummaryCard
            icon="toilet"
            label={i18n.t('home.summary.voids')}
            value={summary.voids}
            color="primary"
          />
          <SummaryCard
            icon="cup-water"
            label={i18n.t('home.summary.fluids')}
            value={summary.fluids}
            unit="ml"
            color="secondary"
          />
          <SummaryCard
            icon="water-alert"
            label={i18n.t('home.summary.leaks')}
            value={summary.leaks}
            color="accent"
          />
        </View>
      </View>

      {/* Timeline */}
      <View className="flex-1 px-4">
        <Text className="text-lg font-semibold text-foreground py-3">
          Timeline
        </Text>
        {sortedEntries.length === 0 ? (
          <EmptyState />
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
