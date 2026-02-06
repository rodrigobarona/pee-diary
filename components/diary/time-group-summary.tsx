import { Text } from "@/components/ui/text";
import { useI18n } from "@/lib/i18n/context";
import type { DiaryEntry } from "@/lib/store/types";
import { colors } from "@/lib/theme/colors";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { getHours, parseISO } from "date-fns";
import * as React from "react";
import { Pressable, StyleSheet, View } from "react-native";

type TimePeriod =
  | "earlyMorning"
  | "morning"
  | "afternoon"
  | "evening"
  | "night";

interface TimeGroupSummaryProps {
  entries: DiaryEntry[];
  onPeriodPress?: (period: TimePeriod) => void;
}

// Helper to categorize entry by time period (matching history page)
const getTimePeriod = (timestamp: string): TimePeriod => {
  const hour = getHours(parseISO(timestamp));
  if (hour >= 0 && hour < 5) return "earlyMorning"; // 00:00 - 05:00
  if (hour >= 5 && hour < 12) return "morning"; // 05:00 - 12:00
  if (hour >= 12 && hour < 17) return "afternoon"; // 12:00 - 17:00
  if (hour >= 17 && hour < 21) return "evening"; // 17:00 - 21:00
  return "night"; // 21:00 - 23:59
};

// Get period icon
const getPeriodIcon = (
  period: TimePeriod
): keyof typeof MaterialCommunityIcons.glyphMap => {
  switch (period) {
    case "earlyMorning":
      return "weather-night";
    case "morning":
      return "weather-sunny";
    case "afternoon":
      return "white-balance-sunny";
    case "evening":
      return "weather-sunset";
    case "night":
      return "weather-night";
  }
};

interface PeriodSummary {
  voids: number;
  fluids: number;
  fluidAmount: number;
  leaks: number;
}

export function TimeGroupSummary({
  entries,
  onPeriodPress,
}: TimeGroupSummaryProps) {
  const { t } = useI18n();

  // Group entries by time period
  const groupedEntries = React.useMemo(() => {
    const groups: Record<TimePeriod, PeriodSummary> = {
      earlyMorning: { voids: 0, fluids: 0, fluidAmount: 0, leaks: 0 },
      morning: { voids: 0, fluids: 0, fluidAmount: 0, leaks: 0 },
      afternoon: { voids: 0, fluids: 0, fluidAmount: 0, leaks: 0 },
      evening: { voids: 0, fluids: 0, fluidAmount: 0, leaks: 0 },
      night: { voids: 0, fluids: 0, fluidAmount: 0, leaks: 0 },
    };

    entries.forEach((entry) => {
      const period = getTimePeriod(entry.timestamp);
      if (entry.type === "urination") {
        groups[period].voids++;
      } else if (entry.type === "fluid") {
        groups[period].fluids++;
        groups[period].fluidAmount += entry.amount;
      } else if (entry.type === "leak") {
        groups[period].leaks++;
      }
    });

    return groups;
  }, [entries]);

  const periods: TimePeriod[] = [
    "earlyMorning",
    "morning",
    "afternoon",
    "evening",
    "night",
  ];

  return (
    <View style={styles.container}>
      {periods.map((period, index) => {
        const summary = groupedEntries[period];
        const hasEntries =
          summary.voids > 0 || summary.fluids > 0 || summary.leaks > 0;

        return (
          <Pressable
            key={period}
            onPress={() => onPeriodPress?.(period)}
            style={[
              styles.periodCard,
              index < periods.length - 1 && styles.periodCardBorder,
            ]}
          >
            <View style={styles.periodHeader}>
              <View style={styles.periodTitleRow}>
                <MaterialCommunityIcons
                  name={getPeriodIcon(period)}
                  size={18}
                  color={colors.primary.DEFAULT}
                />
                <Text style={styles.periodTitle}>
                  {t(`timePeriod.${period}`)}
                </Text>
              </View>
              <Text style={styles.periodTimeRange}>
                {t(`timePeriod.range.${period}`)}
              </Text>
            </View>

            {hasEntries ? (
              <View style={styles.entrySummary}>
                {summary.voids > 0 && (
                  <View style={styles.entryItem}>
                    <MaterialCommunityIcons
                      name="toilet"
                      size={16}
                      color={colors.primary.DEFAULT}
                    />
                    <Text style={styles.entryCount}>×{summary.voids}</Text>
                  </View>
                )}
                {summary.fluids > 0 && (
                  <View style={styles.entryItem}>
                    <MaterialCommunityIcons
                      name="cup-water"
                      size={16}
                      color={colors.secondary.DEFAULT}
                    />
                    <Text style={styles.entryCount}>×{summary.fluids}</Text>
                    <Text style={styles.entryAmount}>
                      ({summary.fluidAmount}ml)
                    </Text>
                  </View>
                )}
                {summary.leaks > 0 && (
                  <View style={styles.entryItem}>
                    <MaterialCommunityIcons
                      name="water-alert"
                      size={16}
                      color={colors.primary.light} // Design brief: Soft teal, no red for leaks
                    />
                    <Text style={[styles.entryCount, { color: colors.primary.light }]}>
                      ×{summary.leaks}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.noEntries}>{t("timePeriod.noEntries")}</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// Single period card (for use in expandable views)
interface SinglePeriodCardProps {
  period: TimePeriod;
  entries: DiaryEntry[];
  onPress?: () => void;
}

export function SinglePeriodCard({
  period,
  entries,
  onPress,
}: SinglePeriodCardProps) {
  const { t } = useI18n();

  const summary = React.useMemo(() => {
    const result = { voids: 0, fluids: 0, fluidAmount: 0, leaks: 0 };
    entries.forEach((entry) => {
      if (entry.type === "urination") result.voids++;
      else if (entry.type === "fluid") {
        result.fluids++;
        result.fluidAmount += entry.amount;
      } else if (entry.type === "leak") result.leaks++;
    });
    return result;
  }, [entries]);

  const hasEntries =
    summary.voids > 0 || summary.fluids > 0 || summary.leaks > 0;

  return (
    <Pressable onPress={onPress} style={styles.singleCard}>
      <View style={styles.periodHeader}>
        <View style={styles.periodTitleRow}>
          <MaterialCommunityIcons
            name={getPeriodIcon(period)}
            size={20}
            color={colors.primary.DEFAULT}
          />
          <Text style={styles.singleCardTitle}>
            {t(`timePeriod.${period}`)}
          </Text>
        </View>
        <Text style={styles.periodTimeRange}>
          {t(`timePeriod.range.${period}`)}
        </Text>
      </View>

      {hasEntries ? (
        <View style={styles.singleCardEntries}>
          {summary.voids > 0 && (
            <View style={styles.singleCardEntry}>
              <MaterialCommunityIcons
                name="toilet"
                size={18}
                color={colors.primary.DEFAULT}
              />
              <Text style={styles.singleCardValue}>{summary.voids}</Text>
            </View>
          )}
          {summary.fluids > 0 && (
            <View style={styles.singleCardEntry}>
              <MaterialCommunityIcons
                name="cup-water"
                size={18}
                color={colors.secondary.DEFAULT}
              />
              <Text style={styles.singleCardValue}>
                {summary.fluidAmount}ml
              </Text>
            </View>
          )}
          {summary.leaks > 0 && (
            <View style={styles.singleCardEntry}>
              <MaterialCommunityIcons
                name="water-alert"
                size={18}
                color={colors.primary.light} // Design brief: Soft teal, no red for leaks
              />
              <Text style={[styles.singleCardValue, { color: colors.primary.light }]}>
                {summary.leaks}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <Text style={styles.noEntries}>{t("timePeriod.noEntries")}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12, // Design brief: 8-12px max
    borderCurve: "continuous",
    overflow: "hidden",
  },
  periodCard: {
    padding: 16,
  },
  periodCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  periodHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  periodTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  periodTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  periodTimeRange: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  entrySummary: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  entryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  entryCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  entryAmount: {
    fontSize: 12,
    color: "#6B7280",
  },
  noEntries: {
    fontSize: 13,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  // Single card styles
  singleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
  },
  singleCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  singleCardEntries: {
    flexDirection: "row",
    gap: 20,
    marginTop: 4,
  },
  singleCardEntry: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  singleCardValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
});
