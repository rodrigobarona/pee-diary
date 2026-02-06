import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useShallow } from "zustand/react/shallow";

import { Text } from "@/components/ui/text";
import { useI18n } from "@/lib/i18n/context";
import { useDiaryStore, useStoreHydrated } from "@/lib/store";
import { colors } from "@/lib/theme/colors";

interface MenuRowProps {
  icon: string;
  label: string;
  subtitle: string;
  onPress: () => void;
  showSeparator?: boolean;
}

function MenuRow({
  icon,
  label,
  subtitle,
  onPress,
  showSeparator = true,
}: MenuRowProps) {
  return (
    <>
      <Pressable onPress={onPress} style={styles.row}>
        <View style={styles.iconBox}>
          <MaterialCommunityIcons
            name={icon as any}
            size={22}
            color={colors.primary.DEFAULT}
          />
        </View>
        <View style={styles.rowContent}>
          <Text style={styles.rowLabel}>{label}</Text>
          <Text style={styles.rowSubtitle}>{subtitle}</Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color="#9CA3AF"
        />
      </Pressable>
      {showSeparator ? <View style={styles.separator} /> : null}
    </>
  );
}

export default function SettingsIndex() {
  const { t } = useI18n();
  const { push, setParams } = useRouter();
  const params = useLocalSearchParams<{ openGoals?: string }>();
  const isHydrated = useStoreHydrated();
  const entryCount = useDiaryStore(useShallow((state) => state.entries.length));
  const goals = useDiaryStore((state) => state.goals);

  // Open goals screen if navigated with openGoals param
  React.useEffect(() => {
    if (params.openGoals === "true") {
      setParams({ openGoals: undefined });
      push("/(formSheets)/goals");
    }
  }, [params.openGoals, push, setParams]);

  const handleOpenGoals = React.useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    push("/(formSheets)/goals");
  }, [push]);

  const handleOpenPreferences = React.useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    push("/(tabs)/settings/preferences");
  }, [push]);

  const handleOpenData = React.useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    push("/(tabs)/settings/data");
  }, [push]);

  const handleOpenAbout = React.useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    push("/(tabs)/settings/about");
  }, [push]);

  const goalsSubtitle = `${goals.fluidTarget}ml \u00B7 ${goals.voidTarget} ${t(
    "goals.voids"
  )}`;

  return (
    <ScrollView
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.card}>
        <MenuRow
          icon="target"
          label={t("settings.editGoals")}
          subtitle={goalsSubtitle}
          onPress={handleOpenGoals}
        />
        <MenuRow
          icon="tune"
          label={t("settings.preferences")}
          subtitle={t("settings.preferencesDescription")}
          onPress={handleOpenPreferences}
        />
        <MenuRow
          icon="database"
          label={t("settings.dataAndStorage")}
          subtitle={t("settings.dataAndStorageDescription")}
          onPress={handleOpenData}
        />
        <MenuRow
          icon="information-outline"
          label={t("settings.about")}
          subtitle="v1.0.0"
          onPress={handleOpenAbout}
          showSeparator={false}
        />
      </View>

      {/* Entry count footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {isHydrated ? `${entryCount} entries recorded` : "Loading..."}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderCurve: "continuous",
    paddingHorizontal: 16,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderCurve: "continuous",
    backgroundColor: "rgba(0, 109, 119, 0.1)",
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
  },
  rowSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginLeft: 56,
  },
  footer: {
    marginTop: 24,
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    color: "#9CA3AF",
  },
});
