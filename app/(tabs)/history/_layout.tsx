import { Stack } from "expo-router";

import { SettingsHeaderButton } from "@/components/settings-header-button";
import { useI18n } from "@/lib/i18n/context";
import { tabStackHeaderOptions } from "@/lib/theme/navigation";

export default function HistoryLayout() {
  const { t } = useI18n();

  return (
    <Stack screenOptions={tabStackHeaderOptions}>
      <Stack.Screen
        name="index"
        options={{
          title: t("tabs.history"),
          // Inline title on iOS: the week strip and filters stay fixed under
          // the bar, so a large title would never collapse and would only
          // take space from the entries
          headerRight: () => <SettingsHeaderButton />,
        }}
      />
    </Stack>
  );
}
