import { Text } from "@/components/ui/text";
import { useI18n } from "@/lib/i18n/context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import * as React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// Soft teal color for consistent, neutral styling
const STREAK_COLOR = "#83C5BE";

interface StreakBadgeProps {
  streak: number;
  showLabel?: boolean;
  onPress?: () => void;
}

export function StreakBadge({
  streak,
  showLabel = true,
  onPress,
}: StreakBadgeProps) {
  const { t } = useI18n();
  const opacity = useSharedValue(1);
  const prevStreak = React.useRef(streak);

  // Gentle fade animation when streak increases
  React.useEffect(() => {
    if (streak > prevStreak.current) {
      opacity.value = withTiming(0.7, { duration: 150, easing: Easing.ease });
      opacity.value = withTiming(1, { duration: 150, easing: Easing.ease });
    }
    prevStreak.current = streak;
  }, [streak, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (streak === 0) {
    return null;
  }

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  const content = (
    <Animated.View style={[styles.container, animatedStyle]}>
      <MaterialCommunityIcons
        name="calendar-check"
        size={20}
        color={STREAK_COLOR}
      />
      <Text style={styles.streakNumber}>{streak}</Text>
      {showLabel ? (
        <Text style={styles.label}>
          {streak === 1 ? t("streak.day") : t("streak.days")}
        </Text>
      ) : null}
    </Animated.View>
  );

  if (onPress) {
    return <Pressable onPress={handlePress}>{content}</Pressable>;
  }

  return content;
}

// Larger version for empty state or milestones
interface StreakDisplayProps {
  streak: number;
}

export function StreakDisplay({ streak }: StreakDisplayProps) {
  const { t } = useI18n();

  // Neutral message showing count without achievement language
  const getMessage = () => {
    if (streak === 0) return t("streak.start");
    // Neutral: "X days of entries" instead of achievement messages
    return t("streak.daysOfEntries", { count: streak });
  };

  return (
    <View style={styles.displayContainer}>
      <View style={styles.displayRow}>
        {streak > 0 ? (
          <>
            <MaterialCommunityIcons
              name="calendar-check"
              size={32}
              color={STREAK_COLOR}
            />
            <Text style={styles.displayNumber}>{streak}</Text>
            <Text style={styles.displayLabel}>
              {streak === 1 ? t("streak.day") : t("streak.days")}
            </Text>
          </>
        ) : (
          <MaterialCommunityIcons
            name="calendar-blank-outline"
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
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E0F2F1", // Soft teal-based background
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8, // Design brief: 8-12px - using 8 for pill-like badge
  },
  streakNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: "#004D54", // Dark teal for text
  },
  label: {
    fontSize: 12,
    color: "#004D54", // Dark teal for text
    fontWeight: "500",
  },
  // Display styles
  displayContainer: {
    alignItems: "center",
    gap: 8,
  },
  displayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  displayNumber: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  displayLabel: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  message: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
});
