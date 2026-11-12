import { eachDayOfInterval, getHours, parseISO, subDays } from "date-fns";
import { useRouter } from "expo-router";
import * as React from "react";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useShallow } from "zustand/shallow";

import {
  FluidBalanceChart,
  InsightCard,
  MonthlyChart,
  ProgressBar,
  StreakBadge,
  TimeGroupSummary,
  type TimePeriod,
  VOLUME_ESTIMATES,
  WeeklyChart,
} from "@/components/diary";
import { AddEntryFab } from "@/components/add-entry-fab";
import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useTabScreenBottomSpace } from "@/hooks/use-tab-screen-bottom-space";
import { useTodayKey } from "@/hooks/use-today-key";
import { tabA11y, tabListA11y } from "@/lib/a11y";
import { haptics } from "@/lib/haptics";
import { formatHourRange, numberFormatters } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/context";
import { useDiaryStore } from "@/lib/store";
import type { DiaryEntry } from "@/lib/store/types";
import { colors } from "@/lib/theme/colors";
import {
  cardStyle,
  hitSlopFor,
  iconSize,
  MIN_TOUCH_TARGET,
  radius,
  SCREEN_MARGIN,
  spacing,
} from "@/lib/theme/styles";
import { formatDateHeader } from "@/lib/utils/date";
import { groupByDay, parseDayKey, toDayKey } from "@/lib/utils/day";

const NO_ENTRIES: DiaryEntry[] = [];

// Days whose fluids reached the target that applied on that day (days
// without a target do not count)
const countTargetDays = (
  days: readonly { date: Date; fluids: number }[],
  goalsForDate: (dayKey: string) => { fluidTarget: number | null }
): number =>
  days.filter((day) => {
    const target = goalsForDate(toDayKey(day.date)).fluidTarget;
    return target !== null && day.fluids >= target;
  }).length;

// Helper to check if an entry is between 21:00 and 05:00, for the count of
// bathroom visits logged in that time window
const isNighttimeEntry = (entry: DiaryEntry): boolean => {
  const hour = getHours(parseISO(entry.timestamp));
  // Nighttime: 9pm (21:00) to 5am
  return hour >= 21 || hour < 5;
};

// Get greeting based on time of day. In Portugal and Spain "boa tarde" /
// "buenas tardes" lasts until about 20:00.
const getGreeting = (t: (key: string) => string, locale: string): string => {
  const hour = getHours(new Date());
  const eveningStarts = locale === "en" ? 18 : 20;
  if (hour >= 5 && hour < 12) return t("greeting.morning");
  if (hour >= 12 && hour < eveningStarts) return t("greeting.afternoon");
  return t("greeting.evening");
};

export default function HomeScreen() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { fontScale } = useWindowDimensions();
  const bottomSpace = useTabScreenBottomSpace();

  // Refs for scroll handling
  const scrollViewRef = React.useRef<ScrollView>(null);
  const insightsSectionY = React.useRef<number>(0);

  // Insights period toggle
  const [insightsPeriod, setInsightsPeriod] = React.useState<"week" | "month">(
    "week"
  );

  // Get all entries and goals
  const allEntries = useDiaryStore(useShallow((state) => state.entries));
  const goals = useDiaryStore((state) => state.goals);
  // Changes with the goals, so the insight cards recompute
  const goalHistory = useDiaryStore(useShallow((state) => state.goalHistory));
  const getGoalsForDate = React.useCallback(
    (dayKey: string) => {
      void goals;
      void goalHistory;
      return useDiaryStore.getState().getGoalsForDate(dayKey);
    },
    [goals, goalHistory]
  );
  const streak = useDiaryStore((state) => state.streak);
  const refreshStreak = useDiaryStore((state) => state.refreshStreak);

  // Today's local day; moves on at midnight and when the app comes back to
  // the foreground on a new day
  const todayKey = useTodayKey();
  const today = React.useMemo(() => parseDayKey(todayKey), [todayKey]);

  // Refresh streak on mount and when the day changes
  React.useEffect(() => {
    refreshStreak();
  }, [refreshStreak, todayKey]);

  // Entries by local calendar day, worked out once per change of entries
  const entriesByDay = React.useMemo(
    () => groupByDay(allEntries),
    [allEntries]
  );
  const getDayEntries = React.useCallback(
    (day: Date) => entriesByDay.get(toDayKey(day)) ?? NO_ENTRIES,
    [entriesByDay]
  );

  // Entries for today
  const todayEntries = entriesByDay.get(todayKey) ?? NO_ENTRIES;

  // Compute summary from filtered entries
  const summary = React.useMemo(() => {
    const voids = todayEntries.filter((e) => e.type === "urination").length;
    const fluids = todayEntries
      .filter((e) => e.type === "fluid")
      .reduce((sum, e) => sum + (e.type === "fluid" ? e.amount : 0), 0);
    const leaks = todayEntries.filter((e) => e.type === "leak").length;
    return { voids, fluids, leaks };
  }, [todayEntries]);

  // Progress against the user's own fluid target, if they set one
  const fluidTarget = goals.fluidTarget;
  const fluidProgress =
    fluidTarget !== null && fluidTarget > 0 ? summary.fluids / fluidTarget : 0;

  const dateLabel = formatDateHeader(today);
  const greeting = getGreeting(t, locale);

  // Compute weekly chart data (last 7 days)
  const weeklyData = React.useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(today, 6),
      end: today,
    });

    return days.map((day) => {
      const dayEntries = getDayEntries(day);

      const voids = dayEntries.filter((e) => e.type === "urination").length;
      const fluids = dayEntries
        .filter((e) => e.type === "fluid")
        .reduce((sum, e) => sum + (e.type === "fluid" ? e.amount : 0), 0);
      const leaks = dayEntries.filter((e) => e.type === "leak").length;

      return { date: day, voids, fluids, leaks };
    });
  }, [getDayEntries, today]);

  // Compute fluid balance data (last 7 days)
  const fluidBalanceData = React.useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(today, 6),
      end: today,
    });

    return days.map((day) => {
      const dayEntries = getDayEntries(day);

      // Fluid intake
      const fluidIntake = dayEntries
        .filter((e) => e.type === "fluid")
        .reduce((sum, e) => sum + (e.type === "fluid" ? e.amount : 0), 0);

      // Urination output (use precise volumeMl if available, otherwise estimate)
      const urinationOutput = dayEntries
        .filter((e) => e.type === "urination")
        .reduce((sum, e) => {
          if (e.type === "urination") {
            // Use precise measurement if available, otherwise estimate from volume size
            return sum + (e.volumeMl ?? VOLUME_ESTIMATES[e.volume]);
          }
          return sum;
        }, 0);

      return { date: day, fluidIntake, urinationOutput };
    });
  }, [getDayEntries, today]);

  // Compute weekly stats for insight cards
  const weeklyStats = React.useMemo(() => {
    // This week (last 7 days)
    const thisWeekDays = weeklyData;
    const daysWithEntries = thisWeekDays.filter(
      (d) => d.voids > 0 || d.fluids > 0
    );

    // Last week (7-14 days ago)
    const lastWeekStart = subDays(today, 13);
    const lastWeekEnd = subDays(today, 7);
    const lastWeekDays = eachDayOfInterval({
      start: lastWeekStart,
      end: lastWeekEnd,
    });

    const lastWeekData = lastWeekDays.map((day) => {
      const dayEntries = getDayEntries(day);

      const voids = dayEntries.filter((e) => e.type === "urination").length;
      const fluids = dayEntries
        .filter((e) => e.type === "fluid")
        .reduce((sum, e) => sum + (e.type === "fluid" ? e.amount : 0), 0);

      return { voids, fluids };
    });

    // Calculate averages
    const thisWeekAvgVoids =
      daysWithEntries.length > 0
        ? thisWeekDays.reduce((sum, d) => sum + d.voids, 0) /
          daysWithEntries.length
        : 0;
    const thisWeekAvgFluids =
      daysWithEntries.length > 0
        ? thisWeekDays.reduce((sum, d) => sum + d.fluids, 0) /
          daysWithEntries.length
        : 0;

    const lastWeekDaysWithEntries = lastWeekData.filter(
      (d) => d.voids > 0 || d.fluids > 0
    );
    const lastWeekAvgVoids =
      lastWeekDaysWithEntries.length > 0
        ? lastWeekData.reduce((sum, d) => sum + d.voids, 0) /
          lastWeekDaysWithEntries.length
        : 0;
    const lastWeekAvgFluids =
      lastWeekDaysWithEntries.length > 0
        ? lastWeekData.reduce((sum, d) => sum + d.fluids, 0) /
          lastWeekDaysWithEntries.length
        : 0;

    // Days on which the fluid target that applied that day was reached
    const fluidGoalDays = countTargetDays(thisWeekDays, getGoalsForDate);

    // Count bathroom visits logged between 21:00 and 05:00 this week
    const weekEntries = eachDayOfInterval({
      start: subDays(today, 6),
      end: today,
    }).flatMap(getDayEntries);
    const nightVoidsTotal = weekEntries.filter(
      (e) => e.type === "urination" && isNighttimeEntry(e)
    ).length;
    const avgNightVoids =
      daysWithEntries.length > 0 ? nightVoidsTotal / daysWithEntries.length : 0;

    // Trends
    const voidTrend: "up" | "down" | "stable" =
      thisWeekAvgVoids > lastWeekAvgVoids
        ? "up"
        : thisWeekAvgVoids < lastWeekAvgVoids
        ? "down"
        : "stable";
    const fluidTrend: "up" | "down" | "stable" =
      thisWeekAvgFluids > lastWeekAvgFluids
        ? "up"
        : thisWeekAvgFluids < lastWeekAvgFluids
        ? "down"
        : "stable";

    const voidDiff = Math.abs(
      Math.round((thisWeekAvgVoids - lastWeekAvgVoids) * 10) / 10
    );
    const fluidDiff = Math.abs(
      Math.round(thisWeekAvgFluids - lastWeekAvgFluids)
    );

    // No earlier data: nothing to compare with, so no trend
    const hasPrevious = lastWeekDaysWithEntries.length > 0;
    const vs = t("insights.vsLastWeek");

    return {
      avgVoids: Math.round(thisWeekAvgVoids * 10) / 10,
      avgFluids: Math.round(thisWeekAvgFluids),
      fluidGoalDays,
      totalDays: 7,
      voidTrend: hasPrevious ? voidTrend : undefined,
      fluidTrend: hasPrevious ? fluidTrend : undefined,
      voidDiff:
        hasPrevious && voidDiff > 0
          ? `${numberFormatters.decimal.format(voidDiff)} ${vs}`
          : undefined,
      fluidDiff:
        hasPrevious && fluidDiff > 0
          ? `${numberFormatters.decimal.format(fluidDiff)} ml ${vs}`
          : undefined,
      nightVoidsTotal,
      avgNightVoids: Math.round(avgNightVoids * 10) / 10,
    };
  }, [weeklyData, getDayEntries, today, getGoalsForDate, t]);

  // Compute monthly chart data (last 30 days)
  const monthlyData = React.useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(today, 29),
      end: today,
    });

    return days.map((day) => {
      const dayEntries = getDayEntries(day);

      const voids = dayEntries.filter((e) => e.type === "urination").length;
      const fluids = dayEntries
        .filter((e) => e.type === "fluid")
        .reduce((sum, e) => sum + (e.type === "fluid" ? e.amount : 0), 0);
      const leaks = dayEntries.filter((e) => e.type === "leak").length;

      return { date: day, voids, fluids, leaks };
    });
  }, [getDayEntries, today]);

  // Compute monthly stats for insight cards
  const monthlyStats = React.useMemo(() => {
    const thisMonthDays = monthlyData;
    const daysWithEntries = thisMonthDays.filter(
      (d) => d.voids > 0 || d.fluids > 0
    );

    // Previous month (30-60 days ago)
    const lastMonthStart = subDays(today, 59);
    const lastMonthEnd = subDays(today, 30);
    const lastMonthDays = eachDayOfInterval({
      start: lastMonthStart,
      end: lastMonthEnd,
    });

    const lastMonthData = lastMonthDays.map((day) => {
      const dayEntries = getDayEntries(day);

      const voids = dayEntries.filter((e) => e.type === "urination").length;
      const fluids = dayEntries
        .filter((e) => e.type === "fluid")
        .reduce((sum, e) => sum + (e.type === "fluid" ? e.amount : 0), 0);

      return { voids, fluids };
    });

    // Calculate averages
    const thisMonthAvgVoids =
      daysWithEntries.length > 0
        ? thisMonthDays.reduce((sum, d) => sum + d.voids, 0) /
          daysWithEntries.length
        : 0;
    const thisMonthAvgFluids =
      daysWithEntries.length > 0
        ? thisMonthDays.reduce((sum, d) => sum + d.fluids, 0) /
          daysWithEntries.length
        : 0;

    const lastMonthDaysWithEntries = lastMonthData.filter(
      (d) => d.voids > 0 || d.fluids > 0
    );
    const lastMonthAvgVoids =
      lastMonthDaysWithEntries.length > 0
        ? lastMonthData.reduce((sum, d) => sum + d.voids, 0) /
          lastMonthDaysWithEntries.length
        : 0;
    const lastMonthAvgFluids =
      lastMonthDaysWithEntries.length > 0
        ? lastMonthData.reduce((sum, d) => sum + d.fluids, 0) /
          lastMonthDaysWithEntries.length
        : 0;

    // Days on which the fluid target that applied that day was reached
    const fluidGoalDays = countTargetDays(thisMonthDays, getGoalsForDate);

    // Count bathroom visits logged between 21:00 and 05:00 this month
    const monthEntries = eachDayOfInterval({
      start: subDays(today, 29),
      end: today,
    }).flatMap(getDayEntries);
    const nightVoidsTotal = monthEntries.filter(
      (e) => e.type === "urination" && isNighttimeEntry(e)
    ).length;
    const avgNightVoids =
      daysWithEntries.length > 0 ? nightVoidsTotal / daysWithEntries.length : 0;

    // Trends
    const voidTrend: "up" | "down" | "stable" =
      thisMonthAvgVoids > lastMonthAvgVoids
        ? "up"
        : thisMonthAvgVoids < lastMonthAvgVoids
        ? "down"
        : "stable";
    const fluidTrend: "up" | "down" | "stable" =
      thisMonthAvgFluids > lastMonthAvgFluids
        ? "up"
        : thisMonthAvgFluids < lastMonthAvgFluids
        ? "down"
        : "stable";

    const voidDiff = Math.abs(
      Math.round((thisMonthAvgVoids - lastMonthAvgVoids) * 10) / 10
    );
    const fluidDiff = Math.abs(
      Math.round(thisMonthAvgFluids - lastMonthAvgFluids)
    );

    // No earlier data: nothing to compare with, so no trend
    const hasPrevious = lastMonthDaysWithEntries.length > 0;
    const vs = t("insights.vsLastMonth");

    return {
      avgVoids: Math.round(thisMonthAvgVoids * 10) / 10,
      avgFluids: Math.round(thisMonthAvgFluids),
      fluidGoalDays,
      totalDays: 30,
      voidTrend: hasPrevious ? voidTrend : undefined,
      fluidTrend: hasPrevious ? fluidTrend : undefined,
      voidDiff:
        hasPrevious && voidDiff > 0
          ? `${numberFormatters.decimal.format(voidDiff)} ${vs}`
          : undefined,
      fluidDiff:
        hasPrevious && fluidDiff > 0
          ? `${numberFormatters.decimal.format(fluidDiff)} ml ${vs}`
          : undefined,
      nightVoidsTotal,
      avgNightVoids: Math.round(avgNightVoids * 10) / 10,
    };
  }, [monthlyData, getDayEntries, today, getGoalsForDate, t]);

  // Get current period stats based on toggle
  const currentStats = insightsPeriod === "week" ? weeklyStats : monthlyStats;

  // Handle stat card press - show action sheet with options (navigation:
  // no haptic)
  const handleStatPress = React.useCallback(
    (type: "urination" | "fluid" | "leak") => {
      const todayStr = todayKey;

      const options = [
        t("home.viewInHistory"),
        t("home.addNew"),
        t("common.cancel"),
      ];

      if (Platform.OS === "ios") {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options,
            cancelButtonIndex: 2,
            title: t(`entry.${type}`),
          },
          (buttonIndex) => {
            if (buttonIndex === 0) {
              // View in history - navigate to history with today's date AND filter
              router.push(`/(tabs)/history?date=${todayStr}&filter=${type}`);
            } else if (buttonIndex === 1) {
              // Add new entry
              router.push(`/(modals)/add/${type}`);
            }
          }
        );
      } else {
        // Android/Web - use Alert as action sheet
        Alert.alert(t(`entry.${type}`), "", [
          {
            text: t("home.viewInHistory"),
            onPress: () =>
              router.push(`/(tabs)/history?date=${todayStr}&filter=${type}`),
          },
          {
            text: t("home.addNew"),
            onPress: () => router.push(`/add/${type}`),
          },
          { text: t("common.cancel"), style: "cancel" },
        ]);
      }
    },
    [router, t, todayKey]
  );

  // Open the daily goals sheet
  const handleEditGoals = React.useCallback(() => {
    router.push("/(formSheets)/goals");
  }, [router]);

  // Navigate to export screen
  const handleExportData = React.useCallback(() => {
    router.push("/(formSheets)/export");
  }, [router]);

  // Handle time period press - navigate to history with period filter
  const handlePeriodPress = React.useCallback(
    (period: TimePeriod) => {
      router.push(`/(tabs)/history?date=${todayKey}&period=${period}`);
    },
    [router, todayKey]
  );

  // Handle streak badge press - scroll to insights section
  const handleStreakPress = React.useCallback(() => {
    scrollViewRef.current?.scrollTo({
      y: insightsSectionY.current - 20,
      animated: true,
    });
  }, []);

  // Handle day press in weekly chart
  const handleDayPress = React.useCallback(
    (date: Date) => {
      const dateStr = toDayKey(date);
      router.push(`/(tabs)/history?date=${dateStr}`);
    },
    [router]
  );

  // Week/Month segmented control: a selection change
  const handlePeriodChange = React.useCallback(
    (period: "week" | "month") => {
      if (period === insightsPeriod) return;
      haptics.selection();
      setInsightsPeriod(period);
    },
    [insightsPeriod]
  );

  // At large text sizes the three summary cards stack instead of squeezing
  const stackCards = fontScale > 1.3;

  return (
    <>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomSpace },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        testID="today-scroll"
      >
        {/* Greeting and date under the "Today" title: secondary lines, not a
            second title */}
        <View style={styles.header}>
          <View
            style={styles.headerText}
            accessible
            accessibilityLabel={`${greeting} ${dateLabel}`}
          >
            <Text variant="subheadline" tone="secondary">
              {greeting}
            </Text>
            <Text variant="headline">{dateLabel}</Text>
          </View>
          <StreakBadge
            streak={streak.currentStreak}
            onPress={handleStreakPress}
          />
        </View>

        {/* Empty state, near the top where it is seen */}
        {todayEntries.length === 0 ? (
          <View style={styles.emptyHint}>
            <Text variant="headline" style={styles.centered}>
              {t("home.noEntries")}
            </Text>
            <Text variant="subheadline" tone="secondary" style={styles.centered}>
              {t("home.addFirst")}
            </Text>
          </View>
        ) : null}

        {/* Progress Section */}
        <View style={styles.progressSection}>
          {/* Fluids, against the user's own target */}
          <ProgressBar
            progress={fluidProgress}
            value={summary.fluids}
            target={fluidTarget ?? 0}
            unit="ml"
            label={t("home.summary.fluids")}
            icon="cup-water"
            color={colors.category.fluid.accent}
            iconBackground={colors.category.fluid.container}
            fillColor={colors.category.fluid.fill}
            onPress={() => handleStatPress("fluid")}
            accessibilityLabel={
              fluidTarget !== null
                ? t("a11y.today.statWithTarget", {
                    label: t("home.summary.fluids"),
                    value: summary.fluids,
                    target: fluidTarget,
                  })
                : t("a11y.today.statFluids", {
                    label: t("home.summary.fluids"),
                    value: summary.fluids,
                  })
            }
            accessibilityHint={t("a11y.today.statHint")}
          />

          {/* Voids - no target and no bar, only the count */}
          <ProgressBar
            progress={0}
            value={summary.voids}
            target={0}
            label={t("home.summary.voids")}
            icon="toilet"
            color={colors.category.urination.accent}
            iconBackground={colors.category.urination.container}
            onPress={() => handleStatPress("urination")}
            accessibilityHint={t("a11y.today.statHint")}
          />

          {/* Leaks - no target and no bar, only the count; the category
              colour marks the icon, the count stays neutral */}
          <ProgressBar
            progress={0}
            value={summary.leaks}
            target={0}
            label={t("home.summary.leaks")}
            icon="water-alert"
            color={colors.category.leak.accent}
            valueColor={colors.text}
            iconBackground={colors.category.leak.container}
            onPress={() => handleStatPress("leak")}
            successLabel={t("home.noLeaks")}
            accessibilityHint={t("a11y.today.statHint")}
          />

          {/* Edit Goals Link */}
          <AnimatedPressable
            onPress={handleEditGoals}
            style={styles.link}
            accessibilityRole="button"
            accessibilityLabel={
              fluidTarget === null ? t("home.setTarget") : t("home.editGoals")
            }
          >
            <Icon
              name={fluidTarget === null ? "flag-outline" : "cog-outline"}
              size={iconSize.sm}
              color={colors.primary.DEFAULT}
            />
            <Text variant="subheadline" tone="accent">
              {fluidTarget === null ? t("home.setTarget") : t("home.editGoals")}
            </Text>
          </AnimatedPressable>
        </View>

        {/* Time Period Summary */}
        <View style={styles.section}>
          <Text
            variant="headline"
            accessibilityRole="header"
            style={styles.sectionTitle}
          >
            {t("home.todayActivity")}
          </Text>
          <TimeGroupSummary
            entries={todayEntries}
            onPeriodPress={handlePeriodPress}
          />
        </View>

        {/* Insights Section */}
        <View
          style={styles.section}
          onLayout={(e) => {
            insightsSectionY.current = e.nativeEvent.layout.y;
          }}
        >
          {/* Header with period toggle */}
          <View style={styles.insightsHeader}>
            <Text variant="headline" accessibilityRole="header">
              {t("insights.title")}
            </Text>
            <View
              style={styles.periodToggle}
              {...tabListA11y}
              accessibilityLabel={t("a11y.today.periodPicker")}
            >
              {(["week", "month"] as const).map((period) => {
                const selected = insightsPeriod === period;
                return (
                  <AnimatedPressable
                    key={period}
                    onPress={() => handlePeriodChange(period)}
                    style={[
                      styles.periodButton,
                      selected ? styles.periodButtonActive : undefined,
                    ]}
                    hitSlop={hitSlopFor(MIN_TOUCH_TARGET, PERIOD_BUTTON_HEIGHT)}
                    {...tabA11y(selected)}
                    accessibilityLabel={t(`insights.${period}`)}
                  >
                    <Text
                      variant="subheadline"
                      tone={selected ? "primary" : "secondary"}
                      style={selected ? styles.periodTextActive : undefined}
                    >
                      {t(`insights.${period}`)}
                    </Text>
                  </AnimatedPressable>
                );
              })}
            </View>
          </View>

          {/* Chart */}
          {insightsPeriod === "week" ? (
            <WeeklyChart
              data={weeklyData}
              onDayPress={handleDayPress}
              fluidTarget={fluidTarget ?? undefined}
            />
          ) : (
            <MonthlyChart
              data={monthlyData}
              onWeekPress={handleDayPress}
              fluidTarget={fluidTarget ?? undefined}
            />
          )}

          {/* Insight Cards - Row 1 */}
          <View
            style={[
              styles.insightCardsRow,
              stackCards ? styles.insightCardsStacked : undefined,
            ]}
          >
            <InsightCard
              title={t("insights.avgFluids")}
              value={`${numberFormatters.decimal.format(currentStats.avgFluids)} ml`}
              trend={currentStats.fluidTrend}
              trendValue={currentStats.fluidDiff}
              icon="cup-water"
              color={colors.category.fluid.accent}
              iconBackground={colors.category.fluid.container}
            />
            <InsightCard
              title={t("insights.avgVoids")}
              value={numberFormatters.decimal.format(currentStats.avgVoids)}
              trend={currentStats.voidTrend}
              trendValue={currentStats.voidDiff}
              icon="toilet"
              color={colors.category.urination.accent}
              iconBackground={colors.category.urination.container}
            />
            {fluidTarget !== null ? (
            <InsightCard
              title={t("insights.fluidGoalReached")}
              value={`${currentStats.fluidGoalDays}/${currentStats.totalDays}`}
              valueAccessibilityText={t("a11y.today.daysOf", {
                count: currentStats.fluidGoalDays,
                total: currentStats.totalDays,
              })}
              icon="trophy-outline"
              color={colors.amber.accent}
              iconBackground={colors.amber.container}
            />
            ) : null}
          </View>

          {/* Insight Cards - Row 2: visits logged 21:00-05:00 */}
          <View style={styles.insightCardsRow}>
            <InsightCard
              title={t("insights.nightVoidsBetween", {
                range: formatHourRange(21, 5),
              })}
              value={numberFormatters.decimal.format(currentStats.nightVoidsTotal)}
              subtitle={`${numberFormatters.decimal.format(
                currentStats.avgNightVoids
              )} ${t("insights.nightVoidsAvg")}`}
              icon="weather-night"
              color={colors.indigo.accent}
              iconBackground={colors.indigo.container}
            />
          </View>

          {/* Fluid Balance Chart - only show in week view for clarity */}
          {insightsPeriod === "week" ? (
            <View style={styles.fluidBalanceSection}>
              <Text
                variant="headline"
                accessibilityRole="header"
                style={styles.sectionTitle}
              >
                {t("insights.fluidBalance")}
              </Text>
              <FluidBalanceChart
                data={fluidBalanceData}
                onDayPress={handleDayPress}
              />
            </View>
          ) : null}

          {/* Medical disclaimer under the charts (wording fixed by legal) */}
          <Text
            variant={Platform.OS === "ios" ? "footnote" : "subheadline"}
            tone="secondary"
            style={styles.disclaimerText}
          >
            {t("disclaimer.text")}
          </Text>

          {/* Export Data Link */}
          <AnimatedPressable
            onPress={handleExportData}
            style={styles.link}
            accessibilityRole="button"
            accessibilityLabel={t("home.exportData")}
          >
            <Icon
              name="download"
              size={iconSize.sm}
              color={colors.primary.DEFAULT}
            />
            <Text variant="subheadline" tone="accent">
              {t("home.exportData")}
            </Text>
          </AnimatedPressable>
        </View>
      </ScrollView>
      <AddEntryFab />
    </>
  );
}

// The Week/Month segments are 36 tall; their touch target is 44pt / 48dp
const PERIOD_BUTTON_HEIGHT = 36;

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: SCREEN_MARGIN,
    paddingTop: Platform.OS === "ios" ? spacing.sm : spacing.lg,
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  headerText: {
    flex: 1,
    gap: spacing.xxs,
  },
  centered: {
    textAlign: "center",
  },
  // Progress section
  progressSection: {
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  link: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    gap: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  insightsHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  // Segmented control: the selected segment is a raised white surface with
  // semibold text, so it does not rely on colour alone
  periodToggle: {
    flexDirection: "row",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm + 2,
    padding: spacing.xxs,
  },
  periodButton: {
    minHeight: PERIOD_BUTTON_HEIGHT,
    minWidth: 64,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    // The border is always there and only changes colour: on Android,
    // removing a border from a clipped view can leave its label undrawn
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
  },
  periodButtonActive: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  periodTextActive: {
    fontWeight: "600",
  },
  insightCardsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  insightCardsStacked: {
    flexDirection: "column",
  },
  fluidBalanceSection: {
    marginTop: spacing.xl,
  },
  disclaimerText: {
    textAlign: "center",
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  // Empty state
  emptyHint: {
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    ...cardStyle,
  },
});
