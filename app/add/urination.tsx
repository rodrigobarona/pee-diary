import * as React from 'react';
import {
  View,
  ScrollView,
  Switch,
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
import { UrgencyScale, VolumePicker, TimePicker } from '@/components/diary';
import { useDiaryStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n/context';
import type { UrgencyLevel, VolumeSize } from '@/lib/store/types';

// Toggle colors for better contrast
const TOGGLE_COLORS = {
  trackTrue: '#006D77',
  trackFalse: '#D1D5DB',
  thumbTrue: '#FFFFFF',
  thumbFalse: '#F9FAFB',
};

// Offset to scroll input into view above keyboard
const SCROLL_OFFSET = 120;

export default function UrinationScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addUrinationEntry = useDiaryStore((state) => state.addUrinationEntry);

  // Refs
  const scrollViewRef = React.useRef<ScrollView>(null);
  const notesLayoutY = React.useRef<number>(0);

  // Form state - using React state for form inputs
  const [timestamp, setTimestamp] = React.useState(() => new Date());
  const [volume, setVolume] = React.useState<VolumeSize>('medium');
  const [urgency, setUrgency] = React.useState<UrgencyLevel>(3);
  const [hadLeak, setHadLeak] = React.useState(false);
  const [hadPain, setHadPain] = React.useState(false);
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
    addUrinationEntry({
      volume,
      urgency,
      hadLeak,
      hadPain,
      notes: notes.trim() || undefined,
      timestamp: timestamp.toISOString(),
    });
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    router.back();
  }, [addUrinationEntry, volume, urgency, hadLeak, hadPain, notes, timestamp, router]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F9FAFB' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 24, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Time */}
        <TimePicker value={timestamp} onChange={setTimestamp} />

        {/* Volume */}
        <View className="gap-3">
          <Label>{t('urination.volume')}</Label>
          <VolumePicker value={volume} onChange={setVolume} />
        </View>

        {/* Urgency */}
        <View className="gap-3">
          <Label>{t('urination.urgency')}</Label>
          <UrgencyScale value={urgency} onChange={setUrgency} />
        </View>

        {/* Had Leak Toggle */}
        <View className="flex-row items-center justify-between py-3 px-4 bg-white rounded-xl">
          <Label className="flex-1">{t('urination.hadLeak')}</Label>
          <Switch
            value={hadLeak}
            onValueChange={(value) => {
              setHadLeak(value);
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
            trackColor={{
              true: TOGGLE_COLORS.trackTrue,
              false: TOGGLE_COLORS.trackFalse,
            }}
            thumbColor={hadLeak ? TOGGLE_COLORS.thumbTrue : TOGGLE_COLORS.thumbFalse}
            ios_backgroundColor={TOGGLE_COLORS.trackFalse}
          />
        </View>

        {/* Had Pain Toggle */}
        <View className="flex-row items-center justify-between py-3 px-4 bg-white rounded-xl">
          <Label className="flex-1">{t('urination.hadPain')}</Label>
          <Switch
            value={hadPain}
            onValueChange={(value) => {
              setHadPain(value);
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
            trackColor={{
              true: TOGGLE_COLORS.trackTrue,
              false: TOGGLE_COLORS.trackFalse,
            }}
            thumbColor={hadPain ? TOGGLE_COLORS.thumbTrue : TOGGLE_COLORS.thumbFalse}
            ios_backgroundColor={TOGGLE_COLORS.trackFalse}
          />
        </View>

        {/* Notes */}
        <View
          className="gap-3"
          onLayout={(e) => {
            notesLayoutY.current = e.nativeEvent.layout.y;
          }}
        >
          <Label>{t('urination.notes')}</Label>
          <Input
            value={notes}
            onChangeText={setNotes}
            placeholder={t('common.notesPlaceholder')}
            multiline
            numberOfLines={3}
            className="min-h-[100px]"
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
