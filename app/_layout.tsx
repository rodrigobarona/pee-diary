import "../global.css";

import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useFonts } from "expo-font";
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  useRouter,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as React from "react";
import { useEffect, useRef } from "react";
import { LogBox, Platform, type ColorSchemeName } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { ErrorBoundary } from "@/components/error-boundary";
import { TERMS_VERSION } from "@/constants/legal";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { I18nProvider, useI18n } from "@/lib/i18n/context";
import { useDiaryStore, useStoreHydrated } from "@/lib/store";
import { deleteExportFiles } from "@/lib/utils/export";
import { getLaunchAction } from "@/lib/utils/launch";

// Suppress a deprecation warning raised by dependencies that still use SafeAreaView
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

  // Once per launch, after the stored data has loaded: show onboarding, the
  // terms-update notice or the add menu (at most one; see getLaunchAction).
  useEffect(() => {
    if (!isHydrated || hasCheckedLaunchRef.current) return;

    // Read the store directly to avoid reacting to later changes
    const state = useDiaryStore.getState();

    // The Stack below is keyed on the locale. Wait until it follows the
    // stored language, or the remount would drop the screen pushed here.
    if (locale !== state.language) return;

    hasCheckedLaunchRef.current = true;

    // Remove export and import copies left from the last session
    deleteExportFiles().catch(() => {});

    switch (getLaunchAction(state, TERMS_VERSION)) {
      case "onboarding":
        router.replace("/welcome");
        break;
      case "termsUpdate":
        // Small delay to ensure navigation is ready
        setTimeout(() => {
          router.push("/terms-update");
        }, 100);
        break;
      case "addMenu":
        // Small delay to ensure navigation is ready
        setTimeout(() => {
          router.push("/(formSheets)/add-menu");
        }, 100);
        break;
      case "none":
        break;
    }
  }, [isHydrated, locale, router]);

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
          name="(modals)/terms-update"
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
            sheetCornerRadius: 24,
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
            sheetCornerRadius: 24,
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
            sheetCornerRadius: 24,
          }}
        />
        <Stack.Screen
          name="(formSheets)/language"
          options={{
            presentation: Platform.OS === "web" ? "card" : "formSheet",
            headerShown: false,
            sheetAllowedDetents: Platform.OS === "ios" ? [0.5] : undefined,
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
      <ErrorBoundary>
        <I18nProvider>
          <InnerLayout colorScheme={colorScheme} />
        </I18nProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
