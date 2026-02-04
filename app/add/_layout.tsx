import { Stack } from 'expo-router';
import { useI18n } from '@/lib/i18n/context';

export default function AddLayout() {
  const { t, locale } = useI18n();

  return (
    <Stack
      key={locale} // Ensure titles update when locale changes
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
        // NOTE: contentStyle removed - let individual screens handle background
        // Presentation settings (formSheet, sheetAllowedDetents, etc.)
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
