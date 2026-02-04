import * as React from 'react';
import { View, ScrollView, Pressable, Alert, Platform, Modal, StyleSheet } from 'react-native';
import { documentDirectory, writeAsStringAsync } from 'expo-file-system';
import { shareAsync } from 'expo-sharing';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { format } from 'date-fns';

import { Text } from '@/components/ui/text';
import { Separator } from '@/components/ui/separator';
import { useDiaryStore } from '@/lib/store';
import { useI18n, type SupportedLocale } from '@/lib/i18n/context';
import { cn } from '@/lib/theme';
import { colors } from '@/lib/theme/colors';

interface SettingRowProps {
  icon: string;
  label: string;
  description?: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  children?: React.ReactNode;
}

function SettingRow({
  icon,
  label,
  description,
  value,
  onPress,
  destructive,
  children,
}: SettingRowProps) {
  const content = (
    <View className="flex-row items-center gap-4 py-4">
      <View
        className={cn(
          'h-10 w-10 items-center justify-center rounded-xl',
          destructive ? 'bg-destructive/10' : 'bg-primary/10'
        )}
        style={{ borderCurve: 'continuous' }}
      >
        <MaterialCommunityIcons
          name={icon as any}
          size={22}
          color={destructive ? colors.error : colors.primary.DEFAULT}
        />
      </View>
      <View className="flex-1">
        <Text
          className={cn(
            'font-medium',
            destructive ? 'text-destructive' : 'text-foreground'
          )}
        >
          {label}
        </Text>
        {description ? (
          <Text className="text-sm text-muted-foreground">{description}</Text>
        ) : null}
      </View>
      {children ? (
        children
      ) : value ? (
        <Text className="text-muted-foreground">{value}</Text>
      ) : null}
      {onPress && !children ? (
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={colors.textMuted}
        />
      ) : null}
    </View>
  );

  if (onPress && !children) {
    return (
      <Pressable onPress={onPress} className="active:opacity-70">
        {content}
      </Pressable>
    );
  }

  return content;
}

const languageOptions: { value: SupportedLocale; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'pt', label: 'Português' },
];

export default function SettingsScreen() {
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const params = useLocalSearchParams<{ openGoals?: string }>();
  const entries = useDiaryStore((state) => state.entries);
  const goals = useDiaryStore((state) => state.goals);
  const clearAllEntries = useDiaryStore((state) => state.clearAllEntries);
  const [showLanguagePicker, setShowLanguagePicker] = React.useState(false);

  // Open goals screen if navigated with openGoals param
  React.useEffect(() => {
    if (params.openGoals === 'true') {
      router.setParams({ openGoals: undefined });
      router.push('/goals');
    }
  }, [params.openGoals, router]);

  const handleLanguageChange = React.useCallback(
    (newLanguage: SupportedLocale) => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setLocale(newLanguage);
      setShowLanguagePicker(false);
    },
    [setLocale]
  );

  const handleOpenGoals = React.useCallback(() => {
    router.push('/goals');
  }, [router]);

  const handleExport = React.useCallback(async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (entries.length === 0) {
      Alert.alert('No Data', 'There are no entries to export.');
      return;
    }

    try {
      // Create CSV content
      const headers = [
        'ID',
        'Type',
        'Timestamp',
        'Volume',
        'Urgency',
        'Had Leak',
        'Had Pain',
        'Drink Type',
        'Amount (ml)',
        'Severity',
        'Notes',
      ].join(',');

      const rows = entries.map((entry) => {
        const base = [
          entry.id,
          entry.type,
          entry.timestamp,
        ];

        switch (entry.type) {
          case 'urination':
            return [
              ...base,
              entry.volume,
              entry.urgency,
              entry.hadLeak ? 'Yes' : 'No',
              entry.hadPain ? 'Yes' : 'No',
              '',
              '',
              '',
              entry.notes || '',
            ].join(',');
          case 'fluid':
            return [
              ...base,
              '',
              '',
              '',
              '',
              entry.drinkType,
              entry.amount,
              '',
              entry.notes || '',
            ].join(',');
          case 'leak':
            return [
              ...base,
              '',
              entry.urgency,
              '',
              '',
              '',
              '',
              entry.severity,
              entry.notes || '',
            ].join(',');
          default:
            return base.join(',');
        }
      });

      const csv = [headers, ...rows].join('\n');
      const filename = `pee-diary-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      const filePath = `${documentDirectory}${filename}`;

      await writeAsStringAsync(filePath, csv);
      await shareAsync(filePath, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Diary',
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data.');
    }
  }, [entries]);

  const handleClearData = React.useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    Alert.alert(
      t('settings.clearData'),
      t('settings.clearDataConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            clearAllEntries();
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ]
    );
  }, [clearAllEntries, t]);

  const currentLanguageLabel =
    languageOptions.find((l) => l.value === locale)?.label || 'English';

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16 }}
    >
      {/* Language Picker Modal */}
      <Modal
        visible={showLanguagePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguagePicker(false)}
      >
        <Pressable
          style={modalStyles.overlay}
          onPress={() => setShowLanguagePicker(false)}
        >
          <View style={modalStyles.content}>
            <Text className="text-lg font-semibold text-foreground mb-4">
              {t('settings.language')}
            </Text>
            {languageOptions.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => handleLanguageChange(option.value)}
                style={modalStyles.option}
              >
                <Text
                  className={cn(
                    'text-base',
                    locale === option.value
                      ? 'text-primary font-semibold'
                      : 'text-foreground'
                  )}
                >
                  {option.label}
                </Text>
                {locale === option.value ? (
                  <MaterialCommunityIcons
                    name="check"
                    size={20}
                    color="#006D77"
                  />
                ) : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Daily Goals Section */}
      <Text className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
        {t('goals.title')}
      </Text>
      <View
        className="bg-surface rounded-xl px-4"
        style={{ borderCurve: 'continuous' }}
      >
        <SettingRow
          icon="target"
          label={t('settings.editGoals')}
          description={`${goals.fluidTarget}ml • ${goals.voidTarget} ${t('goals.voids')}`}
          onPress={handleOpenGoals}
        />
      </View>

      {/* General Section */}
      <Text className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
        General
      </Text>
      <View
        className="bg-surface rounded-xl px-4"
        style={{ borderCurve: 'continuous' }}
      >
        <SettingRow
          icon="translate"
          label={t('settings.language')}
          onPress={() => setShowLanguagePicker(true)}
          value={currentLanguageLabel}
        />
      </View>

      {/* Data Section */}
      <Text className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2 mt-6">
        Data
      </Text>
      <View
        className="bg-surface rounded-xl px-4"
        style={{ borderCurve: 'continuous' }}
      >
        <SettingRow
          icon="download"
          label={t('settings.export')}
          description={t('settings.exportDescription')}
          onPress={handleExport}
        />
        <Separator />
        <SettingRow
          icon="delete"
          label={t('settings.clearData')}
          description={t('settings.clearDataDescription')}
          onPress={handleClearData}
          destructive
        />
      </View>

      {/* About Section */}
      <Text className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2 mt-6">
        {t('settings.about')}
      </Text>
      <View
        className="bg-surface rounded-xl px-4"
        style={{ borderCurve: 'continuous' }}
      >
        <SettingRow
          icon="information"
          label={t('settings.version')}
          value="1.0.0"
        />
        <Separator />
        <SettingRow
          icon="heart"
          label="Made with care"
          description="by Eleva Care"
        />
      </View>

      {/* Stats */}
      <View className="mt-6 items-center">
        <Text className="text-sm text-muted-foreground">
          {entries.length} entries recorded
        </Text>
      </View>
    </ScrollView>
  );
}

// Language picker modal styles (centered)
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
});

