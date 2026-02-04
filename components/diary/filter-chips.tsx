import * as React from 'react';
import { View, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
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
  const [showRightFade, setShowRightFade] = React.useState(true);
  const [showLeftFade, setShowLeftFade] = React.useState(false);

  const handleSelect = React.useCallback((filter: FilterType) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelect(filter);
  }, [onSelect]);

  const handleScroll = React.useCallback((event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isAtStart = contentOffset.x <= 5;
    const isAtEnd = contentOffset.x + layoutMeasurement.width >= contentSize.width - 5;
    
    setShowLeftFade(!isAtStart);
    setShowRightFade(!isAtEnd);
  }, []);

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
        onScroll={handleScroll}
        scrollEventThrottle={16}
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

      {/* Left fade indicator */}
      {showLeftFade && (
        <LinearGradient
          colors={['#F9FAFB', 'rgba(249,250,251,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.fadeLeft}
          pointerEvents="none"
        />
      )}

      {/* Right fade indicator */}
      {showRightFade && (
        <LinearGradient
          colors={['rgba(249,250,251,0)', '#F9FAFB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.fadeRight}
          pointerEvents="none"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 48,
    position: 'relative',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
    height: 48,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
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
  fadeLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 24,
  },
  fadeRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 24,
  },
});
