import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import * as React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/text";

interface InsightCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  onPress?: () => void;
}

export function InsightCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  color,
  onPress,
}: InsightCardProps) {
  const handlePress = React.useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  }, [onPress]);

  const getTrendIcon = (): keyof typeof MaterialCommunityIcons.glyphMap => {
    switch (trend) {
      case "up":
        return "trending-up";
      case "down":
        return "trending-down";
      default:
        return "minus";
    }
  };

  const getTrendColor = (): string => {
    switch (trend) {
      case "up":
        return "#83C5BE"; // Soft teal - neutral indicator
      case "down":
        return "#9CA3AF"; // Muted gray - neutral indicator
      default:
        return "#D1D5DB"; // Light gray
    }
  };

  const content = (
    <View style={styles.container}>
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <MaterialCommunityIcons name={icon} size={18} color={color} />
      </View>

      {/* Value - centered and prominent */}
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>

      {/* Title */}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      {/* Trend indicator or subtitle - always show container for consistent height */}
      <View style={styles.trendContainer}>
        {trend && trendValue ? (
          <>
            <MaterialCommunityIcons
              name={getTrendIcon()}
              size={11}
              color={getTrendColor()}
            />
            <Text style={[styles.trendText, { color: getTrendColor() }]}>
              {trendValue}
            </Text>
          </>
        ) : subtitle ? (
          <Text style={styles.subtitle}>{subtitle}</Text>
        ) : (
          <Text style={styles.trendPlaceholder}> </Text>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={handlePress} style={styles.pressable}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.pressable}>{content}</View>;
}

// Compact version for inline display
interface CompactInsightProps {
  label: string;
  value: string;
  trend?: "up" | "down" | "stable";
  color?: string;
}

export function CompactInsight({
  label,
  value,
  trend,
  color = "#6B7280",
}: CompactInsightProps) {
  const getTrendIcon = ():
    | keyof typeof MaterialCommunityIcons.glyphMap
    | null => {
    switch (trend) {
      case "up":
        return "arrow-up";
      case "down":
        return "arrow-down";
      default:
        return null;
    }
  };

  const getTrendColor = (): string => {
    switch (trend) {
      case "up":
        return "#83C5BE"; // Soft teal - neutral indicator
      case "down":
        return "#9CA3AF"; // Muted gray - neutral indicator
      default:
        return "#6B7280";
    }
  };

  const trendIcon = getTrendIcon();

  return (
    <View style={compactStyles.container}>
      <Text style={compactStyles.label}>{label}</Text>
      <View style={compactStyles.valueRow}>
        <Text style={[compactStyles.value, { color }]}>{value}</Text>
        {trendIcon ? (
          <MaterialCommunityIcons
            name={trendIcon}
            size={14}
            color={getTrendColor()}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
    minWidth: 0,
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    minHeight: 100,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  value: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  title: {
    fontSize: 10,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 2,
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    marginTop: 4,
    minHeight: 14,
  },
  trendText: {
    fontSize: 10,
    fontWeight: "500",
  },
  trendPlaceholder: {
    fontSize: 10,
    color: "transparent",
  },
  subtitle: {
    fontSize: 10,
    color: "#6B7280",
    textAlign: "center",
  },
});

const compactStyles = StyleSheet.create({
  container: {
    gap: 2,
  },
  label: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
  },
});
