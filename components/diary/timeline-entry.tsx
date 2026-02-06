import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { differenceInMinutes, format, getHours, parseISO } from "date-fns";
import * as Haptics from "expo-haptics";
import * as React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/text";
import { useI18n } from "@/lib/i18n/context";
import type { DiaryEntry } from "@/lib/store/types";
import { colors } from "@/lib/theme/colors";

interface TimelineEntryProps {
  entry: DiaryEntry;
  onPress?: () => void;
}

const entryConfig = {
  urination: {
    icon: "toilet" as const,
    color: colors.primary.DEFAULT,
    labelKey: "entry.urination",
  },
  fluid: {
    icon: "cup-water" as const,
    color: colors.secondary.DEFAULT,
    labelKey: "entry.fluid",
  },
  leak: {
    icon: "water-alert" as const,
    color: colors.primary.light, // Design brief: No red for leaks - use soft teal
    labelKey: "entry.leak",
  },
};

export function TimelineEntry({ entry, onPress }: TimelineEntryProps) {
  const { t, locale } = useI18n();
  const config = entryConfig[entry.type];
  // Use 12-hour format for English, 24-hour for Spanish/Portuguese
  // Use compact format "h:mma" (no space) to ensure it fits on one line
  const timeFormat = locale === "en" ? "h:mma" : "HH:mm";
  const time = format(parseISO(entry.timestamp), timeFormat).toLowerCase(); // lowercase for cleaner look

  const handlePress = React.useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  }, [onPress]);

  // Get compact details based on type
  const getCompactDetails = () => {
    switch (entry.type) {
      case "urination":
        return (
          <>
            <Text style={styles.detailText}>
              {t(
                `urination.volume${
                  entry.volume.charAt(0).toUpperCase() + entry.volume.slice(1)
                }`
              )}
            </Text>
            <Text style={styles.detailSeparator}>·</Text>
            <Text style={styles.detailText}>Lv {entry.urgency}</Text>
            {entry.hadLeak ? (
              <>
                <Text style={styles.detailSeparator}>·</Text>
                <MaterialCommunityIcons
                  name="water-alert"
                  size={12}
                  color={colors.primary.light} // Design brief: Soft teal, no red for leaks
                />
              </>
            ) : null}
          </>
        );
      case "fluid":
        return (
          <>
            <Text style={styles.detailText}>
              {t(`fluid.${entry.drinkType}`)}
            </Text>
            <Text style={styles.detailSeparator}>·</Text>
            <Text style={styles.detailHighlight}>{entry.amount}ml</Text>
          </>
        );
      case "leak":
        return (
          <>
            <Text style={styles.detailText}>{t(`leak.${entry.severity}`)}</Text>
            <Text style={styles.detailSeparator}>·</Text>
            <Text style={styles.detailText}>Lv {entry.urgency}</Text>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Pressable onPress={handlePress} style={styles.card}>
      {/* Icon - large, no background */}
      <MaterialCommunityIcons
        name={config.icon}
        size={28}
        color={config.color}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Title and time on same row */}
        <View style={styles.titleRow}>
          <Text style={styles.typeLabel}>{t(config.labelKey)}</Text>
          {entry.editHistory && entry.editHistory.length > 0 ? (
            <MaterialCommunityIcons
              name="pencil-outline"
              size={10}
              color="#D1D5DB"
            />
          ) : null}
          <Text style={styles.timeText}>{time}</Text>
        </View>

        {/* Details row */}
        <View style={styles.detailsRow}>
          {getCompactDetails()}
          {entry.notes ? (
            <>
              <Text style={styles.detailSeparator}>·</Text>
              <MaterialCommunityIcons
                name="comment-text-outline"
                size={11}
                color="#9CA3AF"
              />
            </>
          ) : null}
        </View>
      </View>

      {/* Chevron */}
      <MaterialCommunityIcons name="chevron-right" size={18} color="#D1D5DB" />
    </Pressable>
  );
}

// Time interval between entries
interface TimeIntervalProps {
  previousTimestamp: string;
  currentTimestamp: string;
}

function formatInterval(minutes: number): string {
  if (minutes < 1) return "";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function TimeInterval({
  previousTimestamp,
  currentTimestamp,
}: TimeIntervalProps) {
  const minutes = Math.abs(
    differenceInMinutes(parseISO(currentTimestamp), parseISO(previousTimestamp))
  );
  const label = formatInterval(minutes);

  if (!label) return null;

  return (
    <View style={intervalStyles.container}>
      <View style={intervalStyles.line} />
      <Text style={intervalStyles.label}>{label}</Text>
      <View style={intervalStyles.line} />
    </View>
  );
}

const intervalStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    paddingVertical: 4,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#F3F4F6",
  },
  label: {
    fontSize: 10,
    color: "#9CA3AF",
    paddingHorizontal: 8,
    fontVariant: ["tabular-nums"],
  },
});

// Time period header component
interface TimePeriodHeaderProps {
  period: "morning" | "afternoon" | "evening" | "night";
  count: number;
}

// Design brief: Muted time of day colors - avoid bright saturated colors
const periodConfig = {
  morning: {
    icon: "weather-sunny" as const,
    color: "#D4A373", // Warm sand - muted
    labelKey: "timePeriod.morning",
  },
  afternoon: {
    icon: "white-balance-sunny" as const,
    color: "#C9A87C", // Muted gold
    labelKey: "timePeriod.afternoon",
  },
  evening: {
    icon: "weather-sunset" as const,
    color: "#A78BBA", // Soft purple
    labelKey: "timePeriod.evening",
  },
  night: {
    icon: "weather-night" as const,
    color: "#8B9DC3", // Muted indigo
    labelKey: "timePeriod.night",
  },
};

export function TimePeriodHeader({ period, count }: TimePeriodHeaderProps) {
  const { t } = useI18n();
  const config = periodConfig[period];

  return (
    <View style={periodStyles.container}>
      <View style={periodStyles.iconContainer}>
        <MaterialCommunityIcons
          name={config.icon}
          size={14}
          color={config.color}
        />
      </View>
      <Text style={periodStyles.label}>{t(config.labelKey)}</Text>
      <View style={periodStyles.badge}>
        <Text style={periodStyles.badgeText}>{count}</Text>
      </View>
      <View style={periodStyles.line} />
    </View>
  );
}

// Helper to determine time period
export function getTimePeriod(
  timestamp: string
): "earlyMorning" | "morning" | "afternoon" | "evening" | "night" {
  const hour = getHours(parseISO(timestamp));
  if (hour >= 0 && hour < 5) return "earlyMorning"; // 00:00 - 05:00
  if (hour >= 5 && hour < 12) return "morning"; // 05:00 - 12:00
  if (hour >= 12 && hour < 17) return "afternoon"; // 12:00 - 17:00
  if (hour >= 17 && hour < 21) return "evening"; // 17:00 - 21:00
  return "night"; // 21:00 - 23:59
}

const styles = StyleSheet.create({
  // Compact card
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    marginHorizontal: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
    ...(Platform.OS === "web"
      ? { boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.04)" }
      : {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 2,
          elevation: 1,
        }),
  },
  // Content area
  content: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  timeText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginLeft: "auto",
    fontVariant: ["tabular-nums"],
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    fontSize: 12,
    color: "#6B7280",
  },
  detailHighlight: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  detailSeparator: {
    fontSize: 12,
    color: "#D1D5DB",
    marginHorizontal: 4,
  },
});

const periodStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginLeft: 8,
  },
  badge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
    marginLeft: 12,
  },
});
