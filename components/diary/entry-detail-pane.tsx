import { parseISO } from "date-fns";
import { useRouter } from "expo-router";
import * as React from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";

import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { Icon, type IconName } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { dateFormatters, numberFormatters } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/context";
import type { DiaryEntry } from "@/lib/store/types";
import { colors } from "@/lib/theme/colors";
import {
  cardStyle,
  iconSize,
  MIN_TOUCH_TARGET,
  radius,
  ripple,
  spacing,
} from "@/lib/theme/styles";

const CATEGORY: Record<
  DiaryEntry["type"],
  { icon: IconName; color: string; container: string; labelKey: string; editKey: string }
> = {
  urination: {
    icon: "toilet",
    color: colors.category.urination.accent,
    container: colors.category.urination.container,
    labelKey: "entry.urination",
    editKey: "detail.editUrination",
  },
  fluid: {
    icon: "cup-water",
    color: colors.category.fluid.accent,
    container: colors.category.fluid.container,
    labelKey: "entry.fluid",
    editKey: "detail.editFluid",
  },
  leak: {
    icon: "water-alert",
    color: colors.category.leak.accent,
    container: colors.category.leak.container,
    labelKey: "entry.leak",
    editKey: "detail.editLeak",
  },
};

const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

interface EntryDetailPaneProps {
  /** The entry chosen in the list, or null when none is */
  entry: DiaryEntry | null;
  /** Space under the content (the screen's bottom inset) */
  bottomSpace: number;
}

/**
 * History on wide windows (an unfolded foldable in landscape, a tablet):
 * the pane beside the day's list that shows the chosen entry in full, with
 * a button that opens it for editing. On phones, tapping an entry opens the
 * edit form directly, so this pane is not used there.
 */
export function EntryDetailPane({ entry, bottomSpace }: EntryDetailPaneProps) {
  const { t } = useI18n();
  const router = useRouter();

  if (!entry) {
    return (
      <View style={styles.empty} testID="history-detail-empty">
        <Icon
          name="gesture-tap"
          size={40}
          color={colors.textTertiary}
        />
        <Text variant="headline" style={styles.centered}>
          {t("history.noEntrySelected")}
        </Text>
        <Text variant="subheadline" tone="secondary" style={styles.centered}>
          {t("history.noEntrySelectedHint")}
        </Text>
      </View>
    );
  }

  const config = CATEGORY[entry.type];
  const date = parseISO(entry.timestamp);
  const rows = detailRows(entry, t);
  const isEdited = (entry.editHistory?.length ?? 0) > 0;

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: bottomSpace }]}
      showsVerticalScrollIndicator={false}
      testID="history-detail"
    >
      {/* The entry's type, date and time */}
      <View style={styles.header} accessible accessibilityRole="header">
        <View style={[styles.iconBadge, { backgroundColor: config.container }]}>
          <Icon name={config.icon} size={iconSize.lg} color={config.color} />
        </View>
        <View style={styles.headerText}>
          <Text variant="title2">{t(config.labelKey)}</Text>
          <Text variant="subheadline" tone="secondary">
            {`${dateFormatters.weekdayDayMonth.format(date)}, ${dateFormatters.time.format(date)}`}
            {isEdited ? ` · ${t("common.edited")}` : ""}
          </Text>
        </View>
      </View>

      {/* What was logged, one row per field */}
      <View style={styles.card}>
        {rows.map((row, index) => (
          <View
            key={row.label}
            style={[styles.row, index > 0 ? styles.rowSeparator : undefined]}
            accessible
            accessibilityLabel={`${row.label}: ${row.value}`}
          >
            <Text variant="body" tone="secondary" style={styles.rowLabel}>
              {row.label}
            </Text>
            <Text variant="body" style={styles.rowValue}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>

      {entry.notes ? (
        <View style={styles.notes}>
          <Text variant="footnote" tone="secondary" style={styles.notesLabel}>
            {t("urination.notes")}
          </Text>
          <View style={styles.card}>
            <Text variant="body" style={styles.notesText}>
              {entry.notes}
            </Text>
          </View>
        </View>
      ) : null}

      <AnimatedPressable
        onPress={() => router.push(`/(modals)/entry/${entry.id}`)}
        style={styles.editButton}
        android_ripple={ripple}
        accessibilityRole="button"
        accessibilityLabel={t(config.editKey)}
        testID="history-detail-edit"
      >
        <Icon name="pencil-outline" size={iconSize.md} color={colors.primary.DEFAULT} />
        <Text variant="body" tone="accent" style={styles.editLabel}>
          {t(config.editKey)}
        </Text>
      </AnimatedPressable>
    </ScrollView>
  );
}

function detailRows(
  entry: DiaryEntry,
  t: (key: string, options?: Record<string, unknown>) => string
): { label: string; value: string }[] {
  const urgency = (value: number) => `${value} · ${t(`urgency.${value}`)}`;
  const yesNo = (value: boolean) => (value ? t("common.yes") : t("common.no"));
  const ml = (value: number) => `${numberFormatters.decimal.format(value)} ml`;

  switch (entry.type) {
    case "urination": {
      const volume = t(`urination.volume${capitalize(entry.volume)}`);
      return [
        {
          label: t("urination.volume"),
          value: entry.volumeMl ? `${volume} · ${ml(entry.volumeMl)}` : volume,
        },
        { label: t("urination.urgency"), value: urgency(entry.urgency) },
        { label: t("detail.leakage"), value: yesNo(entry.hadLeak) },
        { label: t("detail.pain"), value: yesNo(entry.hadPain) },
      ];
    }
    case "fluid":
      return [
        { label: t("fluid.drinkType"), value: t(`fluid.${entry.drinkType}`) },
        { label: t("fluid.amount"), value: ml(entry.amount) },
      ];
    case "leak":
      return [
        { label: t("leak.severity"), value: t(`leak.${entry.severity}`) },
        { label: t("leak.urgency"), value: urgency(entry.urgency) },
        ...(entry.activity
          ? [
              {
                label: t("history.activity"),
                value: t(`leak.activities.${entry.activity}`),
              },
            ]
          : []),
      ];
  }
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.xl,
  },
  centered: {
    textAlign: "center",
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    gap: spacing.xxs,
  },
  card: {
    ...cardStyle,
    borderRadius: radius.md,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  rowSeparator: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
  },
  rowLabel: {
    flexShrink: 1,
  },
  rowValue: {
    fontWeight: "500",
    textAlign: "right",
  },
  notes: {
    gap: spacing.xs,
  },
  notesLabel: {
    textTransform: Platform.OS === "ios" ? "uppercase" : "none",
    marginStart: spacing.lg,
  },
  notesText: {
    padding: spacing.lg,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    gap: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary.DEFAULT,
    overflow: "hidden",
  },
  editLabel: {
    fontWeight: "600",
  },
});
