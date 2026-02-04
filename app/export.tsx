import * as React from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { useShallow } from 'zustand/react/shallow';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { format } from 'date-fns';

import { Text } from '@/components/ui/text';
import { DateRangePicker } from '@/components/diary/date-range-picker';
import { useDiaryStore, useStoreHydrated } from '@/lib/store';
import { useI18n } from '@/lib/i18n/context';
import { colors } from '@/lib/theme/colors';
import {
  filterEntriesByDateRange,
  exportAndShare,
  getDateRangePreset,
  type ExportFormat,
} from '@/lib/utils/export';

type PresetKey = 'last7days' | 'last30days' | 'thisMonth' | 'allTime' | 'custom';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Row option component matching app style
interface OptionRowProps {
  icon: string;
  label: string;
  isSelected: boolean;
  onPress: () => void;
  color?: string;
}

function OptionRow({ icon, label, isSelected, onPress, color }: OptionRowProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150 });
  };

  const iconColor = color || (isSelected ? colors.primary.DEFAULT : '#6B7280');

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.optionRow, animatedStyle]}
    >
      <View
        style={[
          styles.optionIcon,
          {
            backgroundColor: isSelected ? `${iconColor}15` : '#F3F4F6',
          },
        ]}
      >
        <MaterialCommunityIcons name={icon as any} size={22} color={iconColor} />
      </View>
      <Text
        style={[
          styles.optionLabel,
          isSelected && { color: colors.primary.DEFAULT, fontWeight: '600' },
        ]}
      >
        {label}
      </Text>
      <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
        {isSelected && <View style={styles.radioInner} />}
      </View>
    </AnimatedPressable>
  );
}

export default function ExportScreen() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const isHydrated = useStoreHydrated();
  const entries = useDiaryStore(useShallow((state) => state.entries));

  // State
  const [activePreset, setActivePreset] = React.useState<PresetKey>('last30days');
  const [startDate, setStartDate] = React.useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 29);
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const [endDate, setEndDate] = React.useState(() => {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date;
  });
  const [selectedFormat, setSelectedFormat] = React.useState<ExportFormat>('pdf');
  const [isExporting, setIsExporting] = React.useState(false);

  // Animation for custom range
  const customRangeHeight = useSharedValue(0);

  // Filter entries
  const filteredEntries = React.useMemo(() => {
    if (!isHydrated) return [];
    return filterEntriesByDateRange(entries, startDate, endDate);
  }, [entries, startDate, endDate, isHydrated]);

  // Get earliest entry date
  const minDate = React.useMemo(() => {
    if (entries.length === 0) return undefined;
    const timestamps = entries.map((e) => new Date(e.timestamp).getTime());
    return new Date(Math.min(...timestamps));
  }, [entries]);

  // Handle preset selection
  const handlePresetSelect = React.useCallback(
    (preset: PresetKey) => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      setActivePreset(preset);

      if (preset === 'custom') {
        customRangeHeight.value = withSpring(140, { damping: 18, stiffness: 120 });
      } else {
        customRangeHeight.value = withTiming(0, { duration: 200 });
        const range = getDateRangePreset(preset, entries);
        setStartDate(range.start);
        setEndDate(range.end);
      }
    },
    [entries, customRangeHeight]
  );

  // Handle format selection
  const handleFormatSelect = React.useCallback((fmt: ExportFormat) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedFormat(fmt);
  }, []);

  // Handle export
  const handleExport = React.useCallback(async () => {
    if (filteredEntries.length === 0) {
      Alert.alert(t('export.title'), t('export.noEntries'));
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsExporting(true);

    try {
      const result = await exportAndShare(filteredEntries, selectedFormat, {
        start: startDate,
        end: endDate,
      });

      if (result.success) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else if (result.error) {
        Alert.alert(t('common.error'), result.error);
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(t('common.error'), t('export.error'));
    } finally {
      setIsExporting(false);
    }
  }, [filteredEntries, selectedFormat, startDate, endDate, t]);

  // Animated style for custom range
  const customRangeStyle = useAnimatedStyle(() => ({
    height: customRangeHeight.value,
    opacity: interpolate(customRangeHeight.value, [0, 140], [0, 1]),
    overflow: 'hidden',
  }));

  // Preset options
  const presets: { key: PresetKey; label: string; icon: string }[] = [
    { key: 'last7days', label: t('export.last7Days'), icon: 'calendar-week' },
    { key: 'last30days', label: t('export.last30Days'), icon: 'calendar-month' },
    { key: 'thisMonth', label: t('export.thisMonth'), icon: 'calendar-today' },
    { key: 'allTime', label: t('export.allTime'), icon: 'calendar-star' },
    { key: 'custom', label: t('export.customRange'), icon: 'calendar-edit' },
  ];

  // Format options
  const formats: { key: ExportFormat; label: string; icon: string; color: string }[] = [
    { key: 'pdf', label: `${t('export.pdf')} - ${t('export.pdfDesc')}`, icon: 'file-pdf-box', color: '#DC2626' },
    { key: 'csv', label: `${t('export.csv')} - ${t('export.csvDesc')}`, icon: 'file-delimited', color: '#059669' },
    { key: 'json', label: `${t('export.json')} - ${t('export.jsonDesc')}`, icon: 'code-json', color: '#7C3AED' },
  ];

  // Date range text
  const dateRangeText = `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 20) + 16 : 20,
          paddingTop: Platform.OS === 'ios' ? 50 : 24,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={styles.title}>{t('export.title')}</Text>
      <Text style={styles.subtitle}>{t('settings.exportDescription')}</Text>

      {/* Date Range Section */}
      <Text style={styles.sectionTitle}>{t('export.dateRange')}</Text>
      <View style={styles.card}>
        {presets.map((preset, index) => (
          <React.Fragment key={preset.key}>
            <OptionRow
              icon={preset.icon}
              label={preset.label}
              isSelected={activePreset === preset.key}
              onPress={() => handlePresetSelect(preset.key)}
            />
            {index < presets.length - 1 && <View style={styles.separator} />}
          </React.Fragment>
        ))}

        {/* Custom Date Range (animated) */}
        <Animated.View style={customRangeStyle}>
          <View style={styles.customRangePicker}>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={(date) => {
                setStartDate(date);
                if (date > endDate) setEndDate(date);
              }}
              onEndDateChange={(date) => {
                setEndDate(date);
                if (date < startDate) setStartDate(date);
              }}
              minDate={minDate}
              maxDate={new Date()}
            />
          </View>
        </Animated.View>
      </View>

      {/* Selected Range */}
      <View style={styles.selectedRange}>
        <MaterialCommunityIcons
          name="calendar-range"
          size={16}
          color={colors.primary.DEFAULT}
        />
        <Text style={styles.selectedRangeText}>{dateRangeText}</Text>
        <Text style={styles.entryCount}>
          {isHydrated
            ? `${filteredEntries.length} ${filteredEntries.length === 1 ? 'entry' : 'entries'}`
            : '...'}
        </Text>
      </View>

      {/* Format Section */}
      <Text style={styles.sectionTitle}>{t('export.format')}</Text>
      <View style={styles.card}>
        {formats.map((fmt, index) => (
          <React.Fragment key={fmt.key}>
            <OptionRow
              icon={fmt.icon}
              label={fmt.label}
              isSelected={selectedFormat === fmt.key}
              onPress={() => handleFormatSelect(fmt.key)}
              color={fmt.color}
            />
            {index < formats.length - 1 && <View style={styles.separator} />}
          </React.Fragment>
        ))}
      </View>

      {/* Export Button */}
      <Pressable
        style={[
          styles.exportButton,
          (filteredEntries.length === 0 || isExporting) && styles.exportButtonDisabled,
        ]}
        onPress={handleExport}
        disabled={filteredEntries.length === 0 || isExporting}
      >
        {isExporting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <MaterialCommunityIcons name="share-variant" size={22} color="#FFFFFF" />
        )}
        <Text style={styles.exportButtonText}>
          {isExporting ? t('export.exporting') : t('export.exportAndShare')}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: colors.primary.DEFAULT,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary.DEFAULT,
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 70,
  },
  customRangePicker: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  selectedRange: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: `${colors.primary.DEFAULT}08`,
    borderRadius: 12,
    marginBottom: 20,
  },
  selectedRangeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary.DEFAULT,
  },
  entryCount: {
    fontSize: 13,
    color: '#6B7280',
  },
  exportButton: {
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
  },
  exportButtonDisabled: {
    opacity: 0.5,
  },
  exportButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
