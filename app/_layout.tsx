import "../global.css";

import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as React from "react";
import { useEffect, useRef } from "react";
import { LogBox, Platform, type ColorSchemeName } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { ErrorBoundary } from "@/components/error-boundary";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { I18nProvider, useI18n } from "@/lib/i18n/context";
import { initSentry, Sentry, setSentryAppContext } from "@/lib/sentry";
import { useDiaryStore, useStoreHydrated } from "@/lib/store";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@/lib/theme";

// Initialize Sentry as early as possible
initSentry();

// Suppress deprecation warning from dependencies (react-native-bottom-tabs)
// This can be removed once the library updates to use react-native-safe-area-context
LogBox.ignoreLogs(["SafeAreaView has been deprecated"]);

// Prevent the splash screen from auto-hiding before fonts are loaded
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore errors - splash screen may not be available in all contexts
});

export const unstable_settings = {
  anchor: "(tabs)",
};

// Inner layout that can access I18n context
function InnerLayout({ colorScheme }: { colorScheme: ColorSchemeName }) {
  const { locale } = useI18n();
  const router = useRouter();
  const isHydrated = useStoreHydrated();
  const hasCheckedLaunchRef = useRef(false);

  // Handle initial routing based on onboarding status
  // Also auto-open add menu on app launch if preference is enabled
  useEffect(() => {
    if (isHydrated && !hasCheckedLaunchRef.current) {
      hasCheckedLaunchRef.current = true;

      // Check if onboarding needs to be shown
      const state = useDiaryStore.getState();

      // Set Sentry app context for better debugging
      setSentryAppContext({
        language: locale,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        entriesCount: state.entries.length,
      });

      if (!state.hasCompletedOnboarding) {
        // Navigate to onboarding
        router.replace("/(onboarding)");
        return;
      }

      // Read preference directly from store to avoid reacting to changes
      const shouldOpen = state.openAddMenuOnLaunch;
      if (shouldOpen) {
        // Small delay to ensure navigation is ready
        setTimeout(() => {
          router.push("/(formSheets)/add-menu");
        }, 100);
      }
    }
  }, [isHydrated, router, locale]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack
        key={locale} // Force re-mount on locale change to update all translations
        screenOptions={{
          contentStyle: {
            backgroundColor: "#F9FAFB",
          },
        }}
      >
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="(modals)/add/urination"
          options={{
            presentation: Platform.OS === "web" ? "card" : "modal",
            headerShown: false,
            contentStyle: { backgroundColor: "#F9FAFB" },
          }}
        />
        <Stack.Screen
          name="(modals)/add/fluid"
          options={{
            presentation: Platform.OS === "web" ? "card" : "modal",
            headerShown: false,
            contentStyle: { backgroundColor: "#F9FAFB" },
          }}
        />
        <Stack.Screen
          name="(modals)/add/leak"
          options={{
            presentation: Platform.OS === "web" ? "card" : "modal",
            headerShown: false,
            contentStyle: { backgroundColor: "#F9FAFB" },
          }}
        />
        <Stack.Screen
          name="(formSheets)/add-menu"
          options={{
            presentation: Platform.OS === "web" ? "card" : "formSheet",
            headerShown: false,
            sheetAllowedDetents: Platform.OS === "ios" ? [0.6] : undefined,
            sheetGrabberVisible: Platform.OS === "ios",
            sheetCornerRadius: 16, // Design brief: softer corners for modals
          }}
        />
        <Stack.Screen
          name="(formSheets)/goals"
          options={{
            presentation: Platform.OS === "web" ? "card" : "formSheet",
            headerShown: false,
            sheetAllowedDetents:
              Platform.OS === "ios" ? [0.85, 1.0] : undefined,
            sheetGrabberVisible: Platform.OS === "ios",
            sheetCornerRadius: 16,
          }}
        />
        <Stack.Screen
          name="(modals)/entry/[id]"
          options={{
            presentation: Platform.OS === "web" ? "card" : "modal",
            headerShown: false,
            contentStyle: { backgroundColor: "#F9FAFB" },
          }}
        />
        <Stack.Screen
          name="(formSheets)/export"
          options={{
            presentation: Platform.OS === "web" ? "card" : "formSheet",
            headerShown: false,
            sheetAllowedDetents:
              Platform.OS === "ios" ? [0.85, 1.0] : undefined,
            sheetGrabberVisible: Platform.OS === "ios",
            sheetCornerRadius: 16,
          }}
        />
        <Stack.Screen
          name="(formSheets)/language"
          options={{
            presentation: Platform.OS === "web" ? "card" : "formSheet",
            headerShown: false,
            sheetAllowedDetents: Platform.OS === "ios" ? [0.5] : undefined,
            sheetGrabberVisible: Platform.OS === "ios",
            sheetCornerRadius: 16,
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

function RootLayout() {
  const colorScheme = useColorScheme();

  // Load custom fonts: Inter (primary), DM Sans (secondary), and icons
  const [fontsLoaded, fontError] = useFonts({
    ...MaterialCommunityIcons.font,
    // Inter - Primary font for UI elements
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    // DM Sans - Secondary font for headers and prompts
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  useEffect(() => {
    if (fontError) {
      console.error("Font loading error:", fontError);
    }
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {
        // Ignore errors - splash screen may not be available in all contexts (e.g., modals)
      });
    }
  }, [fontsLoaded]);

  // Don't render until fonts are loaded
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <I18nProvider>
          <InnerLayout colorScheme={colorScheme} />
        </I18nProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

// Wrap with Sentry for automatic error capturing and performance monitoring
export default Sentry.wrap(RootLayout);
