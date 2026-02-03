import * as React from 'react';
import { View, ScrollView, Pressable, Alert } from 'react-native';
import { documentDirectory, writeAsStringAsync } from 'expo-file-system';
import { shareAsync } from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import * as DropdownMenu from 'zeego/dropdown-menu';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { Text } from '@/components/ui/text';
import { Separator } from '@/components/ui/separator';
import { useDiaryStore } from '@/lib/store';
import { i18n, updateLocale, type SupportedLocale } from '@/lib/i18n';
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
  const language = useDiaryStore((state) => state.language);
  const setLanguage = useDiaryStore((state) => state.setLanguage);
  const entries = useDiaryStore((state) => state.entries);
  const clearAllEntries = useDiaryStore((state) => state.clearAllEntries);

  const handleLanguageChange = React.useCallback(
    (newLanguage: SupportedLocale) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setLanguage(newLanguage);
      updateLocale(newLanguage);
    },
    [setLanguage]
  );

  const handleExport = React.useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    Alert.alert(
      i18n.t('settings.clearData'),
      i18n.t('settings.clearDataConfirm'),
      [
        {
          text: i18n.t('common.cancel'),
          style: 'cancel',
        },
        {
          text: i18n.t('common.delete'),
          style: 'destructive',
          onPress: () => {
            clearAllEntries();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  }, [clearAllEntries]);

  const currentLanguageLabel =
    languageOptions.find((l) => l.value === language)?.label || 'English';

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16 }}
    >
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
          label={i18n.t('settings.language')}
        >
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Pressable className="flex-row items-center gap-2 active:opacity-70">
                <Text className="text-muted-foreground">
                  {currentLanguageLabel}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              {languageOptions.map((option) => (
                <DropdownMenu.CheckboxItem
                  key={option.value}
                  value={language === option.value ? 'on' : 'off'}
                  onValueChange={() => handleLanguageChange(option.value)}
                >
                  <DropdownMenu.ItemIndicator />
                  <DropdownMenu.ItemTitle>{option.label}</DropdownMenu.ItemTitle>
                </DropdownMenu.CheckboxItem>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </SettingRow>
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
          label={i18n.t('settings.export')}
          description={i18n.t('settings.exportDescription')}
          onPress={handleExport}
        />
        <Separator />
        <SettingRow
          icon="delete"
          label={i18n.t('settings.clearData')}
          description={i18n.t('settings.clearDataDescription')}
          onPress={handleClearData}
          destructive
        />
      </View>

      {/* About Section */}
      <Text className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2 mt-6">
        {i18n.t('settings.about')}
      </Text>
      <View
        className="bg-surface rounded-xl px-4"
        style={{ borderCurve: 'continuous' }}
      >
        <SettingRow
          icon="information"
          label={i18n.t('settings.version')}
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
