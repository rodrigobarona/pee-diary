import { Stack } from 'expo-router';
import { colors } from '@/lib/theme/colors';

export default function AddLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTitleStyle: {
          color: colors.text,
          fontWeight: '600',
        },
        headerTintColor: colors.primary.DEFAULT,
        presentation: 'formSheet',
        // Native form sheet with swipe-to-dismiss
        sheetAllowedDetents: 'fitToContents',
        sheetGrabberVisible: true,
        sheetCornerRadius: 20,
      }}
    >
      <Stack.Screen
        name="urination"
        options={{
          title: 'Log Urination',
        }}
      />
      <Stack.Screen
        name="fluid"
        options={{
          title: 'Log Fluid',
        }}
      />
      <Stack.Screen
        name="leak"
        options={{
          title: 'Log Leak',
        }}
      />
    </Stack>
  );
}
