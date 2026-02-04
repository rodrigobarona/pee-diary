import * as React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { Text } from '@/components/ui/text';
import { useI18n } from '@/lib/i18n/context';
import type { DrinkType } from '@/lib/store/types';

// Drink types with colors for visual distinction
const drinkTypes: {
  type: DrinkType;
  icon: string;
  labelKey: string;
  color: string;
  bgColor: string;
}[] = [
  { type: 'water', icon: 'water', labelKey: 'fluid.water', color: '#0EA5E9', bgColor: '#E0F2FE' },
  { type: 'coffee', icon: 'coffee', labelKey: 'fluid.coffee', color: '#78350F', bgColor: '#FEF3C7' },
  { type: 'tea', icon: 'tea', labelKey: 'fluid.tea', color: '#065F46', bgColor: '#D1FAE5' },
  { type: 'juice', icon: 'fruit-citrus', labelKey: 'fluid.juice', color: '#EA580C', bgColor: '#FFEDD5' },
  { type: 'alcohol', icon: 'glass-wine', labelKey: 'fluid.alcohol', color: '#7C3AED', bgColor: '#EDE9FE' },
  { type: 'other', icon: 'cup', labelKey: 'fluid.other', color: '#6B7280', bgColor: '#F3F4F6' },
];

interface DrinkTypePickerProps {
  value: DrinkType;
  onChange: (type: DrinkType) => void;
}

export function DrinkTypePicker({ value, onChange }: DrinkTypePickerProps) {
  const { t } = useI18n();

  const handleSelect = React.useCallback(
    (type: DrinkType) => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onChange(type);
    },
    [onChange]
  );

  return (
    <View style={styles.grid}>
      {drinkTypes.map((drink) => {
        const isSelected = value === drink.type;
        return (
          <Pressable
            key={drink.type}
            onPress={() => handleSelect(drink.type)}
            style={[
              styles.card,
              isSelected && { borderColor: drink.color, borderWidth: 2 },
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: isSelected ? drink.color : drink.bgColor },
              ]}
            >
              <MaterialCommunityIcons
                name={drink.icon as any}
                size={28}
                color={isSelected ? '#FFFFFF' : drink.color}
              />
            </View>
            <Text
              style={[
                styles.label,
                isSelected && { color: drink.color, fontWeight: '600' },
              ]}
            >
              {t(drink.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Export drink config for use in other components
export { drinkTypes };

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '30%',
    flexGrow: 1,
    minWidth: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderCurve: 'continuous',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    color: '#4B5563',
    textAlign: 'center',
  },
});
