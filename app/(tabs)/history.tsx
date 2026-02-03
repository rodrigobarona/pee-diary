import * as React from 'react';
import { View, ScrollView } from 'react-native';
import { format, parseISO, startOfDay, endOfDay, isWithinInterval } from 'date-fns';

import { Text } from '@/components/ui/text';
import { Calendar, EntryCard, SummaryCard } from '@/components/diary';
import { useDiaryStore, selectDatesWithEntries } from '@/lib/store';
import { i18n } from '@/lib/i18n';

export default function HistoryScreen() {
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const entries = useDiaryStore((state) => state.entries);
  const datesWithEntries = useDiaryStore(selectDatesWithEntries);

  // Filter entries for selected date
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

  // Calculate summary for selected date
  const summary = React.useMemo(() => {
    const voids = selectedDateEntries.filter(
      (e) => e.type === 'urination'
    ).length;
    const fluids = selectedDateEntries
      .filter((e) => e.type === 'fluid')
      .reduce((sum, e) => sum + (e.type === 'fluid' ? e.amount : 0), 0);
    const leaks = selectedDateEntries.filter((e) => e.type === 'leak').length;
    return { voids, fluids, leaks };
  }, [selectedDateEntries]);

  const dateLabel = format(selectedDate, 'EEEE, MMMM d');

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16, gap: 16 }}
    >
      {/* Calendar */}
      <Calendar
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        datesWithEntries={datesWithEntries}
      />

      {/* Selected Date Summary */}
      <View>
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

      {/* Entries List */}
      <View>
        <Text className="text-lg font-semibold text-foreground mb-3">
          Entries
        </Text>
        {selectedDateEntries.length === 0 ? (
          <View className="items-center py-8">
            <Text className="text-muted-foreground">
              {i18n.t('history.noEntries')}
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {selectedDateEntries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
