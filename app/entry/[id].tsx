import * as React from 'react';
import {
  View,
  ScrollView,
  Switch,
  Pressable,
  Alert,
  Platform,
  KeyboardAvoidingView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { parseISO } from 'date-fns';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  UrgencyScale,
  VolumePicker,
  TimePicker,
  DrinkTypePicker,
  AmountPicker,
} from '@/components/diary';
import { useDiaryStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n/context';
import { dateFormatters } from '@/lib/i18n';
import { colors } from '@/lib/theme/colors';
import { cn } from '@/lib/theme';
import type {
  UrgencyLevel,
  VolumeSize,
  DrinkType,
  LeakSeverity,
} from '@/lib/store/types';

// Toggle colors
const TOGGLE_COLORS = {
  trackTrue: '#006D77',
  trackFalse: '#D1D5DB',
  thumbTrue: '#FFFFFF',
  thumbFalse: '#F9FAFB',
};

// Severity options for leak form
const severityOptions: { value: LeakSeverity; icon: string; labelKey: string }[] = [
  { value: 'drops', icon: 'water-outline', labelKey: 'leak.drops' },
  { value: 'moderate', icon: 'water', labelKey: 'leak.moderate' },
  { value: 'full', icon: 'water-alert', labelKey: 'leak.full' },
];

export default function EntryDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Get entry and actions from store
  const entries = useDiaryStore((state) => state.entries);
  const entry = id ? entries.find((e) => e.id === id) : undefined;
  const updateEntry = useDiaryStore((state) => state.updateEntry);
  const deleteEntry = useDiaryStore((state) => state.deleteEntry);


  // Form state - all with defaults
  const [timestamp, setTimestamp] = React.useState(new Date());
  const [volume, setVolume] = React.useState<VolumeSize>('medium');
  const [urgency, setUrgency] = React.useState<UrgencyLevel>(3);
  const [hadLeak, setHadLeak] = React.useState(false);
  const [hadPain, setHadPain] = React.useState(false);
  const [drinkType, setDrinkType] = React.useState<DrinkType>('water');
  const [amount, setAmount] = React.useState('250');
  const [severity, setSeverity] = React.useState<LeakSeverity>('drops');
  const [notes, setNotes] = React.useState('');
  const [showEditHistory, setShowEditHistory] = React.useState(false);
  
  // Track if we've loaded the entry data
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Load entry data when it becomes available
  React.useEffect(() => {
    if (entry && !isLoaded) {
      setTimestamp(parseISO(entry.timestamp));
      setNotes(entry.notes ?? '');
      
      if (entry.type === 'urination') {
        setVolume(entry.volume);
        setUrgency(entry.urgency);
        setHadLeak(entry.hadLeak);
        setHadPain(entry.hadPain);
      } else if (entry.type === 'fluid') {
        setDrinkType(entry.drinkType);
        setAmount(entry.amount.toString());
      } else if (entry.type === 'leak') {
        setSeverity(entry.severity);
        setUrgency(entry.urgency);
      }
      
      setIsLoaded(true);
    }
  }, [entry, isLoaded]);

  // Scroll ref for keyboard
  const scrollViewRef = React.useRef<ScrollView>(null);
  const notesLayoutY = React.useRef<number>(0);

  const handleNotesFocus = React.useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: notesLayoutY.current - 120,
        animated: true,
      });
    }, 100);
  }, []);

  // Show loading if entry not yet loaded
  if (!entry || !isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#006D77" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  const getTitle = () => {
    switch (entry.type) {
      case 'urination':
        return t('detail.editUrination');
      case 'fluid':
        return t('detail.editFluid');
      case 'leak':
        return t('detail.editLeak');
    }
  };

  const handleUpdate = () => {
    const updates: Record<string, unknown> = {
      timestamp: timestamp.toISOString(),
      notes: notes.trim() || undefined,
    };

    if (entry.type === 'urination') {
      updates.volume = volume;
      updates.urgency = urgency;
      updates.hadLeak = hadLeak;
      updates.hadPain = hadPain;
    } else if (entry.type === 'fluid') {
      updates.drinkType = drinkType;
      updates.amount = parseInt(amount, 10);
    } else if (entry.type === 'leak') {
      updates.severity = severity;
      updates.urgency = urgency;
    }

    updateEntry(id!, updates);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    router.back();
  };

  const handleDelete = () => {
    Alert.alert(
      t('common.delete'),
      t('detail.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            deleteEntry(id!);
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            router.back();
          },
        },
      ]
    );
  };

  const formatChangeValue = (key: string, value: unknown): string => {
    if (key === 'timestamp' && typeof value === 'string') {
      return dateFormatters.time.format(parseISO(value));
    }
    if (typeof value === 'boolean') {
      return value ? t('common.yes') : t('common.no');
    }
    if (key === 'volume') {
      return t(`urination.volume${(value as string).charAt(0).toUpperCase() + (value as string).slice(1)}`);
    }
    if (key === 'urgency') {
      return t(`urgency.${value}`);
    }
    if (key === 'drinkType') {
      return t(`fluid.${value}`);
    }
    if (key === 'severity') {
      return t(`leak.${value}`);
    }
    if (key === 'amount') {
      return `${value}ml`;
    }
    return String(value ?? '');
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: getTitle(),
          headerRight: () => (
            <Pressable
              onPress={handleDelete}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ padding: 8 }}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={22} color="#EF4444" />
            </Pressable>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#F9FAFB' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, gap: 24, paddingBottom: 160 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Time */}
          <TimePicker value={timestamp} onChange={setTimestamp} />

          {/* Type-specific form */}
          {entry.type === 'urination' && (
            <>
              <View className="gap-3">
                <Label>{t('urination.volume')}</Label>
                <VolumePicker value={volume} onChange={setVolume} />
              </View>

              <View className="gap-3">
                <Label>{t('urination.urgency')}</Label>
                <UrgencyScale value={urgency} onChange={setUrgency} />
              </View>

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
                  trackColor={{ true: TOGGLE_COLORS.trackTrue, false: TOGGLE_COLORS.trackFalse }}
                  thumbColor={hadLeak ? TOGGLE_COLORS.thumbTrue : TOGGLE_COLORS.thumbFalse}
                  ios_backgroundColor={TOGGLE_COLORS.trackFalse}
                />
              </View>

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
                  trackColor={{ true: TOGGLE_COLORS.trackTrue, false: TOGGLE_COLORS.trackFalse }}
                  thumbColor={hadPain ? TOGGLE_COLORS.thumbTrue : TOGGLE_COLORS.thumbFalse}
                  ios_backgroundColor={TOGGLE_COLORS.trackFalse}
                />
              </View>
            </>
          )}

          {entry.type === 'fluid' && (
            <>
              <View className="gap-3">
                <Label>{t('fluid.drinkType')}</Label>
                <DrinkTypePicker value={drinkType} onChange={setDrinkType} />
              </View>

              <View className="gap-3">
                <Label>{t('fluid.amount')}</Label>
                <AmountPicker 
                  value={amount} 
                  onChange={setAmount} 
                  drinkType={drinkType}
                  showInput={false}
                />
              </View>
            </>
          )}

          {entry.type === 'leak' && (
            <>
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
                        <Text className={cn('font-semibold', isSelected ? 'text-destructive' : 'text-foreground')}>
                          {t(option.labelKey)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View className="gap-3">
                <Label>{t('leak.urgency')}</Label>
                <UrgencyScale value={urgency} onChange={setUrgency} />
              </View>
            </>
          )}

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

          {/* Edit History */}
          {entry.editHistory && entry.editHistory.length > 0 && (
            <View className="gap-3">
              <Pressable
                onPress={() => setShowEditHistory(!showEditHistory)}
                className="flex-row items-center justify-between py-3 px-4 bg-white rounded-xl"
              >
                <View className="flex-row items-center gap-2">
                  <MaterialCommunityIcons
                    name="history"
                    size={20}
                    color={colors.primary.DEFAULT}
                  />
                  <Text className="font-medium">
                    {t('detail.editHistory')} ({entry.editHistory.length})
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name={showEditHistory ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#9CA3AF"
                />
              </Pressable>

              {showEditHistory && (
                <View className="gap-2 px-4">
                  {entry.editHistory
                    .slice()
                    .reverse()
                    .map((edit, index) => (
                      <View
                        key={index}
                        className="py-3 border-b border-muted/20"
                      >
                        <Text className="text-sm text-muted-foreground mb-2">
                          {t('detail.edited')}: {dateFormatters.long.format(parseISO(edit.editedAt))}{' '}
                          {dateFormatters.time.format(parseISO(edit.editedAt))}
                        </Text>
                        {Object.entries(edit.changes).map(([key, change]) => (
                          <Text key={key} className="text-sm">
                            <Text className="font-medium">{key}</Text>:{' '}
                            {formatChangeValue(key, change.from)} → {formatChangeValue(key, change.to)}
                          </Text>
                        ))}
                      </View>
                    ))}
                </View>
              )}
            </View>
          )}

        </ScrollView>

        {/* Sticky Update Button */}
        {Platform.OS === 'ios' ? (
          <BlurView intensity={80} tint="light" style={styles.footerBlur}>
            <View style={[styles.footerContent, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              <Button onPress={handleUpdate} size="lg" style={{ width: '100%' }}>
                <Text>{t('detail.update')}</Text>
              </Button>
            </View>
          </BlurView>
        ) : (
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Button onPress={handleUpdate} size="lg" style={{ width: '100%' }}>
              <Text>{t('detail.update')}</Text>
            </Button>
          </View>
        )}
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#9CA3AF',
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
