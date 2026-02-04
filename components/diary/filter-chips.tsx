import * as React from 'react';
import { View, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { Text } from '@/components/ui/text';
import { colors } from '@/lib/theme/colors';
import { useI18n } from '@/lib/i18n/context';

export type FilterType = 'all' | 'urination' | 'fluid' | 'leak';

interface FilterChipsProps {
  selected: FilterType;
  onSelect: (filter: FilterType) => void;
  counts?: {
    all: number;
    urination: number;
    fluid: number;
    leak: number;
  };
}

interface ChipConfig {
  id: FilterType;
  labelKey: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
}

const chips: ChipConfig[] = [
  { id: 'all', labelKey: 'history.all', icon: 'format-list-bulleted', color: '#6B7280' },
  { id: 'urination', labelKey: 'entry.urination', icon: 'toilet', color: colors.primary.DEFAULT },
  { id: 'fluid', labelKey: 'entry.fluid', icon: 'cup-water', color: colors.secondary.DEFAULT },
  { id: 'leak', labelKey: 'entry.leak', icon: 'water-alert', color: colors.error },
];

export function FilterChips({ selected, onSelect, counts }: FilterChipsProps) {
  const { t } = useI18n();

  const handleSelect = React.useCallback((filter: FilterType) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelect(filter);
  }, [onSelect]);

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {chips.map((chip) => {
          const isSelected = selected === chip.id;
          const count = counts?.[chip.id];

          return (
            <Pressable
              key={chip.id}
              onPress={() => handleSelect(chip.id)}
              style={[
                styles.chip,
                isSelected && { backgroundColor: chip.color },
              ]}
            >
              <MaterialCommunityIcons
                name={chip.icon}
                size={14}
                color={isSelected ? '#FFFFFF' : chip.color}
              />
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextSelected,
                  !isSelected && { color: chip.color },
                ]}
              >
                {t(chip.labelKey)}
              </Text>
              {count !== undefined && count > 0 && (
                <Text style={[
                  styles.countText,
                  isSelected && styles.countTextSelected,
                ]}>
                  {count}
                </Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 44,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
    height: 44,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    height: 32,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginLeft: 2,
  },
  countTextSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
});
