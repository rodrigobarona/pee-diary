import { Text } from "@/components/ui/text";
import { colors } from "@/lib/theme/colors";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface ProgressBarProps {
  progress: number; // 0-1
  value: number;
  target: number;
  unit?: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color?: string;
  backgroundColor?: string;
  onPress?: () => void;
  successLabel?: string; // Label to show when target is 0 and value is 0 (e.g., "None" for leaks)
}

export function ProgressBar({
  progress,
  value,
  target,
  unit = "",
  label,
  icon,
  color = colors.primary.DEFAULT,
  backgroundColor = "#E5E7EB",
  onPress,
  successLabel = "None",
}: ProgressBarProps) {
  // Clamp progress between 0 and 1
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  // Animated progress value
  const animatedProgress = useSharedValue(0);

  // Animate when progress changes
  React.useEffect(() => {
    animatedProgress.value = withTiming(clampedProgress, {
      duration: 600,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [clampedProgress, animatedProgress]);

  // Animated style for the progress fill
  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value * 100}%`,
  }));

  // For leaks (target = 0), show checkmark when 0, count when > 0
  const isNoTargetMode = target === 0;
  const showSuccess = isNoTargetMode && value === 0;

  const content = (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <View
            style={[styles.iconContainer, { backgroundColor: `${color}15` }]}
          >
            <MaterialCommunityIcons name={icon} size={18} color={color} />
          </View>
          <Text style={styles.label}>{label}</Text>
        </View>
        <View style={styles.valueRow}>
          {showSuccess ? (
            <View style={styles.successBadge}>
              <MaterialCommunityIcons name="check" size={16} color="#10B981" />
              <Text style={styles.successText}>{successLabel}</Text>
            </View>
          ) : isNoTargetMode ? (
            <Text style={[styles.value, { color }]}>{value}</Text>
          ) : (
            <>
              <Text style={[styles.value, { color }]}>{value}</Text>
              <Text style={styles.target}>
                /{target}
                {unit}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Only show track for items with targets or leaks > 0 */}
      {(!isNoTargetMode || value > 0) && (
        <View style={[styles.track, { backgroundColor }]}>
          <Animated.View
            style={[styles.fill, { backgroundColor: color }, animatedStyle]}
          />
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={styles.pressable}>
        {content}
      </Pressable>
    );
  }

  return content;
}

// Compact stat card for voids/leaks
interface StatCardProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  value: number;
  label: string;
  color?: string;
  alert?: boolean;
  onPress?: () => void;
}

export function StatCard({
  icon,
  value,
  label,
  color = colors.primary.DEFAULT,
  alert = false,
  onPress,
}: StatCardProps) {
  const content = (
    <View style={[styles.statCard, alert && styles.statCardAlert]}>
      <View
        style={[
          styles.statIconContainer,
          { backgroundColor: alert ? "#FEE2E2" : `${color}15` },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={alert ? colors.error : color}
        />
      </View>
      <Text style={[styles.statValue, alert && { color: colors.error }]}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12, // Design brief: 8-12px max
    borderCurve: "continuous",
    padding: 16,
  },
  pressable: {},
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  value: {
    fontSize: 20,
    fontWeight: "700",
  },
  target: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  successText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10B981",
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 4,
  },
  // Stat card styles
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12, // Design brief: 8-12px max
    borderCurve: "continuous",
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  statCardAlert: {
    backgroundColor: "#FEF2F2",
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  statLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
});
