import * as React from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { TimePicker } from '@/components/diary';
import { useDiaryStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/theme';
import { colors } from '@/lib/theme/colors';
import { dateFormatters } from '@/lib/i18n';
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

// Quick amounts with visual sizes
const quickAmounts = [
  { value: 100, label: '100', size: 'small' },
  { value: 200, label: '200', size: 'medium' },
  { value: 250, label: '250', size: 'medium' },
  { value: 330, label: '330', size: 'large' },
  { value: 500, label: '500', size: 'large' },
];

// Offset to scroll input into view above keyboard
const SCROLL_OFFSET = 120;

export default function FluidScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addFluidEntry = useDiaryStore((state) => state.addFluidEntry);

  // Refs
  const scrollViewRef = React.useRef<ScrollView>(null);
  const notesLayoutY = React.useRef<number>(0);

  const [timestamp, setTimestamp] = React.useState(() => new Date());
  const [drinkType, setDrinkType] = React.useState<DrinkType>('water');
  const [amount, setAmount] = React.useState('250');
  const [notes, setNotes] = React.useState('');

  // Get current drink config
  const currentDrink = drinkTypes.find((d) => d.type === drinkType) ?? drinkTypes[0];

  // Scroll to notes when focused
  const handleNotesFocus = React.useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: notesLayoutY.current - SCROLL_OFFSET,
        animated: true,
      });
    }, 100);
  }, []);

  const handleSave = React.useCallback(() => {
    const amountNum = parseInt(amount, 10);
    if (isNaN(amountNum) || amountNum <= 0) {
      return;
    }

    addFluidEntry({
      drinkType,
      amount: amountNum,
      notes: notes.trim() || undefined,
      timestamp: timestamp.toISOString(),
    });
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    router.back();
  }, [addFluidEntry, drinkType, amount, notes, timestamp, router]);

  const handleQuickAmount = React.useCallback((value: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setAmount(value.toString());
  }, []);

  const handleDrinkSelect = React.useCallback((type: DrinkType) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setDrinkType(type);
  }, []);

  // Increment/decrement amount
  const adjustAmount = React.useCallback((delta: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const current = parseInt(amount, 10) || 0;
    const newAmount = Math.max(0, current + delta);
    setAmount(newAmount.toString());
  }, [amount]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F9FAFB' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Date & Time */}
        <TimePicker value={timestamp} onChange={setTimestamp} />

        {/* Drink Type Grid */}
        <View className="gap-3">
          <Label>{t('fluid.drinkType')}</Label>
          <View style={styles.drinkGrid}>
            {drinkTypes.map((drink) => {
              const isSelected = drinkType === drink.type;
              return (
                <Pressable
                  key={drink.type}
                  onPress={() => handleDrinkSelect(drink.type)}
                  style={[
                    styles.drinkCard,
                    isSelected && { borderColor: drink.color, borderWidth: 2 },
                  ]}
                >
                  <View
                    style={[
                      styles.drinkIconContainer,
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
                      styles.drinkLabel,
                      isSelected && { color: drink.color, fontWeight: '600' },
                    ]}
                  >
                    {t(drink.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Amount Section */}
        <View className="gap-3">
          <Label>{t('fluid.amount')}</Label>
          
          {/* Large Amount Display */}
          <View style={styles.amountContainer}>
            {/* Minus Button */}
            <Pressable
              onPress={() => adjustAmount(-50)}
              style={styles.adjustButton}
            >
              <MaterialCommunityIcons name="minus" size={24} color={colors.primary.DEFAULT} />
            </Pressable>

            {/* Amount Display */}
            <View style={styles.amountDisplay}>
              <View
                style={[
                  styles.amountIconBg,
                  { backgroundColor: currentDrink.bgColor },
                ]}
              >
                <MaterialCommunityIcons
                  name={currentDrink.icon as any}
                  size={32}
                  color={currentDrink.color}
                />
              </View>
              <Text style={styles.amountValue}>{amount || '0'}</Text>
              <Text style={styles.amountUnit}>ml</Text>
            </View>

            {/* Plus Button */}
            <Pressable
              onPress={() => adjustAmount(50)}
              style={styles.adjustButton}
            >
              <MaterialCommunityIcons name="plus" size={24} color={colors.primary.DEFAULT} />
            </Pressable>
          </View>

          {/* Quick Amount Pills */}
          <View style={styles.quickAmounts}>
            {quickAmounts.map((item) => {
              const isSelected = amount === item.value.toString();
              return (
                <Pressable
                  key={item.value}
                  onPress={() => handleQuickAmount(item.value)}
                  style={[
                    styles.quickAmountPill,
                    isSelected && styles.quickAmountPillSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.quickAmountText,
                      isSelected && styles.quickAmountTextSelected,
                    ]}
                  >
                    {item.label}ml
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Custom Amount Input */}
          <Input
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder={t('fluid.amount')}
            style={{ textAlign: 'center' }}
          />
        </View>

        {/* Notes */}
        <View
          className="gap-3"
          onLayout={(e) => {
            notesLayoutY.current = e.nativeEvent.layout.y;
          }}
        >
          <Label>{t('fluid.notes')}</Label>
          <Input
            value={notes}
            onChangeText={setNotes}
            placeholder={t('common.notesPlaceholder')}
            multiline
            numberOfLines={3}
            className="min-h-[80px]"
            textAlignVertical="top"
            onFocus={handleNotesFocus}
          />
        </View>
      </ScrollView>

      {/* Sticky Save Button */}
      {Platform.OS === 'ios' ? (
        <BlurView intensity={80} tint="light" style={styles.footerBlur}>
          <View style={[styles.footerContent, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Button onPress={handleSave} size="lg" style={{ width: '100%' }}>
              <Text>{t('common.save')}</Text>
            </Button>
          </View>
        </BlurView>
      ) : (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Button onPress={handleSave} size="lg" style={{ width: '100%' }}>
            <Text>{t('common.save')}</Text>
          </Button>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  drinkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  drinkCard: {
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
  },
  drinkIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drinkLabel: {
    fontSize: 13,
    color: '#4B5563',
    textAlign: 'center',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    gap: 16,
  },
  adjustButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountDisplay: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  amountIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountValue: {
    fontSize: 40,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 48,
  },
  amountUnit: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: -4,
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  quickAmountPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    minWidth: 60,
    alignItems: 'center',
  },
  quickAmountPillSelected: {
    backgroundColor: '#006D77',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  quickAmountTextSelected: {
    color: '#FFFFFF',
  },
  footer: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerBlur: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  footerContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});
