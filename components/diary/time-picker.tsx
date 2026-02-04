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

interface TimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  showLabel?: boolean;
}

export function TimePicker({ value, onChange, showLabel = true }: TimePickerProps) {
  const { t } = useI18n();
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [showTimePicker, setShowTimePicker] = React.useState(false);

  const formattedTime = dateFormatters.time.format(value);
  const formattedDate = dateFormatters.short.format(value);

  const handleDateChange = React.useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      // Android auto-dismisses
      if (Platform.OS === 'android') {
        setShowDatePicker(false);
      }
      if (event.type === 'set' && selectedDate) {
        // Keep current time, change only date
        const newDate = new Date(selectedDate);
        newDate.setHours(value.getHours(), value.getMinutes(), value.getSeconds());
        onChange(newDate);
      }
    },
    [onChange, value]
  );

  const handleTimeChange = React.useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      // Android auto-dismisses
      if (Platform.OS === 'android') {
        setShowTimePicker(false);
      }
      if (event.type === 'set' && selectedDate) {
        onChange(selectedDate);
      }
    },
    [onChange]
  );

  // Web fallback
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        {showLabel && <Text style={styles.label}>{t('time.when')}</Text>}
        <View style={styles.chipsContainer}>
          <Pressable style={styles.chip}>
            <MaterialCommunityIcons name="calendar" size={16} color={colors.primary.DEFAULT} />
            <Text style={styles.chipText}>{formattedDate}</Text>
            <input
              type="date"
              value={value.toISOString().split('T')[0]}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                newDate.setHours(value.getHours(), value.getMinutes());
                onChange(newDate);
              }}
              style={styles.hiddenInput as any}
            />
          </Pressable>

          <Pressable style={styles.chip}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={colors.secondary.DEFAULT} />
            <Text style={styles.chipText}>{formattedTime}</Text>
            <input
              type="time"
              value={`${value.getHours().toString().padStart(2, '0')}:${value.getMinutes().toString().padStart(2, '0')}`}
              onChange={(e) => {
                const [hours, minutes] = e.target.value.split(':').map(Number);
                const newDate = new Date(value);
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
  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        {showLabel && <Text style={styles.label}>{t('time.when')}</Text>}
        <View style={styles.chipsContainer}>
          <DateTimePicker
            value={value}
            mode="date"
            display="compact"
            onChange={handleDateChange}
            maximumDate={new Date()}
            themeVariant="light"
            accentColor={colors.primary.DEFAULT}
          />
          <DateTimePicker
            value={value}
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
      {showLabel && <Text style={styles.label}>{t('time.when')}</Text>}
      <View style={styles.chipsContainer}>
        {/* Date Chip */}
        <Pressable style={styles.chip} onPress={() => setShowDatePicker(true)}>
          <MaterialCommunityIcons name="calendar" size={16} color={colors.primary.DEFAULT} />
          <Text style={styles.chipText}>{formattedDate}</Text>
        </Pressable>

        {/* Time Chip */}
        <Pressable style={styles.chip} onPress={() => setShowTimePicker(true)}>
          <MaterialCommunityIcons name="clock-outline" size={16} color={colors.secondary.DEFAULT} />
          <Text style={styles.chipText}>{formattedTime}</Text>
        </Pressable>
      </View>

      {/* Android Date Picker Dialog */}
      {showDatePicker && (
        <DateTimePicker
          value={value}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      {/* Android Time Picker Dialog */}
      {showTimePicker && (
        <DateTimePicker
          value={value}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
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
