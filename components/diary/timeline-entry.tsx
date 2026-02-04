import * as React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { format, parseISO, getHours } from 'date-fns';
import * as Haptics from 'expo-haptics';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { Text } from '@/components/ui/text';
import { colors } from '@/lib/theme/colors';
import { useI18n } from '@/lib/i18n/context';
import type { DiaryEntry } from '@/lib/store/types';

interface TimelineEntryProps {
  entry: DiaryEntry;
  isLast?: boolean;
  isFirst?: boolean;
  showTime?: boolean;
  onPress?: () => void;
}

const entryConfig = {
  urination: {
    icon: 'toilet' as const,
    color: colors.primary.DEFAULT,
    labelKey: 'entry.urination',
  },
  fluid: {
    icon: 'cup-water' as const,
    color: colors.secondary.DEFAULT,
    labelKey: 'entry.fluid',
  },
  leak: {
    icon: 'water-alert' as const,
    color: colors.error,
    labelKey: 'entry.leak',
  },
};

export function TimelineEntry({ 
  entry, 
  isLast = false, 
  isFirst = false,
  showTime = true,
  onPress 
}: TimelineEntryProps) {
  const { t, locale } = useI18n();
  const config = entryConfig[entry.type];
  // Use 12-hour format for English, 24-hour for Spanish/Portuguese
  const timeFormat = locale === 'en' ? 'h:mm a' : 'HH:mm';
  const time = format(parseISO(entry.timestamp), timeFormat);

  const handlePress = React.useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  }, [onPress]);

  // Get compact details based on type
  const getCompactDetails = () => {
    switch (entry.type) {
      case 'urination':
        return (
          <>
            <Text style={styles.detailText}>
              {t(`urination.volume${entry.volume.charAt(0).toUpperCase() + entry.volume.slice(1)}`)}
            </Text>
            <Text style={styles.detailSeparator}>·</Text>
            <Text style={styles.detailText}>
              Lv {entry.urgency}
            </Text>
            {entry.hadLeak && (
              <>
                <Text style={styles.detailSeparator}>·</Text>
                <MaterialCommunityIcons name="water-alert" size={12} color={colors.error} />
              </>
            )}
          </>
        );
      case 'fluid':
        return (
          <>
            <Text style={styles.detailText}>
              {t(`fluid.${entry.drinkType}`)}
            </Text>
            <Text style={styles.detailSeparator}>·</Text>
            <Text style={styles.detailHighlight}>{entry.amount}ml</Text>
          </>
        );
      case 'leak':
        return (
          <>
            <Text style={styles.detailText}>
              {t(`leak.${entry.severity}`)}
            </Text>
            <Text style={styles.detailSeparator}>·</Text>
            <Text style={styles.detailText}>
              Lv {entry.urgency}
            </Text>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.row}>
      {/* Left side: Time + Track */}
      <View style={styles.leftColumn}>
        {/* Top connector line (invisible placeholder when first) */}
        <View style={[styles.trackLineTop, isFirst && styles.trackLineHidden]} />
        
        {/* Time + Dot row (aligned horizontally) */}
        <View style={styles.timeAndDot}>
          <View style={styles.timeColumn}>
            {showTime && <Text style={styles.timeText}>{time}</Text>}
          </View>
          <View style={[styles.trackDot, { backgroundColor: config.color }]}>
            <View style={[styles.trackDotInner, { backgroundColor: config.color }]} />
          </View>
        </View>
        
        {/* Bottom connector line (invisible placeholder when last) */}
        <View style={[styles.trackLineBottom, isLast && styles.trackLineHidden]} />
      </View>

      {/* Content */}
      <Pressable onPress={handlePress} style={styles.content}>
        <View style={styles.contentInner}>
          {/* Icon */}
          <View style={[styles.iconBadge, { backgroundColor: `${config.color}12` }]}>
            <MaterialCommunityIcons name={config.icon} size={16} color={config.color} />
          </View>
          
          {/* Details */}
          <View style={styles.details}>
            <Text style={styles.typeLabel}>{t(config.labelKey)}</Text>
            <View style={styles.detailsRow}>
              {getCompactDetails()}
            </View>
          </View>

          {/* Arrow */}
          <MaterialCommunityIcons name="chevron-right" size={18} color="#D1D5DB" />
        </View>

        {/* Notes */}
        {entry.notes && (
          <Text style={styles.notes} numberOfLines={1}>
            💬 {entry.notes}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

// Time period header component
interface TimePeriodHeaderProps {
  period: 'morning' | 'afternoon' | 'evening' | 'night';
  count: number;
}

const periodConfig = {
  morning: { icon: 'weather-sunny' as const, color: '#F59E0B', labelKey: 'timePeriod.morning' },
  afternoon: { icon: 'white-balance-sunny' as const, color: '#F97316', labelKey: 'timePeriod.afternoon' },
  evening: { icon: 'weather-sunset' as const, color: '#8B5CF6', labelKey: 'timePeriod.evening' },
  night: { icon: 'weather-night' as const, color: '#6366F1', labelKey: 'timePeriod.night' },
};

export function TimePeriodHeader({ period, count }: TimePeriodHeaderProps) {
  const { t } = useI18n();
  const config = periodConfig[period];

  return (
    <View style={periodStyles.container}>
      <View style={periodStyles.iconContainer}>
        <MaterialCommunityIcons name={config.icon} size={14} color={config.color} />
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
export function getTimePeriod(timestamp: string): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = getHours(parseISO(timestamp));
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    minHeight: 56,
  },
  // Left column containing time + track
  leftColumn: {
    width: 80,
    alignItems: 'flex-end',
  },
  // Time and dot aligned horizontally
  timeAndDot: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Time column - wide enough for "12:30 AM"
  timeColumn: {
    width: 60,
    alignItems: 'flex-end',
    paddingRight: 6,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  // Track elements
  trackLineTop: {
    width: 2,
    height: 12,
    backgroundColor: '#E5E7EB',
    alignSelf: 'flex-end',
    marginRight: 4,
  },
  trackDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackDotInner: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    opacity: 0.4,
  },
  trackLineBottom: {
    flex: 1,
    minHeight: 12,
    width: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'flex-end',
    marginRight: 4,
  },
  trackLineHidden: {
    backgroundColor: 'transparent',
  },
  // Content
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginLeft: 8,
    marginRight: 12,
    marginBottom: 8,
    padding: 12,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.06)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 3,
          elevation: 1,
        }),
  },
  contentInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
    marginLeft: 10,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
  },
  detailHighlight: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  detailSeparator: {
    fontSize: 12,
    color: '#D1D5DB',
    marginHorizontal: 4,
  },
  notes: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
});

const periodStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  badge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
    marginLeft: 12,
  },
});
