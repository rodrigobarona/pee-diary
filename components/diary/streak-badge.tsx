import * as React from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n/context';

interface StreakBadgeProps {
  streak: number;
  showLabel?: boolean;
  onPress?: () => void;
}

export function StreakBadge({ streak, showLabel = true, onPress }: StreakBadgeProps) {
  const { t } = useI18n();
  const scale = useSharedValue(1);
  const prevStreak = React.useRef(streak);

  // Animate when streak increases
  React.useEffect(() => {
    if (streak > prevStreak.current) {
      scale.value = withSequence(
        withSpring(1.2, { damping: 10, stiffness: 300 }),
        withDelay(100, withSpring(1, { damping: 15, stiffness: 200 }))
      );
    }
    prevStreak.current = streak;
  }, [streak, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (streak === 0) {
    return null;
  }

  // Color based on streak length
  const getFireColor = () => {
    if (streak >= 30) return '#EF4444'; // Red for 30+ days
    if (streak >= 14) return '#F97316'; // Orange for 14+ days
    if (streak >= 7) return '#F59E0B';  // Amber for 7+ days
    return '#FBBF24'; // Yellow for < 7 days
  };

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  const content = (
    <Animated.View style={[styles.container, animatedStyle]}>
      <MaterialCommunityIcons
        name="fire"
        size={20}
        color={getFireColor()}
      />
      <Text style={styles.streakNumber}>{streak}</Text>
      {showLabel ? (
        <Text style={styles.label}>
          {streak === 1 ? t('streak.day') : t('streak.days')}
        </Text>
      ) : null}
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable onPress={handlePress}>
        {content}
      </Pressable>
    );
  }

  return content;
}

// Larger version for empty state or milestones
interface StreakDisplayProps {
  streak: number;
}

export function StreakDisplay({ streak }: StreakDisplayProps) {
  const { t } = useI18n();

  const getFireColor = () => {
    if (streak >= 30) return '#EF4444';
    if (streak >= 14) return '#F97316';
    if (streak >= 7) return '#F59E0B';
    return '#FBBF24';
  };

  const getMessage = () => {
    if (streak >= 30) return t('streak.amazing');
    if (streak >= 14) return t('streak.great');
    if (streak >= 7) return t('streak.good');
    if (streak >= 3) return t('streak.keepGoing');
    if (streak === 0) return t('streak.start');
    return t('streak.started');
  };

  return (
    <View style={styles.displayContainer}>
      <View style={styles.displayRow}>
        {streak > 0 ? (
          <>
            <MaterialCommunityIcons
              name="fire"
              size={32}
              color={getFireColor()}
            />
            <Text style={styles.displayNumber}>{streak}</Text>
            <Text style={styles.displayLabel}>
              {streak === 1 ? t('streak.day') : t('streak.days')}
            </Text>
          </>
        ) : (
          <MaterialCommunityIcons
            name="fire-off"
            size={32}
            color="#9CA3AF"
          />
        )}
      </View>
      <Text style={styles.message}>{getMessage()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  label: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
  // Display styles
  displayContainer: {
    alignItems: 'center',
    gap: 8,
  },
  displayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  displayNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  displayLabel: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
