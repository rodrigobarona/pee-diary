import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import {
  format,
  isToday,
  isValid,
  isYesterday,
  parse,
  parseISO,
} from "date-fns";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as React from "react";
import {
  LayoutAnimation,
  Platform,
  Pressable,
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
import { Text } from "@/components/ui/text";
import { useI18n } from "@/lib/i18n/context";
import { useDiaryStore } from "@/lib/store";
import type { DiaryEntry } from "@/lib/store/types";

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

export default function HistoryScreen() {
  const { t } = useI18n();
  const router = useRouter();
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

  // Toggle period expansion with animation
  const togglePeriod = React.useCallback((period: TimePeriod) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
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
        const parsed = parse(params.date, "yyyy-MM-dd", new Date());
        if (isValid(parsed)) {
          setSelectedDate(parsed);
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

  // Format date with relative labels
  const formatDateHeader = React.useCallback(
    (date: Date): string => {
      if (isToday(date)) return t("history.today");
      if (isYesterday(date)) return t("history.yesterday");
      return format(date, "EEEE, MMMM d");
    },
    [t]
  );

  // Compute entries by date with category info (for calendar dots)
  const entriesByDate = React.useMemo(() => {
    const dateMap = new Map<string, DateEntryInfo>();

    entries.forEach((entry) => {
      const dateKey = format(parseISO(entry.timestamp), "yyyy-MM-dd");
      const existing = dateMap.get(dateKey) || {
        hasUrination: false,
        hasFluid: false,
        hasLeak: false,
      };

      if (entry.type === "urination") existing.hasUrination = true;
      if (entry.type === "fluid") existing.hasFluid = true;
      if (entry.type === "leak") existing.hasLeak = true;

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
    const dateKey = format(selectedDate, "yyyy-MM-dd");

    // Get all entries for this day
    const dayEntries = entries.filter(
      (entry) => format(parseISO(entry.timestamp), "yyyy-MM-dd") === dateKey
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
        <Text style={styles.dayTitle}>{formatDateHeader(selectedDate)}</Text>
        <Text style={styles.dayDot}>·</Text>
        <Text style={styles.dayDate}>{format(selectedDate, "MMM d")}</Text>
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
            {selectedDayData.periods.map((periodGroup) => {
              const isExpanded = expandedPeriods.has(periodGroup.period);
              const periodConfig = {
                earlyMorning: {
                  icon: "weather-night" as const,
                  color: "#6366F1",
                },
                morning: { icon: "weather-sunny" as const, color: "#F59E0B" },
                afternoon: {
                  icon: "white-balance-sunny" as const,
                  color: "#F97316",
                },
                evening: { icon: "weather-sunset" as const, color: "#8B5CF6" },
                night: { icon: "weather-night" as const, color: "#6366F1" },
              };
              const config = periodConfig[periodGroup.period];

              return (
                <View key={periodGroup.period} style={styles.periodSection}>
                  {/* Collapsible Period Header - Minimal */}
                  <Pressable
                    style={styles.periodHeader}
                    onPress={() => togglePeriod(periodGroup.period)}
                  >
                    <View style={styles.periodIconContainer}>
                      <MaterialCommunityIcons
                        name={config.icon}
                        size={14}
                        color={config.color}
                      />
                    </View>
                    <Text style={styles.periodLabel}>
                      {t(`timePeriod.${periodGroup.period}`)}
                    </Text>
                    <View style={styles.periodBadge}>
                      <Text style={styles.periodBadgeText}>
                        {periodGroup.entries.length}
                      </Text>
                    </View>
                    <View style={styles.periodLine} />
                    <MaterialCommunityIcons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={16}
                      color="#D1D5DB"
                    />
                  </Pressable>

                  {/* Entries in this period (collapsible) */}
                  {isExpanded ? <View style={styles.entriesList}>
                      {periodGroup.entries.map((entry, entryIndex) => (
                        <TimelineEntry
                          key={entry.id}
                          entry={entry}
                          isFirst={entryIndex === 0}
                          isLast={entryIndex === periodGroup.entries.length - 1}
                          onPress={() => handleEntryPress(entry.id)}
                        />
                      ))}
                    </View> : null}
                </View>
              );
            })}
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
              <Text style={styles.emptyTitle}>{t("history.noDataForDay")}</Text>
              <Text style={styles.emptySubtitle}>
                {isToday(selectedDate)
                  ? t("history.startTracking")
                  : t("history.noEntriesForDate")}
              </Text>
            </View>

            {/* Handwriting arrow pointing to add button */}
            <View style={styles.arrowHint}>
              <Text style={styles.arrowText}>{t("history.tapToAdd")}</Text>
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
    backgroundColor: "#F9FAFB",
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  dayDot: {
    fontSize: 16,
    color: "#D1D5DB",
    marginHorizontal: 8,
  },
  dayDate: {
    fontSize: 14,
    color: "#6B7280",
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
  // Accordion period styles (minimal)
  periodSection: {
    marginTop: 8,
  },
  periodHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  periodIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  periodLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  periodBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  periodBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  periodLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
    marginLeft: 12,
    marginRight: 8,
  },
  // Empty state - full height with arrow at bottom
  emptyState: {
    flex: 1,
    paddingHorizontal: 32,
  },
  emptyContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 4,
    textAlign: "center",
  },
  // Handwriting arrow hint
  arrowHint: {
    alignItems: "center",
    paddingBottom: 20,
  },
  arrowText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontStyle: "italic",
    marginBottom: 2,
  },
  arrowIcon: {
    opacity: 0.5,
  },
});
