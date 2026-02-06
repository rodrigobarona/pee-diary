import { Stack } from "expo-router";

import { useI18n } from "@/lib/i18n/context";

export default function SettingsLayout() {
  const { t } = useI18n();

  return (
    <Stack
      screenOptions={{
        headerBackTitle: t("tabs.settings"),
      }}
    >
      <Stack.Screen name="index" options={{ title: t("tabs.settings") }} />
      <Stack.Screen
        name="preferences"
        options={{ title: t("settings.preferences") }}
      />
      <Stack.Screen
        name="data"
        options={{ title: t("settings.dataAndStorage") }}
      />
      <Stack.Screen name="about" options={{ title: t("settings.about") }} />
    </Stack>
  );
}
