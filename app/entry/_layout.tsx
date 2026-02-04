import { Stack } from "expo-router";
import { useI18n } from "@/lib/i18n/context";

export default function EntryLayout() {
  const { t, locale } = useI18n();

  return (
    <Stack
      key={locale}
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "#FFFFFF",
        },
        headerTitleStyle: {
          color: "#333333",
          fontWeight: "600",
        },
        headerTintColor: "#006D77",
        // NOTE: contentStyle removed - let individual screens handle background
        // Presentation settings (formSheet, sheetAllowedDetents, etc.)
        // are configured in app/_layout.tsx at the root level to avoid conflicts
      }}
    >
      <Stack.Screen
        name="[id]"
        options={{
          title: t("detail.editEntry"),
        }}
      />
    </Stack>
  );
}
