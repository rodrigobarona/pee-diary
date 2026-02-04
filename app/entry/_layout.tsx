import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { useI18n } from '@/lib/i18n/context';

export default function EntryLayout() {
  const { t, locale } = useI18n();

  return (
    <Stack
      key={locale}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTitleStyle: { fontWeight: '600', fontSize: 17 },
        headerTintColor: '#006D77',
        headerTitleAlign: 'center',
        contentStyle: { backgroundColor: '#F9FAFB' },
        ...(Platform.OS === 'ios' && {
          headerShadowVisible: false,
          headerBackTitle: '',
        }),
      }}
    >
      <Stack.Screen
        name="[id]"
        options={{
          title: t('detail.editEntry'),
        }}
      />
    </Stack>
  );
}
