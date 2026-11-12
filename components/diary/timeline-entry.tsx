import { getHours, parseISO } from "date-fns";
import * as React from "react";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";

import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { a11yLabel, hiddenA11y } from "@/lib/a11y";
import { useI18n } from "@/lib/i18n/context";
import { dateFormatters, numberFormatters } from "@/lib/i18n";
import type { DiaryEntry } from "@/lib/store/types";
import { colors } from "@/lib/theme/colors";
import { cardStyle, iconSize, radius, spacing } from "@/lib/theme/styles";

interface TimelineEntryProps {
  entry: DiaryEntry;
  isLast?: boolean;
  isFirst?: boolean;
  showTime?: boolean;
  onPress?: () => void;
  testID?: string;
}

const entryConfig = {
  urination: {
    icon: "toilet" as const,
    color: colors.category.urination.accent,
    container: colors.category.urination.container,
    labelKey: "entry.urination",
  },
  fluid: {
    icon: "cup-water" as const,
    color: colors.category.fluid.accent,
    container: colors.category.fluid.container,
    labelKey: "entry.fluid",
  },
  leak: {
    icon: "water-alert" as const,
    color: colors.category.leak.accent,
    container: colors.category.leak.container,
    labelKey: "entry.leak",
  },
};

// Above this font scale the time moves above the card, so a fixed time
// column never clips it
const STACKED_FONT_SCALE = 1.35;
// Time column wide enough for "12:30 AM" at the default size, and wider for
// longer 12-hour formats such as Spanish "12:30 p. m."
const TIME_COLUMN_WIDTH = 64;
const WIDE_TIME_COLUMN_WIDTH = 84;

function timeColumnWidth(): number {
  const longest = dateFormatters.time.format(new Date(2000, 0, 1, 12, 30));
  return longest.length > 8 ? WIDE_TIME_COLUMN_WIDTH : TIME_COLUMN_WIDTH;
}

const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

/**
 * One entry in the History timeline: the time and a track on the left, a
 * card on the right. The card is one accessible button whose label reads
 * the whole entry in words ("Urination, 7:06 AM, Small, Urgency 3 of 5,
 * Moderate").
 */
export function TimelineEntry({
  entry,
  isLast = false,
  isFirst = false,
  showTime = true,
  onPress,
  testID,
}: TimelineEntryProps) {
  const { t } = useI18n();
  const { fontScale } = useWindowDimensions();
  const stacked = fontScale > STACKED_FONT_SCALE;
  const config = entryConfig[entry.type];
  // The device's 12- or 24-hour clock
  const time = dateFormatters.time.format(parseISO(entry.timestamp));
  const columnWidth = timeColumnWidth();
  const typeLabel = t(config.labelKey);
  const isEdited = (entry.editHistory?.length ?? 0) > 0;

  // Short visible details and their spoken form
  const details: string[] = [];
  const spoken: (string | null)[] = [];
  switch (entry.type) {
    case "urination": {
      const volume = t(`urination.volume${capitalize(entry.volume)}`);
      details.push(volume, t("a11y.history.urgencyShort", { value: entry.urgency }));
      spoken.push(
        volume,
        t("a11y.history.urgencyOfFive", {
          value: entry.urgency,
          description: t(`urgency.${entry.urgency}`),
        }),
        entry.hadLeak ? t("a11y.history.withLeak") : null
      );
      break;
    }
    case "fluid": {
      const drink = t(`fluid.${entry.drinkType}`);
      const amount = `${numberFormatters.decimal.format(entry.amount)} ml`;
      details.push(drink, amount);
      spoken.push(drink, t("a11y.history.millilitres", { count: entry.amount }));
      break;
    }
    case "leak": {
      const severity = t(`leak.${entry.severity}`);
      details.push(severity, t("a11y.history.urgencyShort", { value: entry.urgency }));
      spoken.push(
        severity,
        t("a11y.history.urgencyOfFive", {
          value: entry.urgency,
          description: t(`urgency.${entry.urgency}`),
        })
      );
      break;
    }
  }

  const accessibilityLabel = a11yLabel(
    typeLabel,
    time,
    ...spoken,
    entry.notes ? t("a11y.history.note", { notes: entry.notes }) : null,
    isEdited ? t("common.edited") : null
  );

  const timeText = (
    <Text
      variant="footnote"
      tone="secondary"
      style={styles.timeText}
      {...hiddenA11y}
    >
      {time}
    </Text>
  );

  return (
    <View style={stacked ? styles.rowStacked : styles.row}>
      {stacked ? (
        // Large text: the time on its own line above the card
        showTime ? <View style={styles.stackedTime}>{timeText}</View> : null
      ) : (
        <View
          style={[styles.leftColumn, { width: columnWidth + 12 }]}
          {...hiddenA11y}
        >
          {/* Top connector line (invisible placeholder when first) */}
          <View
            style={[styles.trackLineTop, isFirst && styles.trackLineHidden]}
          />

          {/* Time and dot on one line */}
          <View style={styles.timeAndDot}>
            <View style={[styles.timeColumn, { width: columnWidth }]}>
              {showTime ? timeText : null}
            </View>
            <View style={[styles.trackDot, { backgroundColor: config.color }]} />
          </View>

          {/* Bottom connector line (invisible placeholder when last) */}
          <View
            style={[styles.trackLineBottom, isLast && styles.trackLineHidden]}
          />
        </View>
      )}

      {/* The entry card */}
      <AnimatedPressable
        onPress={onPress}
        style={[styles.content, stacked ? styles.contentStacked : null]}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        <View style={styles.contentInner}>
          <View style={[styles.iconBadge, { backgroundColor: config.container }]}>
            <Icon name={config.icon} size={iconSize.md} color={config.color} />
          </View>

          <View style={styles.details}>
            <Text variant="subheadline" style={styles.typeLabel}>
              {typeLabel}
            </Text>
            <View style={styles.detailsRow}>
              {details.map((detail, index) => (
                <Text
                  key={index}
                  variant="footnote"
                  tone={
                    entry.type === "fluid" && index === 1 ? undefined : "secondary"
                  }
                  style={
                    entry.type === "fluid" && index === 1
                      ? styles.detailHighlight
                      : undefined
                  }
                >
                  {index > 0 ? `· ${detail}` : detail}
                </Text>
              ))}
              {entry.type === "urination" && entry.hadLeak ? (
                <Icon
                  name="water-alert"
                  size={iconSize.sm}
                  color={colors.category.leak.accent}
                />
              ) : null}
            </View>
          </View>

          {/* Edited: a small pencil (read as "Edited" in the label) */}
          {isEdited ? (
            <Icon
              name="pencil-outline"
              size={iconSize.sm}
              color={colors.textTertiary}
              style={styles.editedIcon}
            />
          ) : null}

          {/* Disclosure chevron on iOS; Material cards have none */}
          {Platform.OS === "ios" ? (
            <Icon name="chevron-right" size={iconSize.md} color={colors.chevron} />
          ) : null}
        </View>

        {/* Notes */}
        {entry.notes ? (
          <View style={styles.notesRow}>
            <Icon
              name="note-text-outline"
              size={iconSize.sm}
              color={colors.textSecondary}
            />
            <Text
              variant="footnote"
              tone="secondary"
              style={styles.notesText}
              numberOfLines={1}
            >
              {entry.notes}
            </Text>
          </View>
        ) : null}
      </AnimatedPressable>
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
    minHeight: 56,
    paddingBottom: spacing.sm,
  },
  rowStacked: {
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  stackedTime: {
    paddingBottom: spacing.xs,
  },
  // Left column containing time + track
  leftColumn: {
    width: TIME_COLUMN_WIDTH + 12,
    alignItems: "flex-end",
  },
  timeAndDot: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeColumn: {
    width: TIME_COLUMN_WIDTH,
    alignItems: "flex-end",
    paddingRight: spacing.sm,
  },
  timeText: {
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
    textAlign: "right",
  },
  // Track elements (decorative)
  trackLineTop: {
    width: 2,
    height: spacing.md,
    backgroundColor: colors.separator,
    alignSelf: "flex-end",
    marginRight: 4,
  },
  trackDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  trackLineBottom: {
    flex: 1,
    minHeight: spacing.md,
    width: 2,
    backgroundColor: colors.separator,
    alignSelf: "flex-end",
    marginRight: 4,
  },
  trackLineHidden: {
    backgroundColor: "transparent",
  },
  // The card
  content: {
    ...cardStyle,
    flex: 1,
    marginLeft: spacing.sm,
    marginRight: spacing.md,
    padding: spacing.md,
    overflow: "hidden",
  },
  contentStacked: {
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
  },
  contentInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  details: {
    flex: 1,
  },
  typeLabel: {
    fontWeight: "600",
  },
  editedIcon: {
    marginRight: spacing.xs,
  },
  detailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: spacing.xs,
    marginTop: spacing.xxs,
  },
  detailHighlight: {
    fontWeight: "600",
  },
  notesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
  },
  notesText: {
    flex: 1,
  },
});
