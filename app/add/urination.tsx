import * as React from 'react';
import { View, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { UrgencyScale, VolumePicker } from '@/components/diary';
import { useDiaryStore } from '@/lib/store';
import { i18n } from '@/lib/i18n';
import type { UrgencyLevel, VolumeSize } from '@/lib/store/types';

export default function UrinationScreen() {
  const router = useRouter();
  const addUrinationEntry = useDiaryStore((state) => state.addUrinationEntry);

  // Form state - using React state for form inputs
  const [volume, setVolume] = React.useState<VolumeSize>('medium');
  const [urgency, setUrgency] = React.useState<UrgencyLevel>(3);
  const [hadLeak, setHadLeak] = React.useState(false);
  const [hadPain, setHadPain] = React.useState(false);
  const [notes, setNotes] = React.useState('');

  const handleSave = React.useCallback(() => {
    addUrinationEntry({
      volume,
      urgency,
      hadLeak,
      hadPain,
      notes: notes.trim() || undefined,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }, [addUrinationEntry, volume, urgency, hadLeak, hadPain, notes, router]);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 16, gap: 24 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Volume */}
      <View className="gap-3">
        <Label>{i18n.t('urination.volume')}</Label>
        <VolumePicker value={volume} onChange={setVolume} />
      </View>

      {/* Urgency */}
      <View className="gap-3">
        <Label>{i18n.t('urination.urgency')}</Label>
        <UrgencyScale value={urgency} onChange={setUrgency} />
      </View>

      {/* Had Leak Toggle */}
      <View className="flex-row items-center justify-between py-2">
        <Label>{i18n.t('urination.hadLeak')}</Label>
        <Switch
          value={hadLeak}
          onValueChange={(value) => {
            setHadLeak(value);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          trackColor={{ true: '#006D77' }}
        />
      </View>

      {/* Had Pain Toggle */}
      <View className="flex-row items-center justify-between py-2">
        <Label>{i18n.t('urination.hadPain')}</Label>
        <Switch
          value={hadPain}
          onValueChange={(value) => {
            setHadPain(value);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          trackColor={{ true: '#006D77' }}
        />
      </View>

      {/* Notes */}
      <View className="gap-3">
        <Label>{i18n.t('urination.notes')}</Label>
        <Input
          value={notes}
          onChangeText={setNotes}
          placeholder="Add any additional notes..."
          multiline
          numberOfLines={3}
          className="min-h-[80px]"
          textAlignVertical="top"
        />
      </View>

      {/* Save Button */}
      <Button onPress={handleSave} className="mt-4">
        <Text>{i18n.t('common.save')}</Text>
      </Button>
    </ScrollView>
  );
}
