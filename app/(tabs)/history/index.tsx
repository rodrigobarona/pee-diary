import { isToday, isYesterday } from "date-fns";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as React from "react";
import {
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  UIManager,
  View,
} from "react-native";
import { useShallow } from "zustand/shallow";

import {
  CalendarHeader,
  DailyStatsBar,
  FilterChips,
  TimelineEntry,
  getTimePeriod,
} from "@/components/diary";
import type { DateEntryInfo } from "@/components/diary/calendar-header";
import type { FilterType } from "@/components/diary/filter-chips";
import { useDayCountsLabel } from "@/components/diary/daily-stats-bar";
import { AddEntryFab } from "@/components/add-entry-fab";
import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { Icon, type IconName } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useTabScreenBottomSpace } from "@/hooks/use-tab-screen-bottom-space";
import { a11yLabel, hiddenA11y } from "@/lib/a11y";
import { useI18n } from "@/lib/i18n/context";
import { dateFormatters, numberFormatters } from "@/lib/i18n";
import { useDiaryStore } from "@/lib/store";
import type { DiaryEntry } from "@/lib/store/types";
import { colors } from "@/lib/theme/colors";
import {
  MIN_TOUCH_TARGET,
  iconSize,
  radius,
  spacing,
} from "@/lib/theme/styles";
import { isDayKey, parseDayKey, toDayKey } from "@/lib/utils/day";

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type TimePeriod =
  | "earlyMorning"
  | "morning"
  | "afternoon"
  | "evening"
  | "night";

interface PeriodGroup {
  period: TimePeriod;
  entries: DiaryEntry[];
}

// Time-of-day icons; neutral colours that meet 3:1, no meaning attached
const periodConfig: Record<TimePeriod, { icon: IconName; color: string }> = {
  earlyMorning: { icon: "weather-night", color: colors.indigo.accent },
  morning: { icon: "weather-sunny", color: colors.amber.accent },
  afternoon: { icon: "white-balance-sunny", color: colors.orange.accent },
  evening: { icon: "weather-sunset", color: colors.violet.accent },
  night: { icon: "weather-night", color: colors.indigo.accent },
};

export default function HistoryScreen() {
  const { t } = useI18n();
  const countsLabel = useDayCountsLabel();
  const router = useRouter();
  const bottomSpace = useTabScreenBottomSpace();
  const params = useLocalSearchParams<{
    date?: string;
    filter?: string;
    period?: string;
  }>();

  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [filter, setFilter] = React.useState<FilterType>("all");
  const [expandedPeriods, setExpandedPeriods] = React.useState<Set<TimePeriod>>(
    new Set(["earlyMorning", "morning", "afternoon", "evening", "night"])
  );

  const entries = useDiaryStore(useShallow((state) => state.entries));

  // Toggle period expansion with animation (a disclosure: no haptic)
  const togglePeriod = React.useCallback((period: TimePeriod) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedPeriods((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(period)) {
        newSet.delete(period);
      } else {
        newSet.add(period);
      }
      return newSet;
    });
  }, []);

  // Apply URL params every time screen comes into focus (e.g., navigating from home)
  useFocusEffect(
    React.useCallback(() => {
      if (params.date) {
        if (isDayKey(params.date)) {
          setSelectedDate(parseDayKey(params.date));
        }
      }
      if (params.filter) {
        const validFilters: FilterType[] = [
          "all",
          "urination",
          "fluid",
          "leak",
        ];
        if (validFilters.includes(params.filter as FilterType)) {
          setFilter(params.filter as FilterType);
        }
      } else {
        // Reset filter if not specified
        setFilter("all");
      }
      // If a period param is passed, expand only that period
      if (params.period) {
        const validPeriods: TimePeriod[] = [
          "earlyMorning",
          "morning",
          "afternoon",
          "evening",
          "night",
        ];
        if (validPeriods.includes(params.period as TimePeriod)) {
          setExpandedPeriods(new Set([params.period as TimePeriod]));
        }
      } else {
        // Expand all periods by default
        setExpandedPeriods(
          new Set(["earlyMorning", "morning", "afternoon", "evening", "night"])
        );
      }
    }, [params.date, params.filter, params.period])
  );

  // Navigation handler for entry press
  const handleEntryPress = React.useCallback(
    (id: string) => {
      router.push(`/(modals)/entry/${id}`);
    },
    [router]
  );

  // Handle date selection from calendar
  const handleDateSelect = React.useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  // Compute entries by date with category info (for calendar dots)
  const entriesByDate = React.useMemo(() => {
    const dateMap = new Map<string, DateEntryInfo>();

    entries.forEach((entry) => {
      const dateKey = toDayKey(entry.timestamp);
      const existing = dateMap.get(dateKey) || {
        hasUrination: false,
        hasFluid: false,
        hasLeak: false,
        voids: 0,
        fluidMl: 0,
        leaks: 0,
      };

      if (entry.type === "urination") {
        existing.hasUrination = true;
        existing.voids += 1;
      }
      if (entry.type === "fluid") {
        existing.hasFluid = true;
        existing.fluidMl += entry.amount;
      }
      if (entry.type === "leak") {
        existing.hasLeak = true;
        existing.leaks += 1;
      }

      dateMap.set(dateKey, existing);
    });

    return dateMap;
  }, [entries]);

  // Count entries by type for filter chips (all entries)
  const filterCounts = React.useMemo(
    () => ({
      all: entries.length,
      urination: entries.filter((e) => e.type === "urination").length,
      fluid: entries.filter((e) => e.type === "fluid").length,
      leak: entries.filter((e) => e.type === "leak").length,
    }),
    [entries]
  );

  // Get entries for the selected date only
  const selectedDayData = React.useMemo(() => {
    const dateKey = toDayKey(selectedDate);

    // Get all entries for this day
    const dayEntries = entries.filter(
      (entry) => toDayKey(entry.timestamp) === dateKey
    );

    // Apply type filter
    const filteredDayEntries =
      filter === "all"
        ? dayEntries
        : dayEntries.filter((entry) => entry.type === filter);

    // Sort by time (earliest first)
    const sortedEntries = filteredDayEntries.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
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

    // Order periods chronologically: early morning first, late night last
    const periodOrder: TimePeriod[] = [
      "earlyMorning",
      "morning",
      "afternoon",
      "evening",
      "night",
    ];
    const periods: PeriodGroup[] = periodOrder
      .filter((p) => periodMap.has(p))
      .map((period) => ({
        period,
        entries: periodMap.get(period)!,
      }));

    // Calculate summary from ALL entries for the day (not filtered)
    const voids = dayEntries.filter((e) => e.type === "urination").length;
    const fluids = dayEntries
      .filter((e) => e.type === "fluid")
      .reduce((sum, e) => sum + (e.type === "fluid" ? e.amount : 0), 0);
    const leaks = dayEntries.filter((e) => e.type === "leak").length;

    return {
      hasEntries: filteredDayEntries.length > 0,
      hasAnyEntries: dayEntries.length > 0,
      periods,
      summary: { voids, fluids, leaks },
    };
  }, [selectedDate, entries, filter]);

  // The day, once: "Today", "Yesterday" or "Monday 9 November" (formatted
  // on every render, so a change of language or clock shows at once)
  const fullDate = dateFormatters.weekdayDayMonth.format(selectedDate);
  const dayTitle = isToday(selectedDate)
    ? t("history.today")
    : isYesterday(selectedDate)
      ? t("history.yesterday")
      : fullDate;
  const { summary } = selectedDayData;
  const dayHeaderLabel = a11yLabel(
    dayTitle,
    dayTitle !== fullDate ? fullDate : null,
    selectedDayData.hasAnyEntries
      ? countsLabel(summary.voids, summary.fluids, summary.leaks)
      : null
  );

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

      {/* Day header: one heading that reads the date and the day's counts */}
      <View
        style={styles.dayHeader}
        accessible
        accessibilityRole="header"
        accessibilityLabel={dayHeaderLabel}
      >
        <Text variant="headline" style={styles.dayTitle}>
          {dayTitle}
        </Text>
        {selectedDayData.hasAnyEntries ? (
          <DailyStatsBar
            voids={summary.voids}
            fluids={summary.fluids}
            leaks={summary.leaks}
            hideFromAccessibility
          />
        ) : null}
      </View>

      {/* Day Content - Full height */}
      <View style={styles.contentContainer}>
        {selectedDayData.hasEntries ? (
          /* Entries List */
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: bottomSpace },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {selectedDayData.periods.map((periodGroup) => {
              const isExpanded = expandedPeriods.has(periodGroup.period);
              const config = periodConfig[periodGroup.period];
              const periodName = t(`timePeriod.${periodGroup.period}`);
              const count = periodGroup.entries.length;

              return (
                <View key={periodGroup.period} style={styles.periodSection}>
                  {/* Collapsible period header */}
                  <AnimatedPressable
                    style={styles.periodHeader}
                    onPress={() => togglePeriod(periodGroup.period)}
                    feedback="highlight"
                    highlightColor={colors.highlight}
                    accessibilityRole="button"
                    accessibilityLabel={a11yLabel(
                      periodName,
                      t("a11y.history.entryCount", { count })
                    )}
                    accessibilityState={{ expanded: isExpanded }}
                    testID={`history-period-${periodGroup.period}`}
                  >
                    <View style={styles.periodIconContainer}>
                      <Icon
                        name={config.icon}
                        size={iconSize.sm}
                        color={config.color}
                      />
                    </View>
                    <Text
                      variant="subheadline"
                      tone="secondary"
                      style={styles.periodLabel}
                    >
                      {periodName}
                    </Text>
                    <View style={styles.periodBadge}>
                      <Text
                        variant="caption1"
                        tone="secondary"
                        style={styles.periodBadgeText}
                      >
                        {numberFormatters.decimal.format(count)}
                      </Text>
                    </View>
                    <View style={styles.periodLine} />
                    <Icon
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={iconSize.md}
                      color={colors.textSecondary}
                    />
                  </AnimatedPressable>

                  {/* Entries in this period (collapsible) */}
                  {isExpanded ? (
                    <View style={styles.entriesList}>
                      {periodGroup.entries.map((entry, entryIndex) => (
                        <TimelineEntry
                          key={entry.id}
                          entry={entry}
                          isFirst={entryIndex === 0}
                          isLast={entryIndex === periodGroup.entries.length - 1}
                          onPress={() => handleEntryPress(entry.id)}
                          testID={`entry-${entry.id}`}
                        />
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>
        ) : (
          /* Empty State - Full height centered */
          <View
            style={[styles.emptyState, { paddingBottom: bottomSpace - spacing.xl }]}
          >
            <View style={styles.emptyContent}>
              <Icon
                name="calendar-blank-outline"
                size={64}
                color={colors.textTertiary}
              />
              <Text
                variant="title3"
                tone="secondary"
                style={styles.emptyTitle}
                accessibilityRole="header"
              >
                {t("history.noDataForDay")}
              </Text>
              <Text variant="subheadline" tone="secondary" style={styles.emptySubtitle}>
                {isToday(selectedDate)
                  ? t("history.startTracking")
                  : t("history.noEntriesForDate")}
              </Text>
            </View>

            {/* Handwriting arrow pointing to the add button (visual only:
                the add button has its own name) */}
            <View style={styles.arrowHint} {...hiddenA11y}>
              <Text variant="subheadline" tone="secondary" style={styles.arrowText}>
                {t("history.tapToAdd")}
              </Text>
              <Icon
                name="chevron-double-down"
                size={iconSize.xl}
                color={colors.textSecondary}
              />
            </View>
          </View>
        )}
      </View>
      <AddEntryFab />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  dayHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: spacing.md,
    rowGap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  dayTitle: {
    flexShrink: 1,
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.sm,
  },
  entriesList: {
    paddingHorizontal: spacing.sm,
  },
  // Collapsible time-of-day sections
  periodSection: {
    marginTop: spacing.xs,
  },
  periodHeader: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  periodIconContainer: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  periodLabel: {
    fontWeight: "600",
    flexShrink: 1,
  },
  periodBadge: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
  },
  periodBadgeText: {
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  periodLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginHorizontal: spacing.sm,
  },
  // Empty state - full height with arrow at bottom
  emptyState: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
  },
  emptyContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    marginTop: spacing.lg,
    textAlign: "center",
  },
  emptySubtitle: {
    marginTop: spacing.xs,
    textAlign: "center",
  },
  // Handwriting arrow hint
  // Points down at the "+" in the middle of the tab bar (iOS) or at the
  // floating action button at the bottom end (Android)
  arrowHint: {
    alignItems: Platform.OS === "android" ? "flex-end" : "center",
    paddingBottom: spacing.lg,
  },
  arrowText: {
    fontStyle: "italic",
    marginBottom: spacing.xxs,
  },
});
