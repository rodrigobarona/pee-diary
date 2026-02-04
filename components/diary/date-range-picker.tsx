import * as React from 'react';
import { View, Pressable, Platform, StyleSheet } from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { Text } from '@/components/ui/text';
import { colors } from '@/lib/theme/colors';
import { dateFormatters } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/context';

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
  maxDate = new Date(),
}: DateRangePickerProps) {
  const { t } = useI18n();
  const [showStartPicker, setShowStartPicker] = React.useState(false);
  const [showEndPicker, setShowEndPicker] = React.useState(false);

  const formattedStartDate = dateFormatters.short.format(startDate);
  const formattedEndDate = dateFormatters.short.format(endDate);

  const handleStartDateChange = React.useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (Platform.OS === 'android') {
        setShowStartPicker(false);
      }
      if (event.type === 'set' && selectedDate) {
        // Ensure start date is not after end date
        if (selectedDate > endDate) {
          onEndDateChange(selectedDate);
        }
        onStartDateChange(selectedDate);
      }
    },
    [endDate, onStartDateChange, onEndDateChange]
  );

  const handleEndDateChange = React.useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (Platform.OS === 'android') {
        setShowEndPicker(false);
      }
      if (event.type === 'set' && selectedDate) {
        // Ensure end date is not before start date
        if (selectedDate < startDate) {
          onStartDateChange(selectedDate);
        }
        onEndDateChange(selectedDate);
      }
    },
    [startDate, onStartDateChange, onEndDateChange]
  );

  // Web fallback
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.dateRow}>
          <Text style={styles.label}>{t('export.startDate')}</Text>
          <Pressable style={styles.chip}>
            <MaterialCommunityIcons
              name="calendar"
              size={16}
              color={colors.primary.DEFAULT}
            />
            <Text style={styles.chipText}>{formattedStartDate}</Text>
            <input
              type="date"
              value={startDate.toISOString().split('T')[0]}
              max={endDate.toISOString().split('T')[0]}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                onStartDateChange(newDate);
              }}
              style={styles.hiddenInput as React.CSSProperties}
            />
          </Pressable>
        </View>

        <View style={styles.dateRow}>
          <Text style={styles.label}>{t('export.endDate')}</Text>
          <Pressable style={styles.chip}>
            <MaterialCommunityIcons
              name="calendar"
              size={16}
              color={colors.primary.DEFAULT}
            />
            <Text style={styles.chipText}>{formattedEndDate}</Text>
            <input
              type="date"
              value={endDate.toISOString().split('T')[0]}
              min={startDate.toISOString().split('T')[0]}
              max={maxDate.toISOString().split('T')[0]}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                onEndDateChange(newDate);
              }}
              style={styles.hiddenInput as React.CSSProperties}
            />
          </Pressable>
        </View>
      </View>
    );
  }

  // iOS: Use compact display
  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        <View style={styles.dateRow}>
          <Text style={styles.label}>{t('export.startDate')}</Text>
          <DateTimePicker
            value={startDate}
            mode="date"
            display="compact"
            onChange={handleStartDateChange}
            minimumDate={minDate}
            maximumDate={endDate}
            themeVariant="light"
            accentColor={colors.primary.DEFAULT}
          />
        </View>

        <View style={styles.dateRow}>
          <Text style={styles.label}>{t('export.endDate')}</Text>
          <DateTimePicker
            value={endDate}
            mode="date"
            display="compact"
            onChange={handleEndDateChange}
            minimumDate={startDate}
            maximumDate={maxDate}
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
        <Text style={styles.label}>{t('export.startDate')}</Text>
        <Pressable style={styles.chip} onPress={() => setShowStartPicker(true)}>
          <MaterialCommunityIcons
            name="calendar"
            size={16}
            color={colors.primary.DEFAULT}
          />
          <Text style={styles.chipText}>{formattedStartDate}</Text>
        </Pressable>
      </View>

      <View style={styles.dateRow}>
        <Text style={styles.label}>{t('export.endDate')}</Text>
        <Pressable style={styles.chip} onPress={() => setShowEndPicker(true)}>
          <MaterialCommunityIcons
            name="calendar"
            size={16}
            color={colors.primary.DEFAULT}
          />
          <Text style={styles.chipText}>{formattedEndDate}</Text>
        </Pressable>
      </View>

      {/* Android Date Picker Dialogs */}
      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={handleStartDateChange}
          minimumDate={minDate}
          maximumDate={endDate}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={handleEndDateChange}
          minimumDate={startDate}
          maximumDate={maxDate}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: '100%',
    cursor: 'pointer',
  },
});
