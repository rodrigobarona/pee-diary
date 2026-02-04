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

import { useColorScheme } from "@/hooks/use-color-scheme";
import { I18nProvider, useI18n } from "@/lib/i18n/context";
import { useDiaryStore, useStoreHydrated } from "@/lib/store";

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

  // Auto-open add menu on app launch if preference is enabled
  // Only runs once when store hydrates, not when preference changes
  useEffect(() => {
    if (isHydrated && !hasCheckedLaunchRef.current) {
      hasCheckedLaunchRef.current = true;
      // Read preference directly from store to avoid reacting to changes
      const shouldOpen = useDiaryStore.getState().openAddMenuOnLaunch;
      if (shouldOpen) {
        // Small delay to ensure navigation is ready
        setTimeout(() => {
          router.push("/add-menu");
        }, 100);
      }
    }
  }, [isHydrated, router]);

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
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="add/urination"
          options={{
            presentation: Platform.OS === "web" ? "card" : "modal",
            headerShown: false,
            contentStyle: { backgroundColor: "#F9FAFB" },
          }}
        />
        <Stack.Screen
          name="add/fluid"
          options={{
            presentation: Platform.OS === "web" ? "card" : "modal",
            headerShown: false,
            contentStyle: { backgroundColor: "#F9FAFB" },
          }}
        />
        <Stack.Screen
          name="add/leak"
          options={{
            presentation: Platform.OS === "web" ? "card" : "modal",
            headerShown: false,
            contentStyle: { backgroundColor: "#F9FAFB" },
          }}
        />
        <Stack.Screen
          name="add-menu"
          options={{
            presentation: Platform.OS === "web" ? "card" : "formSheet",
            headerShown: false,
            sheetAllowedDetents: Platform.OS === "ios" ? [0.6] : undefined,
            sheetGrabberVisible: Platform.OS === "ios",
            sheetCornerRadius: 24,
          }}
        />
        <Stack.Screen
          name="goals"
          options={{
            presentation: Platform.OS === "web" ? "card" : "formSheet",
            headerShown: false,
            sheetAllowedDetents:
              Platform.OS === "ios" ? [0.85, 1.0] : undefined,
            sheetGrabberVisible: Platform.OS === "ios",
            sheetCornerRadius: 24,
          }}
        />
        <Stack.Screen
          name="entry/[id]"
          options={{
            presentation: Platform.OS === "web" ? "card" : "modal",
            headerShown: false,
            contentStyle: { backgroundColor: "#F9FAFB" },
          }}
        />
        <Stack.Screen
          name="export"
          options={{
            presentation: Platform.OS === "web" ? "card" : "formSheet",
            headerShown: false,
            sheetAllowedDetents:
              Platform.OS === "ios" ? [0.85, 1.0] : undefined,
            sheetGrabberVisible: Platform.OS === "ios",
            sheetCornerRadius: 24,
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Explicitly load MaterialCommunityIcons font to ensure icons render
  const [fontsLoaded, fontError] = useFonts({
    ...MaterialCommunityIcons.font,
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
      <I18nProvider>
        <InnerLayout colorScheme={colorScheme} />
      </I18nProvider>
    </GestureHandlerRootView>
  );
}
