import '../global.css';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, LogBox, type ColorSchemeName } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { I18nProvider, useI18n } from '@/lib/i18n/context';

// Suppress deprecation warning from dependencies (react-native-bottom-tabs)
// This can be removed once the library updates to use react-native-safe-area-context
LogBox.ignoreLogs(['SafeAreaView has been deprecated']);

export const unstable_settings = {
  anchor: '(tabs)',
};

// Inner layout that can access I18n context
function InnerLayout({ colorScheme }: { colorScheme: ColorSchemeName }) {
  const { locale } = useI18n();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        key={locale} // Force re-mount on locale change to update all translations
        screenOptions={{
          contentStyle: {
            backgroundColor: '#F9FAFB',
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="add"
          options={{
            presentation: Platform.OS === 'web' ? 'card' : 'formSheet',
            headerShown: Platform.OS === 'web', // Header shown only on web, native uses sheet grabber
            ...(Platform.OS !== 'web' && {
              sheetAllowedDetents: [0.75, 1.0],
              sheetGrabberVisible: true,
              sheetCornerRadius: 20,
              sheetExpandsWhenScrolledToEdge: true,
            }),
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <I18nProvider>
        <InnerLayout colorScheme={colorScheme} />
      </I18nProvider>
    </GestureHandlerRootView>
  );
}
