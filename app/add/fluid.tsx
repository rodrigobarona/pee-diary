import * as React from 'react';
import {
  View,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { TimePicker, DrinkTypePicker, AmountPicker } from '@/components/diary';
import { useDiaryStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n/context';
import type { DrinkType } from '@/lib/store/types';

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
          <DrinkTypePicker value={drinkType} onChange={setDrinkType} />
        </View>

        {/* Amount Section */}
        <View className="gap-3">
          <Label>{t('fluid.amount')}</Label>
          <AmountPicker 
            value={amount} 
            onChange={setAmount} 
            drinkType={drinkType}
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
