import * as React from 'react';
import { View, ScrollView, StyleSheet, Pressable, ActionSheetIOS, Platform, Alert } from 'react-native';
import { 
  startOfDay, 
  endOfDay, 
  isWithinInterval, 
  parseISO, 
  getHours, 
  format,
  subDays,
  eachDayOfInterval,
} from 'date-fns';
import { useShallow } from 'zustand/shallow';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { Text } from '@/components/ui/text';
import {
  ProgressBar,
  StreakBadge,
  TimeGroupSummary,
  WeeklyChart,
  MonthlyChart,
  InsightCard,
} from '@/components/diary';
import { useDiaryStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n/context';
import { formatDateHeader } from '@/lib/utils/date';
import { colors } from '@/lib/theme/colors';
import type { DiaryEntry } from '@/lib/store/types';

// Helper to check if entry is from today
const isEntryFromToday = (entry: DiaryEntry) => {
  const today = new Date();
  return isWithinInterval(parseISO(entry.timestamp), {
    start: startOfDay(today),
    end: endOfDay(today),
  });
};

// Get greeting based on time of day
const getGreeting = (t: (key: string) => string): string => {
  const hour = getHours(new Date());
  if (hour >= 5 && hour < 12) return t('greeting.morning');
  if (hour >= 12 && hour < 18) return t('greeting.afternoon');
  return t('greeting.evening');
};

export default function HomeScreen() {
  const { t } = useI18n();
  const router = useRouter();
  
  // Refs for scroll handling
  const scrollViewRef = React.useRef<ScrollView>(null);
  const insightsSectionY = React.useRef<number>(0);
  
  // Insights period toggle
  const [insightsPeriod, setInsightsPeriod] = React.useState<'week' | 'month'>('week');

  // Get all entries and goals
  const allEntries = useDiaryStore(useShallow((state) => state.entries));
  const goals = useDiaryStore((state) => state.goals);
  const streak = useDiaryStore((state) => state.streak);
  const refreshStreak = useDiaryStore((state) => state.refreshStreak);

  // Refresh streak on mount
  React.useEffect(() => {
    refreshStreak();
  }, [refreshStreak]);

  // Filter entries for today
  const todayEntries = React.useMemo(() => {
    return allEntries.filter(isEntryFromToday);
  }, [allEntries]);

  // Compute summary from filtered entries
  const summary = React.useMemo(() => {
    const voids = todayEntries.filter((e) => e.type === 'urination').length;
    const fluids = todayEntries
      .filter((e) => e.type === 'fluid')
      .reduce((sum, e) => sum + (e.type === 'fluid' ? e.amount : 0), 0);
    const leaks = todayEntries.filter((e) => e.type === 'leak').length;
    return { voids, fluids, leaks };
  }, [todayEntries]);

  // Calculate progress
  const fluidProgress = goals.fluidTarget > 0 ? summary.fluids / goals.fluidTarget : 0;
  const voidProgress = goals.voidTarget > 0 ? summary.voids / goals.voidTarget : 0;

  const today = new Date();
  const dateLabel = formatDateHeader(today);
  const greeting = getGreeting(t);

  // Compute weekly chart data (last 7 days)
  const weeklyData = React.useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(today, 6),
      end: today,
    });

    return days.map((day) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      
      const dayEntries = allEntries.filter((entry) =>
        isWithinInterval(parseISO(entry.timestamp), { start: dayStart, end: dayEnd })
      );

      const voids = dayEntries.filter((e) => e.type === 'urination').length;
      const fluids = dayEntries
        .filter((e) => e.type === 'fluid')
        .reduce((sum, e) => sum + (e.type === 'fluid' ? e.amount : 0), 0);
      const leaks = dayEntries.filter((e) => e.type === 'leak').length;

      return { date: day, voids, fluids, leaks };
    });
  }, [allEntries, today]);

  // Compute weekly stats for insight cards
  const weeklyStats = React.useMemo(() => {
    // This week (last 7 days)
    const thisWeekDays = weeklyData;
    const daysWithEntries = thisWeekDays.filter(d => d.voids > 0 || d.fluids > 0);
    
    // Last week (7-14 days ago)
    const lastWeekStart = subDays(today, 13);
    const lastWeekEnd = subDays(today, 7);
    const lastWeekDays = eachDayOfInterval({ start: lastWeekStart, end: lastWeekEnd });
    
    const lastWeekData = lastWeekDays.map((day) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      
      const dayEntries = allEntries.filter((entry) =>
        isWithinInterval(parseISO(entry.timestamp), { start: dayStart, end: dayEnd })
      );

      const voids = dayEntries.filter((e) => e.type === 'urination').length;
      const fluids = dayEntries
        .filter((e) => e.type === 'fluid')
        .reduce((sum, e) => sum + (e.type === 'fluid' ? e.amount : 0), 0);

      return { voids, fluids };
    });

    // Calculate averages
    const thisWeekAvgVoids = daysWithEntries.length > 0
      ? thisWeekDays.reduce((sum, d) => sum + d.voids, 0) / daysWithEntries.length
      : 0;
    const thisWeekAvgFluids = daysWithEntries.length > 0
      ? thisWeekDays.reduce((sum, d) => sum + d.fluids, 0) / daysWithEntries.length
      : 0;

    const lastWeekDaysWithEntries = lastWeekData.filter(d => d.voids > 0 || d.fluids > 0);
    const lastWeekAvgVoids = lastWeekDaysWithEntries.length > 0
      ? lastWeekData.reduce((sum, d) => sum + d.voids, 0) / lastWeekDaysWithEntries.length
      : 0;
    const lastWeekAvgFluids = lastWeekDaysWithEntries.length > 0
      ? lastWeekData.reduce((sum, d) => sum + d.fluids, 0) / lastWeekDaysWithEntries.length
      : 0;

    // Calculate goal achievement (days that met both goals)
    const goalsMet = thisWeekDays.filter((d) => {
      const voidsMet = d.voids >= goals.voidTarget;
      const fluidsMet = d.fluids >= goals.fluidTarget;
      return voidsMet && fluidsMet;
    }).length;

    // Trends
    const voidTrend: 'up' | 'down' | 'stable' = 
      thisWeekAvgVoids > lastWeekAvgVoids ? 'up' : 
      thisWeekAvgVoids < lastWeekAvgVoids ? 'down' : 'stable';
    const fluidTrend: 'up' | 'down' | 'stable' = 
      thisWeekAvgFluids > lastWeekAvgFluids ? 'up' : 
      thisWeekAvgFluids < lastWeekAvgFluids ? 'down' : 'stable';

    const voidDiff = Math.abs(Math.round((thisWeekAvgVoids - lastWeekAvgVoids) * 10) / 10);
    const fluidDiff = Math.abs(Math.round(thisWeekAvgFluids - lastWeekAvgFluids));

    return {
      avgVoids: Math.round(thisWeekAvgVoids * 10) / 10,
      avgFluids: Math.round(thisWeekAvgFluids),
      goalsMet,
      totalDays: 7,
      voidTrend,
      fluidTrend,
      voidDiff: voidDiff > 0 ? `${voidDiff}` : undefined,
      fluidDiff: fluidDiff > 0 ? `${fluidDiff}ml` : undefined,
    };
  }, [weeklyData, allEntries, today, goals]);

  // Compute monthly chart data (last 30 days)
  const monthlyData = React.useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(today, 29),
      end: today,
    });

    return days.map((day) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      
      const dayEntries = allEntries.filter((entry) =>
        isWithinInterval(parseISO(entry.timestamp), { start: dayStart, end: dayEnd })
      );

      const voids = dayEntries.filter((e) => e.type === 'urination').length;
      const fluids = dayEntries
        .filter((e) => e.type === 'fluid')
        .reduce((sum, e) => sum + (e.type === 'fluid' ? e.amount : 0), 0);
      const leaks = dayEntries.filter((e) => e.type === 'leak').length;

      return { date: day, voids, fluids, leaks };
    });
  }, [allEntries, today]);

  // Compute monthly stats for insight cards
  const monthlyStats = React.useMemo(() => {
    const thisMonthDays = monthlyData;
    const daysWithEntries = thisMonthDays.filter(d => d.voids > 0 || d.fluids > 0);
    
    // Previous month (30-60 days ago)
    const lastMonthStart = subDays(today, 59);
    const lastMonthEnd = subDays(today, 30);
    const lastMonthDays = eachDayOfInterval({ start: lastMonthStart, end: lastMonthEnd });
    
    const lastMonthData = lastMonthDays.map((day) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      
      const dayEntries = allEntries.filter((entry) =>
        isWithinInterval(parseISO(entry.timestamp), { start: dayStart, end: dayEnd })
      );

      const voids = dayEntries.filter((e) => e.type === 'urination').length;
      const fluids = dayEntries
        .filter((e) => e.type === 'fluid')
        .reduce((sum, e) => sum + (e.type === 'fluid' ? e.amount : 0), 0);

      return { voids, fluids };
    });

    // Calculate averages
    const thisMonthAvgVoids = daysWithEntries.length > 0
      ? thisMonthDays.reduce((sum, d) => sum + d.voids, 0) / daysWithEntries.length
      : 0;
    const thisMonthAvgFluids = daysWithEntries.length > 0
      ? thisMonthDays.reduce((sum, d) => sum + d.fluids, 0) / daysWithEntries.length
      : 0;

    const lastMonthDaysWithEntries = lastMonthData.filter(d => d.voids > 0 || d.fluids > 0);
    const lastMonthAvgVoids = lastMonthDaysWithEntries.length > 0
      ? lastMonthData.reduce((sum, d) => sum + d.voids, 0) / lastMonthDaysWithEntries.length
      : 0;
    const lastMonthAvgFluids = lastMonthDaysWithEntries.length > 0
      ? lastMonthData.reduce((sum, d) => sum + d.fluids, 0) / lastMonthDaysWithEntries.length
      : 0;

    // Calculate goal achievement
    const goalsMet = thisMonthDays.filter((d) => {
      const voidsMet = d.voids >= goals.voidTarget;
      const fluidsMet = d.fluids >= goals.fluidTarget;
      return voidsMet && fluidsMet;
    }).length;

    // Trends
    const voidTrend: 'up' | 'down' | 'stable' = 
      thisMonthAvgVoids > lastMonthAvgVoids ? 'up' : 
      thisMonthAvgVoids < lastMonthAvgVoids ? 'down' : 'stable';
    const fluidTrend: 'up' | 'down' | 'stable' = 
      thisMonthAvgFluids > lastMonthAvgFluids ? 'up' : 
      thisMonthAvgFluids < lastMonthAvgFluids ? 'down' : 'stable';

    const voidDiff = Math.abs(Math.round((thisMonthAvgVoids - lastMonthAvgVoids) * 10) / 10);
    const fluidDiff = Math.abs(Math.round(thisMonthAvgFluids - lastMonthAvgFluids));

    return {
      avgVoids: Math.round(thisMonthAvgVoids * 10) / 10,
      avgFluids: Math.round(thisMonthAvgFluids),
      goalsMet,
      totalDays: 30,
      voidTrend,
      fluidTrend,
      voidDiff: voidDiff > 0 ? `${voidDiff}` : undefined,
      fluidDiff: fluidDiff > 0 ? `${fluidDiff}ml` : undefined,
    };
  }, [monthlyData, allEntries, today, goals]);

  // Get current period stats based on toggle
  const currentStats = insightsPeriod === 'week' ? weeklyStats : monthlyStats;

  // Handle stat card press - show action sheet with options
  const handleStatPress = React.useCallback((type: 'urination' | 'fluid' | 'leak') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const todayStr = format(today, 'yyyy-MM-dd');
    
    const options = [
      t('home.viewInHistory'),
      t('home.addNew'),
      t('common.cancel'),
    ];

    if (Platform.OS === 'ios') {
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
            router.push(`/add/${type}`);
          }
        }
      );
    } else {
      // Android/Web - use Alert as action sheet
      Alert.alert(
        t(`entry.${type}`),
        '',
        [
          {
            text: t('home.viewInHistory'),
            onPress: () => router.push(`/(tabs)/history?date=${todayStr}&filter=${type}`),
          },
          {
            text: t('home.addNew'),
            onPress: () => router.push(`/add/${type}`),
          },
          { text: t('common.cancel'), style: 'cancel' },
        ]
      );
    }
  }, [router, t, today]);

  // Navigate to settings and open goals modal
  const handleEditGoals = React.useCallback(() => {
    router.push('/(tabs)/settings?openGoals=true');
  }, [router]);

  // Handle time period press - navigate to history with period filter
  const handlePeriodPress = React.useCallback((period: 'morning' | 'afternoon' | 'evening' | 'night') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const todayStr = format(today, 'yyyy-MM-dd');
    router.push(`/(tabs)/history?date=${todayStr}&period=${period}`);
  }, [router, today]);

  // Handle streak badge press - scroll to insights section
  const handleStreakPress = React.useCallback(() => {
    scrollViewRef.current?.scrollTo({
      y: insightsSectionY.current - 20,
      animated: true,
    });
  }, []);

  // Handle day press in weekly chart
  const handleDayPress = React.useCallback((date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    router.push(`/(tabs)/history?date=${dateStr}`);
  }, [router]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.date}>{dateLabel}</Text>
          </View>
          <StreakBadge streak={streak.currentStreak} onPress={handleStreakPress} />
        </View>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          {/* Fluid Progress */}
          <ProgressBar
            progress={fluidProgress}
            value={summary.fluids}
            target={goals.fluidTarget}
            unit="ml"
            label={t('home.summary.fluids')}
            icon="cup-water"
            color={colors.secondary.DEFAULT}
            onPress={() => handleStatPress('fluid')}
          />

          {/* Voids Progress */}
          <ProgressBar
            progress={voidProgress}
            value={summary.voids}
            target={goals.voidTarget}
            label={t('home.summary.voids')}
            icon="toilet"
            color={colors.primary.DEFAULT}
            onPress={() => handleStatPress('urination')}
          />

          {/* Leaks - no target, goal is 0 */}
          <ProgressBar
            progress={summary.leaks > 0 ? 1 : 0}
            value={summary.leaks}
            target={0}
            label={t('home.summary.leaks')}
            icon="water-alert"
            color={summary.leaks > 0 ? colors.error : '#10B981'}
            backgroundColor={summary.leaks > 0 ? '#FEE2E2' : '#D1FAE5'}
            onPress={() => handleStatPress('leak')}
            successLabel={t('home.noLeaks')}
          />

          {/* Edit Goals Link */}
          <Pressable onPress={handleEditGoals} style={styles.editGoalsLink}>
            <MaterialCommunityIcons name="cog-outline" size={14} color="#9CA3AF" />
            <Text style={styles.editGoalsText}>{t('home.editGoals')}</Text>
          </Pressable>
        </View>

        {/* Time Period Summary */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>{t('home.todayActivity')}</Text>
          <TimeGroupSummary entries={todayEntries} onPeriodPress={handlePeriodPress} />
        </View>

        {/* Insights Section */}
        <View 
          style={styles.insightsSection}
          onLayout={(e) => {
            insightsSectionY.current = e.nativeEvent.layout.y;
          }}
        >
          {/* Header with period toggle */}
          <View style={styles.insightsHeader}>
            <Text style={styles.insightsTitle}>{t('insights.title')}</Text>
            <View style={styles.periodToggle}>
              <Pressable
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setInsightsPeriod('week');
                }}
                style={[
                  styles.periodButton,
                  insightsPeriod === 'week' && styles.periodButtonActive,
                ]}
              >
                <Text style={[
                  styles.periodButtonText,
                  insightsPeriod === 'week' && styles.periodButtonTextActive,
                ]}>
                  {t('insights.week')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setInsightsPeriod('month');
                }}
                style={[
                  styles.periodButton,
                  insightsPeriod === 'month' && styles.periodButtonActive,
                ]}
              >
                <Text style={[
                  styles.periodButtonText,
                  insightsPeriod === 'month' && styles.periodButtonTextActive,
                ]}>
                  {t('insights.month')}
                </Text>
              </Pressable>
            </View>
          </View>
          
          {/* Chart - only show weekly as monthly would be too crowded */}
          {insightsPeriod === 'week' && (
            <WeeklyChart 
              data={weeklyData} 
              onDayPress={handleDayPress}
              voidTarget={goals.voidTarget}
              fluidTarget={goals.fluidTarget}
            />
          )}
          
          {/* Monthly Chart - 4 weeks */}
          {insightsPeriod === 'month' && (
            <MonthlyChart 
              data={monthlyData} 
              onWeekPress={handleDayPress}
              voidTarget={goals.voidTarget}
              fluidTarget={goals.fluidTarget}
            />
          )}
          
          {/* Insight Cards */}
          <View style={styles.insightCardsRow}>
            <InsightCard
              title={t('insights.avgFluids')}
              value={`${currentStats.avgFluids}ml`}
              trend={currentStats.fluidTrend}
              trendValue={currentStats.fluidDiff}
              icon="cup-water"
              color={colors.secondary.DEFAULT}
            />
            <InsightCard
              title={t('insights.avgVoids')}
              value={`${currentStats.avgVoids}`}
              trend={currentStats.voidTrend}
              trendValue={currentStats.voidDiff}
              icon="toilet"
              color={colors.primary.DEFAULT}
            />
            <InsightCard
              title={t('insights.goalsMet')}
              value={`${currentStats.goalsMet}/${currentStats.totalDays}`}
              icon="trophy-outline"
              color="#F59E0B"
            />
          </View>
        </View>

        {/* Empty state hint */}
        {todayEntries.length === 0 && (
          <View style={styles.emptyHint}>
            <Text style={styles.emptyHintText}>{t('home.noEntries')}</Text>
            <Text style={styles.emptyHintSubtext}>{t('home.addFirst')}</Text>
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
    padding: 20,
    paddingBottom: 100,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  date: {
    fontSize: 15,
    color: '#6B7280',
  },
  // Progress section
  progressSection: {
    gap: 12,
    marginBottom: 24,
  },
  editGoalsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  editGoalsText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  // Activity section
  activitySection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  // Insights section
  insightsSection: {
    marginTop: 24,
  },
  insightsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightsTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  periodButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  periodButtonTextActive: {
    color: '#111827',
  },
  insightCardsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  // Empty state
  emptyHint: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyHintText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  emptyHintSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
