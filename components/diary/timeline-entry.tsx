import * as React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { format, parseISO } from 'date-fns';
import * as Haptics from 'expo-haptics';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { Text } from '@/components/ui/text';
import { colors } from '@/lib/theme/colors';
import { useI18n } from '@/lib/i18n/context';
import type { DiaryEntry } from '@/lib/store/types';

interface TimelineEntryProps {
  entry: DiaryEntry;
  isLast?: boolean;
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

export function TimelineEntry({ entry, isLast = false, onPress }: TimelineEntryProps) {
  const { t } = useI18n();
  const config = entryConfig[entry.type];
  const time = format(parseISO(entry.timestamp), 'h:mm a');

  const handlePress = React.useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  }, [onPress]);

  // Get entry details based on type
  const getDetails = () => {
    switch (entry.type) {
      case 'urination':
        return (
          <View style={styles.detailsRow}>
            <Text style={styles.detailText}>
              {t(`urination.volume${entry.volume.charAt(0).toUpperCase() + entry.volume.slice(1)}`)}
            </Text>
            <View style={styles.detailDot} />
            <Text style={styles.detailText}>
              {t('urination.urgency')} {entry.urgency}
            </Text>
            {entry.hadLeak && (
              <>
                <View style={styles.detailDot} />
                <MaterialCommunityIcons name="water-alert" size={14} color={colors.error} />
              </>
            )}
          </View>
        );
      case 'fluid':
        return (
          <View style={styles.detailsRow}>
            <Text style={styles.detailText}>
              {t(`fluid.${entry.drinkType}`)}
            </Text>
            <View style={styles.detailDot} />
            <Text style={styles.detailHighlight}>{entry.amount}ml</Text>
          </View>
        );
      case 'leak':
        return (
          <View style={styles.detailsRow}>
            <Text style={styles.detailText}>
              {t(`leak.${entry.severity}`)}
            </Text>
            <View style={styles.detailDot} />
            <Text style={styles.detailText}>
              {t('urination.urgency')} {entry.urgency}
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      {/* Timeline */}
      <View style={styles.timeline}>
        {/* Dot */}
        <View style={[styles.dot, { backgroundColor: config.color }]} />
        {/* Line */}
        {!isLast && <View style={[styles.line, { backgroundColor: `${config.color}30` }]} />}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: `${config.color}15` }]}>
            <MaterialCommunityIcons name={config.icon} size={14} color={config.color} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.typeLabel}>{t(config.labelKey)}</Text>
            <Text style={styles.timeText}>{time}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={16} color="#D1D5DB" />
        </View>

        {/* Details */}
        {getDetails()}

        {/* Notes preview */}
        {entry.notes && (
          <Text style={styles.notes} numberOfLines={1}>
            {entry.notes}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingRight: 16,
  },
  timeline: {
    width: 24,
    alignItems: 'center',
    paddingTop: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    zIndex: 1,
  },
  line: {
    position: 'absolute',
    top: 20,
    width: 2,
    bottom: 0,
    borderRadius: 1,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 1,
        }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 8,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  timeText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
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
  detailDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 6,
  },
  notes: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 6,
  },
});
