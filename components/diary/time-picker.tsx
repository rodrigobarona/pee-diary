import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/text";
import { dateFormatters } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/context";
import { colors } from "@/lib/theme/colors";

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

  // Ensure value is a valid Date, fallback to current date/time
  const safeValue =
    value instanceof Date && !isNaN(value.getTime()) ? value : new Date();

  const formattedTime = dateFormatters.time.format(safeValue);
  const formattedDate = dateFormatters.short.format(safeValue);

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
        onChange(newDate);
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
        onChange(newDate);
      }
    },
    [onChange, safeValue]
  );

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
      <View style={styles.container}>
        {showLabel ? <Text style={styles.label}>{t("time.when")}</Text> : null}
        <View style={styles.chipsContainer}>
          <Pressable style={styles.chip}>
            <MaterialCommunityIcons
              name="calendar"
              size={16}
              color={colors.primary.DEFAULT}
            />
            <Text style={styles.chipText}>{formattedDate}</Text>
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
          </Pressable>

          <Pressable style={styles.chip}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={16}
              color={colors.secondary.DEFAULT}
            />
            <Text style={styles.chipText}>{formattedTime}</Text>
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
          </Pressable>
        </View>
      </View>
    );
  }

  // iOS: Use compact display - shows inline tappable picker that opens popover
  if (Platform.OS === "ios") {
    return (
      <View style={styles.container}>
        {showLabel ? <Text style={styles.label}>{t("time.when")}</Text> : null}
        <View style={styles.chipsContainer}>
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
      {showLabel ? <Text style={styles.label}>{t("time.when")}</Text> : null}
      <View style={styles.chipsContainer}>
        {/* Date Chip */}
        <Pressable style={styles.chip} onPress={() => setShowDatePicker(true)}>
          <MaterialCommunityIcons
            name="calendar"
            size={16}
            color={colors.primary.DEFAULT}
          />
          <Text style={styles.chipText}>{formattedDate}</Text>
        </Pressable>

        {/* Time Chip */}
        <Pressable style={styles.chip} onPress={() => setShowTimePicker(true)}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={16}
            color={colors.secondary.DEFAULT}
          />
          <Text style={styles.chipText}>{formattedTime}</Text>
        </Pressable>
      </View>

      {/* Android Date Picker Dialog */}
      {showDatePicker ? (
        <DateTimePicker
          value={safeValue}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      ) : null}

      {/* Android Time Picker Dialog */}
      {showTimePicker ? (
        <DateTimePicker
          value={safeValue}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: "500",
    color: "#374151",
  },
  chipsContainer: {
    flexDirection: "row",
    gap: 8,
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8, // Design brief: 8-12px - using 8 for chip elements
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    width: "100%",
    height: "100%",
    cursor: "pointer",
  },
});
