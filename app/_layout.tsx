import "../global.css";

import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useFonts } from "expo-font";
import {
  type NativeStackNavigationOptions,
  Stack,
  ThemeProvider,
  useRouter,
} from "expo-router";
import { getFocusedRouteNameFromRoute } from "expo-router/react-navigation";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as React from "react";
import { useEffect, useRef } from "react";
import { LogBox, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { ErrorBoundary } from "@/components/error-boundary";
import { TERMS_VERSION } from "@/constants/legal";
import { useReminderSync } from "@/hooks/use-reminder-sync";
import { I18nProvider, useI18n } from "@/lib/i18n/context";
import { useDiaryStore, useStoreHydrated } from "@/lib/store";
import { deleteExportFiles } from "@/lib/utils/export";
import { navigationTheme, stackHeaderOptions } from "@/lib/theme/navigation";
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
const formOptions: NativeStackNavigationOptions = {
  presentation: Platform.OS === "web" ? "card" : "modal",
  headerShown: true,
};

// iOS: form sheet with the system grabber and corner radius. Android: bottom
// sheet with 28dp top corners; each sheet draws the Material drag handle
// (SheetHandle).
const sheetOptions: NativeStackNavigationOptions = {
  presentation: Platform.OS === "web" ? "card" : "formSheet",
  headerShown: false,
  sheetGrabberVisible: Platform.OS === "ios",
  sheetCornerRadius: Platform.OS === "android" ? 28 : undefined,
};

function InnerLayout() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const isHydrated = useStoreHydrated();
  const hasCheckedLaunchRef = useRef(false);

  // Reschedule reminders at launch, on return to the app and on changes
  useReminderSync(isHydrated);

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
    // The app has only a light appearance for now (app.json
    // userInterfaceStyle "light"): light navigation colours and dark
    // status-bar content, even when the phone is in dark mode; the brand
    // teal as the navigation tint.
    <ThemeProvider value={navigationTheme}>
      <Stack
        key={locale} // Force re-mount on locale change to update all translations
        screenOptions={stackHeaderOptions}
      >
        {/* No swipe back: onboarding ends only on its last page (welcome.tsx
            also handles the Android back button page by page) */}
        <Stack.Screen
          name="(onboarding)"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="(tabs)"
          options={({ route }) => ({
            headerShown: false,
            // Shown by the back button of Settings on iOS ("< Today")
            title:
              getFocusedRouteNameFromRoute(route) === "history"
                ? t("tabs.history")
                : t("tabs.home"),
          })}
        />
        {/* Pushed from the gear on Today and History: inline title, native
            back button and swipe back on iOS, arrow back on Android */}
        <Stack.Screen name="settings" options={{ title: t("tabs.settings") }} />
        {/* Add and edit forms: a page sheet with a navigation bar on iOS, a
            full-screen dialog with a top app bar on Android. The title and
            the bar buttons come from useEntryFormHeader. */}
        <Stack.Screen name="(modals)/add/urination" options={formOptions} />
        <Stack.Screen name="(modals)/add/fluid" options={formOptions} />
        <Stack.Screen name="(modals)/add/leak" options={formOptions} />
        <Stack.Screen name="(modals)/entry/[id]" options={formOptions} />
        <Stack.Screen
          name="(modals)/terms-update"
          options={{
            presentation: Platform.OS === "web" ? "card" : "modal",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(formSheets)/add-menu"
          options={{ ...sheetOptions, sheetAllowedDetents: "fitToContents" }}
        />
        <Stack.Screen
          name="(formSheets)/goals"
          options={{
            ...sheetOptions,
            sheetAllowedDetents:
              Platform.OS === "ios" ? [0.85, 1.0] : undefined,
          }}
        />
        <Stack.Screen
          name="(formSheets)/export"
          options={{
            ...sheetOptions,
            // Large detent only: the range, the format and the button do
            // not fit a shorter sheet
            sheetAllowedDetents: Platform.OS === "ios" ? [1.0] : undefined,
          }}
        />
        <Stack.Screen
          name="(formSheets)/language"
          options={{ ...sheetOptions, sheetAllowedDetents: "fitToContents" }}
        />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
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
          <InnerLayout />
        </I18nProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
