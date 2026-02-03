import * as React from 'react';
import { View, ScrollView, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { UrgencyScale } from '@/components/diary';
import { useDiaryStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/theme';
import { colors } from '@/lib/theme/colors';
import type { LeakSeverity, UrgencyLevel } from '@/lib/store/types';

const severityOptions: {
  value: LeakSeverity;
  icon: string;
  labelKey: string;
  description: string;
}[] = [
  {
    value: 'drops',
    icon: 'water-outline',
    labelKey: 'leak.drops',
    description: 'A few drops',
  },
  {
    value: 'moderate',
    icon: 'water',
    labelKey: 'leak.moderate',
    description: 'Noticeable amount',
  },
  {
    value: 'full',
    icon: 'water-alert',
    labelKey: 'leak.full',
    description: 'Full accident',
  },
];

export default function LeakScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const addLeakEntry = useDiaryStore((state) => state.addLeakEntry);

  const [severity, setSeverity] = React.useState<LeakSeverity>('drops');
  const [urgency, setUrgency] = React.useState<UrgencyLevel>(3);
  const [notes, setNotes] = React.useState('');

  const handleSave = React.useCallback(() => {
    addLeakEntry({
      severity,
      urgency,
      notes: notes.trim() || undefined,
    });
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    router.back();
  }, [addLeakEntry, severity, urgency, notes, router]);

  return (
    <ScrollView
      className="flex-1 bg-background"
      style={{ flex: 1, backgroundColor: '#F9FAFB' }}
      contentContainerStyle={{ padding: 16, gap: 24 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Severity */}
      <View className="gap-3">
        <Label>{t('leak.severity')}</Label>
        <View className="gap-3">
          {severityOptions.map((option) => {
            const isSelected = severity === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setSeverity(option.value);
                }}
                className={cn(
                  'flex-row items-center gap-4 p-4 rounded-xl',
                  isSelected ? 'bg-destructive/10 border border-destructive' : 'bg-muted/30'
                )}
                style={{ borderCurve: 'continuous' }}
              >
                <View
                  className={cn(
                    'h-12 w-12 items-center justify-center rounded-xl',
                    isSelected ? 'bg-destructive' : 'bg-muted/50'
                  )}
                  style={{ borderCurve: 'continuous' }}
                >
                  <MaterialCommunityIcons
                    name={option.icon as any}
                    size={24}
                    color={isSelected ? '#FFFFFF' : colors.error}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className={cn(
                      'font-semibold',
                      isSelected ? 'text-destructive' : 'text-foreground'
                    )}
                  >
                    {t(option.labelKey)}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    {option.description}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Urgency */}
      <View className="gap-3">
        <Label>{t('leak.urgency')}</Label>
        <UrgencyScale value={urgency} onChange={setUrgency} />
      </View>

      {/* Notes */}
      <View className="gap-3">
        <Label>{t('leak.notes')}</Label>
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
