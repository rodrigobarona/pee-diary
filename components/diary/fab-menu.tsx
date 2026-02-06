import { Text } from "@/components/ui/text";
import { useI18n } from "@/lib/i18n/context";
import { colors } from "@/lib/theme";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as React from "react";
import {
  Platform,
  Pressable,
  Text as RNText,
  StyleSheet,
  View,
} from "react-native";

export function FABMenu() {
  const { t } = useI18n();
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleToggle = React.useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsOpen((prev) => !prev);
  }, []);

  const handleSelect = React.useCallback(
    (action: string) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      setIsOpen(false);
      switch (action) {
        case "urination":
          router.push("/add/urination");
          break;
        case "fluid":
          router.push("/add/fluid");
          break;
        case "leak":
          router.push("/add/leak");
          break;
      }
    },
    [router]
  );

  // Use text fallback on web if icons don't render
  const renderIcon = (name: string, size: number, color: string) => {
    if (Platform.OS === "web") {
      // Use simple symbols as fallback for plus/close only
      const symbolMap: Record<string, string> = {
        plus: "+",
        close: "×",
      };
      if (name === "plus" || name === "close") {
        return (
          <Text
            style={{
              fontSize: size,
              color,
              fontWeight: "bold",
              lineHeight: size,
            }}
          >
            {symbolMap[name]}
          </Text>
        );
      }
    }
    return (
      <MaterialCommunityIcons name={name as any} size={size} color={color} />
    );
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Menu Items - shown when open */}
      {isOpen ? (
        <View style={styles.menuContainer}>
          <Pressable
            onPress={() => handleSelect("urination")}
            style={styles.menuItem}
          >
            <View style={[styles.menuIcon, { backgroundColor: "#83C5BE" }]}>
              {renderIcon("toilet", 20, "#006D77")}
            </View>
            <Text className="text-sm font-medium text-foreground">
              {t("entry.addUrination")}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleSelect("fluid")}
            style={styles.menuItem}
          >
            <View style={[styles.menuIcon, { backgroundColor: "#FFDDD2" }]}>
              {renderIcon("cup-water", 20, "#E29578")}
            </View>
            <Text className="text-sm font-medium text-foreground">
              {t("entry.addFluid")}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleSelect("leak")}
            style={styles.menuItem}
          >
            <View style={[styles.menuIcon, { backgroundColor: colors.accent }]}>
              {renderIcon("water-alert", 20, colors.primary.light)}
            </View>
            <Text className="text-sm font-medium text-foreground">
              {t("entry.addLeak")}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* FAB Button */}
      <Pressable
        onPress={handleToggle}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        accessibilityRole="button"
        accessibilityLabel="Add new entry"
        accessibilityHint="Opens menu to add urination, fluid intake, or leak entry"
      >
        <RNText style={styles.fabIconText}>{isOpen ? "×" : "+"}</RNText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 24,
    right: 24,
    alignItems: "flex-end",
    zIndex: 100,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28, // Circular element - ok to use full radius
    backgroundColor: "#006D77",
    alignItems: "center",
    justifyContent: "center",
    // Design brief: Subtle shadows only
    ...(Platform.OS === "web"
      ? { boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.08)" }
      : {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 3,
        }),
  },
  fabPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  fabIconText: {
    fontSize: 32,
    color: "#FFFFFF",
    fontWeight: "300",
    lineHeight: 32,
    textAlign: "center",
  },
  menuContainer: {
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12, // Design brief: 8-12px max
    borderCurve: "continuous",
    paddingVertical: 8,
    // Design brief: Subtle shadows only
    ...(Platform.OS === "web"
      ? { boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.06)" }
      : {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
        }),
    minWidth: 200,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
