import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { isToday } from "date-fns";
import * as React from "react";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";

import { AnimatedPressable } from "@/components/ui/animated-pressable";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { a11yLabel } from "@/lib/a11y";
import { dateFormatters } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/context";
import { colors } from "@/lib/theme/colors";
import { MIN_TOUCH_TARGET, radius, spacing } from "@/lib/theme/styles";

// Above this font scale the "When" label sits above the date and time
const STACK_FONT_SCALE = 1.3;

interface TimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  showLabel?: boolean;
}

export function TimePicker({
  value,
  onChange,
  showLabel = true,
}: TimePickerProps) {
  const { t } = useI18n();
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [showTimePicker, setShowTimePicker] = React.useState(false);

  const { fontScale } = useWindowDimensions();
  const stacked = fontScale > STACK_FONT_SCALE;

  // Ensure value is a valid Date, fallback to current date/time
  const safeValue = React.useMemo(
    () =>
      value instanceof Date && !isNaN(value.getTime()) ? value : new Date(),
    [value]
  );

  // The device's clock (12/24 h) and a medium date ("11 Nov 2026"), which
  // is not ambiguous between day-month and month-day orders
  const formattedTime = dateFormatters.time.format(safeValue);
  const formattedDate = dateFormatters.medium.format(safeValue);
  const dateLabel = a11yLabel(t("time.date"), dateFormatters.long.format(safeValue));
  const timeLabel = a11yLabel(t("time.time"), formattedTime);
  // No time later than now on today's date
  const maximumTime = isToday(safeValue) ? new Date() : undefined;

  const handleDateChange = React.useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      // Android auto-dismisses
      if (Platform.OS === "android") {
        setShowDatePicker(false);
      }
      if (event.type === "set" && selectedDate) {
        // Keep current time, change only date
        const newDate = new Date(selectedDate);
        newDate.setHours(
          safeValue.getHours(),
          safeValue.getMinutes(),
          safeValue.getSeconds()
        );
        // Moving to today keeps the time only if it has already passed
        const now = new Date();
        onChange(newDate > now ? now : newDate);
      }
    },
    [onChange, safeValue]
  );

  const handleTimeChange = React.useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      // Android auto-dismisses
      if (Platform.OS === "android") {
        setShowTimePicker(false);
      }
      if (event.type === "set" && selectedDate) {
        // Keep current date, change only time
        // This ensures we don't lose the date if user changed it before changing time
        const newDate = new Date(safeValue);
        newDate.setHours(
          selectedDate.getHours(),
          selectedDate.getMinutes(),
          selectedDate.getSeconds()
        );
        // An entry cannot be in the future
        const now = new Date();
        onChange(newDate > now ? now : newDate);
      }
    },
    [onChange, safeValue]
  );

  const label = showLabel ? (
    <Text variant="body" style={styles.label} accessibilityRole="header">
      {t("time.when")}
    </Text>
  ) : null;

  // Helper to format date for input value (local date, not UTC)
  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Web fallback
  if (Platform.OS === "web") {
    return (
      <View style={[styles.container, stacked ? styles.containerStacked : undefined]}>
        {label}
        <View style={[styles.chipsContainer, stacked ? styles.chipsStacked : undefined]}>
          <View style={styles.chip}>
            <Icon name="calendar" size={16} color={colors.primary.DEFAULT} />
            <Text variant="subheadline" style={styles.chipText}>
              {formattedDate}
            </Text>
            <input
              type="date"
              value={getLocalDateString(safeValue)}
              onChange={(e) => {
                // Parse date parts and set them on a copy of the current date
                // This preserves the time component correctly
                const [year, month, day] = e.target.value
                  .split("-")
                  .map(Number);
                const newDate = new Date(safeValue);
                newDate.setFullYear(year, month - 1, day);
                onChange(newDate);
              }}
              style={styles.hiddenInput as any}
            />
          </View>

          <View style={styles.chip}>
            <Icon name="clock-outline" size={16} color={colors.primary.DEFAULT} />
            <Text variant="subheadline" style={styles.chipText}>
              {formattedTime}
            </Text>
            <input
              type="time"
              value={`${safeValue
                .getHours()
                .toString()
                .padStart(2, "0")}:${safeValue
                .getMinutes()
                .toString()
                .padStart(2, "0")}`}
              onChange={(e) => {
                const [hours, minutes] = e.target.value.split(":").map(Number);
                const newDate = new Date(safeValue);
                newDate.setHours(hours, minutes);
                onChange(newDate);
              }}
              style={styles.hiddenInput as any}
            />
          </View>
        </View>
      </View>
    );
  }

  // iOS: Use compact display - shows inline tappable picker that opens popover
  if (Platform.OS === "ios") {
    return (
      <View style={[styles.container, stacked ? styles.containerStacked : undefined]}>
        {label}
        <View style={[styles.chipsContainer, stacked ? styles.chipsStacked : undefined]}>
          <DateTimePicker
            value={safeValue}
            mode="date"
            display="compact"
            onChange={handleDateChange}
            maximumDate={new Date()}
            themeVariant="light"
            accentColor={colors.primary.DEFAULT}
          />
          <DateTimePicker
            value={safeValue}
            mode="time"
            display="compact"
            onChange={handleTimeChange}
            maximumDate={maximumTime}
            themeVariant="light"
            accentColor={colors.primary.DEFAULT}
          />
        </View>
      </View>
    );
  }

  // Android: Custom chips that trigger native dialog
  return (
    <View style={[styles.container, stacked ? styles.containerStacked : undefined]}>
      {label}
      <View style={[styles.chipsContainer, stacked ? styles.chipsStacked : undefined]}>
        {/* Date Chip */}
        <AnimatedPressable
          style={styles.chip}
          onPress={() => setShowDatePicker(true)}
          accessibilityRole="button"
          accessibilityLabel={dateLabel}
        >
          <Icon name="calendar" size={16} color={colors.primary.DEFAULT} />
          <Text variant="subheadline" style={styles.chipText}>
            {formattedDate}
          </Text>
        </AnimatedPressable>

        {/* Time Chip */}
        <AnimatedPressable
          style={styles.chip}
          onPress={() => setShowTimePicker(true)}
          accessibilityRole="button"
          accessibilityLabel={timeLabel}
        >
          <Icon name="clock-outline" size={16} color={colors.primary.DEFAULT} />
          <Text variant="subheadline" style={styles.chipText}>
            {formattedTime}
          </Text>
        </AnimatedPressable>
      </View>

      {/* Android: Material 3 date and time pickers (need the Material 3 app
          theme from plugins/with-material3-theme) */}
      {showDatePicker ? <DateTimePicker
          value={safeValue}
          mode="date"
          design="material"
          title={t("time.date")}
          onChange={handleDateChange}
          maximumDate={new Date()}
        /> : null}

      {showTimePicker ? <DateTimePicker
          value={safeValue}
          mode="time"
          design="material"
          title={t("time.time")}
          onChange={handleTimeChange}
        /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: spacing.md,
    rowGap: spacing.sm,
  },
  containerStacked: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  label: {
    fontWeight: "500",
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    flexGrow: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  chipsStacked: {
    justifyContent: "flex-start",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
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
