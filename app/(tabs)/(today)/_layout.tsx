import { Stack } from "expo-router";
import { Platform } from "react-native";

import { SettingsHeaderButton } from "@/components/settings-header-button";
import { useI18n } from "@/lib/i18n/context";
import { tabStackHeaderOptions } from "@/lib/theme/navigation";

export default function TodayLayout() {
  const { t } = useI18n();

  return (
    <Stack screenOptions={tabStackHeaderOptions}>
      <Stack.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          // The screen is one scroll view, so the large title collapses
          // into the bar as it scrolls (iOS)
          headerLargeTitleEnabled: Platform.OS === "ios",
          headerRight: () => <SettingsHeaderButton />,
        }}
      />
    </Stack>
  );
}
