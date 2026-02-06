import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { format, getHours, parseISO } from "date-fns";
import * as Haptics from "expo-haptics";
import * as React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/text";
import { useI18n } from "@/lib/i18n/context";
import type { DiaryEntry } from "@/lib/store/types";
import { colors } from "@/lib/theme/colors";

interface TimelineEntryProps {
  entry: DiaryEntry;
  isLast?: boolean;
  isFirst?: boolean;
  showTime?: boolean;
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

export function TimelineEntry({
  entry,
  isLast = false,
  isFirst = false,
  showTime = true,
  onPress,
}: TimelineEntryProps) {
  const { t, locale } = useI18n();
  const config = entryConfig[entry.type];
  // Use 12-hour format for English, 24-hour for Spanish/Portuguese
  const timeFormat = locale === "en" ? "h:mm a" : "HH:mm";
  const time = format(parseISO(entry.timestamp), timeFormat);

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
    <View style={styles.row}>
      {/* Time column - fixed width for "11:33 PM" */}
      <View style={styles.timeColumn}>
        {showTime ? <Text style={styles.timeText}>{time}</Text> : null}
      </View>

      {/* Track column - vertical line with dot */}
      <View style={styles.trackColumn}>
        <View style={[styles.trackLine, isFirst && styles.trackLineHidden]} />
        <View style={[styles.trackDot, { borderColor: config.color }]}>
          <View
            style={[styles.trackDotInner, { backgroundColor: config.color }]}
          />
        </View>
        <View style={[styles.trackLine, isLast && styles.trackLineHidden]} />
      </View>

      {/* Content */}
      <Pressable onPress={handlePress} style={styles.content}>
        <View style={styles.contentInner}>
          {/* Icon */}
          <View
            style={[styles.iconBadge, { backgroundColor: `${config.color}12` }]}
          >
            <MaterialCommunityIcons
              name={config.icon}
              size={16}
              color={config.color}
            />
          </View>

          {/* Details */}
          <View style={styles.details}>
            <Text style={styles.typeLabel}>{t(config.labelKey)}</Text>
            <View style={styles.detailsRow}>{getCompactDetails()}</View>
          </View>

          {/* Edited indicator - subtle pencil icon */}
          {entry.editHistory && entry.editHistory.length > 0 ? (
            <MaterialCommunityIcons
              name="pencil-outline"
              size={12}
              color="#D1D5DB"
              style={styles.editedIcon}
            />
          ) : null}

          {/* Arrow */}
          <MaterialCommunityIcons
            name="chevron-right"
            size={18}
            color="#D1D5DB"
          />
        </View>

        {/* Notes */}
        {entry.notes ? (
          <Text style={styles.notes} numberOfLines={1}>
            💬 {entry.notes}
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
}

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
  row: {
    flexDirection: "row",
    alignItems: "stretch", // All columns stretch to same height
    minHeight: 64,
  },
  // Time column - fixed width, vertically centered with dot
  timeColumn: {
    width: 65, // Enough for "11:33 PM"
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 10,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    fontVariant: ["tabular-nums"],
    textAlign: "right",
  },
  // Track column - vertical line with dot
  trackColumn: {
    width: 20,
    alignItems: "center",
  },
  trackLine: {
    flex: 1,
    width: 2,
    backgroundColor: "#E5E7EB",
  },
  trackLineHidden: {
    backgroundColor: "transparent",
  },
  trackDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  trackDotInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  // Content
  content: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginLeft: 8,
    marginRight: 16,
    marginVertical: 4,
    padding: 12,
    ...(Platform.OS === "web"
      ? { boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.06)" }
      : {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 3,
          elevation: 1,
        }),
  },
  contentInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  details: {
    flex: 1,
    marginLeft: 10,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  editedIcon: {
    marginRight: 4,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  detailText: {
    fontSize: 12,
    color: "#6B7280",
  },
  detailHighlight: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },
  detailSeparator: {
    fontSize: 12,
    color: "#D1D5DB",
    marginHorizontal: 4,
  },
  notes: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
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
