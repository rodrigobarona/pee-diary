import * as React from 'react';
import { View, ScrollView, StyleSheet, Pressable, ActionSheetIOS, Platform, Alert } from 'react-native';
import { startOfDay, endOfDay, isWithinInterval, parseISO, getHours, format } from 'date-fns';
import { useShallow } from 'zustand/shallow';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { Text } from '@/components/ui/text';
import {
  ProgressBar,
  StreakBadge,
  TimeGroupSummary,
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
            // View in history - navigate to history with today's date
            router.push(`/(tabs)/history?date=${todayStr}`);
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
            onPress: () => router.push(`/(tabs)/history?date=${todayStr}`),
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

  return (
    <View style={styles.container}>
      <ScrollView
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
          <StreakBadge streak={streak.currentStreak} />
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
          <TimeGroupSummary entries={todayEntries} />
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
