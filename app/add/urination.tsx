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
import { ScreenHeader, FormCard, ToggleRow, SectionTitle } from '@/components/ui';
import { UrgencyScale, VolumePicker, TimePicker } from '@/components/diary';
import { useDiaryStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n/context';
import type { UrgencyLevel, VolumeSize } from '@/lib/store/types';

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

  // Form state
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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Platform.OS === 'ios' ? 24 : 16 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <ScreenHeader
          title={t('urination.title')}
          subtitle={t('urination.subtitle')}
        />

        {/* Time */}
        <TimePicker value={timestamp} onChange={setTimestamp} />

        {/* Volume */}
        <View style={styles.section}>
          <SectionTitle>{t('urination.volume')}</SectionTitle>
          <VolumePicker value={volume} onChange={setVolume} />
        </View>

        {/* Urgency */}
        <View style={styles.section}>
          <SectionTitle>{t('urination.urgency')}</SectionTitle>
          <UrgencyScale value={urgency} onChange={setUrgency} />
        </View>

        {/* Additional Options */}
        <View style={styles.section}>
          <SectionTitle>{t('common.options')}</SectionTitle>
          <FormCard>
            <ToggleRow
              label={t('urination.hadLeak')}
              value={hadLeak}
              onValueChange={setHadLeak}
            />
            <View style={styles.separator} />
            <ToggleRow
              label={t('urination.hadPain')}
              value={hadPain}
              onValueChange={setHadPain}
            />
          </FormCard>
        </View>

        {/* Notes */}
        <View
          style={styles.section}
          onLayout={(e) => {
            notesLayoutY.current = e.nativeEvent.layout.y;
          }}
        >
          <SectionTitle>{t('urination.notes')}</SectionTitle>
          <Input
            value={notes}
            onChangeText={setNotes}
            placeholder={t('common.notesPlaceholder')}
            multiline
            numberOfLines={3}
            style={styles.notesInput}
            textAlignVertical="top"
            onFocus={handleNotesFocus}
          />
        </View>
      </ScrollView>

      {/* Sticky Save Button */}
      {Platform.OS === 'ios' ? (
        <BlurView intensity={80} tint="light" style={styles.footerBlur}>
          <View style={[styles.footerContent, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Button onPress={handleSave} size="lg" style={styles.saveButton}>
              <Text style={styles.saveButtonText}>{t('common.save')}</Text>
            </Button>
          </View>
        </BlurView>
      ) : (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Button onPress={handleSave} size="lg" style={styles.saveButton}>
            <Text style={styles.saveButtonText}>{t('common.save')}</Text>
          </Button>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 20,
  },
  section: {
    gap: 12,
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
  notesInput: {
    minHeight: 100,
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
  saveButton: {
    width: '100%',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 17,
  },
});
