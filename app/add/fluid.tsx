import * as React from 'react';
import { View, ScrollView, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useDiaryStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/theme';
import { colors } from '@/lib/theme/colors';
import type { DrinkType } from '@/lib/store/types';

const drinkTypes: { type: DrinkType; icon: string; labelKey: string }[] = [
  { type: 'water', icon: 'water', labelKey: 'fluid.water' },
  { type: 'coffee', icon: 'coffee', labelKey: 'fluid.coffee' },
  { type: 'tea', icon: 'tea', labelKey: 'fluid.tea' },
  { type: 'juice', icon: 'fruit-citrus', labelKey: 'fluid.juice' },
  { type: 'alcohol', icon: 'glass-wine', labelKey: 'fluid.alcohol' },
  { type: 'other', icon: 'cup', labelKey: 'fluid.other' },
];

const quickAmounts = [100, 200, 250, 330, 500];

export default function FluidScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const addFluidEntry = useDiaryStore((state) => state.addFluidEntry);

  const [drinkType, setDrinkType] = React.useState<DrinkType>('water');
  const [amount, setAmount] = React.useState('250');
  const [notes, setNotes] = React.useState('');

  const handleSave = React.useCallback(() => {
    const amountNum = parseInt(amount, 10);
    if (isNaN(amountNum) || amountNum <= 0) {
      return;
    }

    addFluidEntry({
      drinkType,
      amount: amountNum,
      notes: notes.trim() || undefined,
    });
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    router.back();
  }, [addFluidEntry, drinkType, amount, notes, router]);

  const handleQuickAmount = React.useCallback((value: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setAmount(value.toString());
  }, []);

  return (
    <ScrollView
      className="flex-1 bg-background"
      style={{ flex: 1, backgroundColor: '#F9FAFB' }}
      contentContainerStyle={{ padding: 16, gap: 24 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Drink Type */}
      <View className="gap-3">
        <Label>{t('fluid.drinkType')}</Label>
        <View className="flex-row flex-wrap gap-2">
          {drinkTypes.map((drink) => {
            const isSelected = drinkType === drink.type;
            return (
              <Pressable
                key={drink.type}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setDrinkType(drink.type);
                }}
                className={cn(
                  'flex-row items-center gap-2 px-4 py-3 rounded-xl',
                  isSelected ? 'bg-primary' : 'bg-muted/30'
                )}
                style={{ borderCurve: 'continuous' }}
              >
                <MaterialCommunityIcons
                  name={drink.icon as any}
                  size={20}
                  color={isSelected ? '#FFFFFF' : colors.primary.DEFAULT}
                />
                <Text
                  className={cn(
                    'font-medium',
                    isSelected ? 'text-white' : 'text-foreground'
                  )}
                >
                  {t(drink.labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Amount */}
      <View className="gap-3">
        <Label>{t('fluid.amount')}</Label>
        <Input
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="250"
        />
        <View className="flex-row flex-wrap gap-2">
          {quickAmounts.map((value) => (
            <Pressable
              key={value}
              onPress={() => handleQuickAmount(value)}
              className={cn(
                'px-4 py-2 rounded-lg',
                amount === value.toString() ? 'bg-primary' : 'bg-muted/30'
              )}
              style={{ borderCurve: 'continuous' }}
            >
              <Text
                className={cn(
                  'font-medium',
                  amount === value.toString() ? 'text-white' : 'text-foreground'
                )}
              >
                {value}ml
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Notes */}
      <View className="gap-3">
        <Label>{t('fluid.notes')}</Label>
        <Input
          value={notes}
          onChangeText={setNotes}
          placeholder={t('common.notesPlaceholder')}
          multiline
          numberOfLines={3}
          className="min-h-[80px]"
          textAlignVertical="top"
        />
      </View>

      {/* Save Button */}
      <Button onPress={handleSave} className="mt-4">
        <Text>{t('common.save')}</Text>
      </Button>
    </ScrollView>
  );
}
