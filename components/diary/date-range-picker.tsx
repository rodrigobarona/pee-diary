import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as React from "react";
import { Platform, StyleSheet, View } from "react-native";

import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { a11yLabel } from "@/lib/a11y";
import { colors } from "@/lib/theme/colors";
import { MIN_TOUCH_TARGET, radius, spacing } from "@/lib/theme/styles";
import { dateFormatters } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/context";
import { isDayKey, parseDayKey, toDayKey } from "@/lib/utils/day";

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  minDate,
  maxDate,
}: DateRangePickerProps) {
  const { t } = useI18n();
  const [showStartPicker, setShowStartPicker] = React.useState(false);
  const [showEndPicker, setShowEndPicker] = React.useState(false);

  // Ensure dates are valid, fallback to current date (the latest date
  // defaults to today)
  const safeStartDate = React.useMemo(() => validOrNow(startDate), [startDate]);
  const safeEndDate = React.useMemo(() => validOrNow(endDate), [endDate]);
  const safeMaxDate = React.useMemo(() => validOrNow(maxDate), [maxDate]);

  // A medium date ("11 Nov 2026"), not the ambiguous numeric one
  const formattedStartDate = dateFormatters.medium.format(safeStartDate);
  const formattedEndDate = dateFormatters.medium.format(safeEndDate);
  const startLabel = a11yLabel(
    t("export.startDate"),
    dateFormatters.long.format(safeStartDate),
  );
  const endLabel = a11yLabel(
    t("export.endDate"),
    dateFormatters.long.format(safeEndDate),
  );

  const handleStartDateChange = React.useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (Platform.OS === "android") {
        setShowStartPicker(false);
      }
      if (event.type === "set" && selectedDate) {
        // Ensure start date is not after end date
        if (selectedDate > safeEndDate) {
          onEndDateChange(selectedDate);
        }
        onStartDateChange(selectedDate);
      }
    },
    [safeEndDate, onStartDateChange, onEndDateChange],
  );

  const handleEndDateChange = React.useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (Platform.OS === "android") {
        setShowEndPicker(false);
      }
      if (event.type === "set" && selectedDate) {
        // Ensure end date is not before start date
        if (selectedDate < safeStartDate) {
          onStartDateChange(selectedDate);
        }
        onEndDateChange(selectedDate);
      }
    },
    [safeStartDate, onStartDateChange, onEndDateChange],
  );

  // Web fallback
  if (Platform.OS === "web") {
    return (
      <View style={styles.container}>
        <View style={styles.dateRow}>
          <Text variant="body" style={styles.label}>
            {t("export.startDate")}
          </Text>
          <View style={styles.chip}>
            <Icon name="calendar" size={16} color={colors.primary.DEFAULT} />
            <Text variant="subheadline" style={styles.chipText}>
              {formattedStartDate}
            </Text>
            <input
              type="date"
              value={toDayKey(safeStartDate)}
              max={toDayKey(safeEndDate)}
              onChange={(e) => {
                if (!isDayKey(e.target.value)) return;
                onStartDateChange(parseDayKey(e.target.value));
              }}
              style={styles.hiddenInput as React.CSSProperties}
            />
          </View>
        </View>

        <View style={styles.dateRow}>
          <Text variant="body" style={styles.label}>
            {t("export.endDate")}
          </Text>
          <View style={styles.chip}>
            <Icon name="calendar" size={16} color={colors.primary.DEFAULT} />
            <Text variant="subheadline" style={styles.chipText}>
              {formattedEndDate}
            </Text>
            <input
              type="date"
              value={toDayKey(safeEndDate)}
              min={toDayKey(safeStartDate)}
              max={toDayKey(safeMaxDate)}
              onChange={(e) => {
                if (!isDayKey(e.target.value)) return;
                // The whole last day is included
                const newDate = parseDayKey(e.target.value);
                newDate.setHours(23, 59, 59, 999);
                onEndDateChange(newDate);
              }}
              style={styles.hiddenInput as React.CSSProperties}
            />
          </View>
        </View>
      </View>
    );
  }

  // iOS: Use compact display
  if (Platform.OS === "ios") {
    return (
      <View style={styles.container}>
        <View style={styles.dateRow}>
          <Text variant="body" style={styles.label}>
            {t("export.startDate")}
          </Text>
          <DateTimePicker
            value={safeStartDate}
            mode="date"
            display="compact"
            onChange={handleStartDateChange}
            minimumDate={minDate}
            maximumDate={safeEndDate}
            themeVariant="light"
            accentColor={colors.primary.DEFAULT}
          />
        </View>

        <View style={styles.dateRow}>
          <Text variant="body" style={styles.label}>
            {t("export.endDate")}
          </Text>
          <DateTimePicker
            value={safeEndDate}
            mode="date"
            display="compact"
            onChange={handleEndDateChange}
            minimumDate={safeStartDate}
            maximumDate={safeMaxDate}
            themeVariant="light"
            accentColor={colors.primary.DEFAULT}
          />
        </View>
      </View>
    );
  }

  // Android: Custom chips that trigger native dialog
  return (
    <View style={styles.container}>
      <View style={styles.dateRow}>
        <Text variant="body" style={styles.label} {...hiddenLabel}>
          {t("export.startDate")}
        </Text>
        <AnimatedPressable
          style={styles.chip}
          onPress={() => setShowStartPicker(true)}
          accessibilityRole="button"
          accessibilityLabel={startLabel}
        >
          <Icon name="calendar" size={16} color={colors.primary.DEFAULT} />
          <Text variant="subheadline" style={styles.chipText}>
            {formattedStartDate}
          </Text>
        </AnimatedPressable>
      </View>

      <View style={styles.dateRow}>
        <Text variant="body" style={styles.label} {...hiddenLabel}>
          {t("export.endDate")}
        </Text>
        <AnimatedPressable
          style={styles.chip}
          onPress={() => setShowEndPicker(true)}
          accessibilityRole="button"
          accessibilityLabel={endLabel}
        >
          <Icon name="calendar" size={16} color={colors.primary.DEFAULT} />
          <Text variant="subheadline" style={styles.chipText}>
            {formattedEndDate}
          </Text>
        </AnimatedPressable>
      </View>

      {/* Android: Material 3 date pickers */}
      {showStartPicker ? <DateTimePicker
          value={safeStartDate}
          mode="date"
          design="material"
          title={t("export.startDate")}
          onChange={handleStartDateChange}
          minimumDate={minDate}
          maximumDate={safeEndDate}
        /> : null}

      {showEndPicker ? <DateTimePicker
          value={safeEndDate}
          mode="date"
          design="material"
          title={t("export.endDate")}
          onChange={handleEndDateChange}
          minimumDate={safeStartDate}
          maximumDate={safeMaxDate}
        /> : null}
    </View>
  );
}

// The chip's own label names the date ("Start date, 1 November 2026"), so
// the visible row label is not read twice
const hiddenLabel = {
  importantForAccessibility: "no" as const,
};

function validOrNow(date: Date | undefined): Date {
  return date instanceof Date && !isNaN(date.getTime()) ? date : new Date();
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  dateRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: spacing.md,
    rowGap: spacing.sm,
  },
  label: {
    fontWeight: "500",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  chipText: {
    fontWeight: "500",
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    width: "100%",
    height: "100%",
    cursor: "pointer",
  },
});
