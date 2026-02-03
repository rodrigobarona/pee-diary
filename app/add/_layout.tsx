import { Stack } from 'expo-router';
import { useI18n } from '@/lib/i18n/context';

export default function AddLayout() {
  const { t } = useI18n();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTitleStyle: {
          color: '#333333',
          fontWeight: '600',
        },
        headerTintColor: '#006D77',
        contentStyle: {
          backgroundColor: '#F9FAFB',
        },
        // NOTE: Presentation settings (formSheet, sheetAllowedDetents, etc.)
        // are configured in app/_layout.tsx at the root level to avoid conflicts
      }}
    >
      <Stack.Screen
        name="urination"
        options={{
          title: t('urination.title'),
        }}
      />
      <Stack.Screen
        name="fluid"
        options={{
          title: t('fluid.title'),
        }}
      />
      <Stack.Screen
        name="leak"
        options={{
          title: t('leak.title'),
        }}
      />
    </Stack>
  );
}
