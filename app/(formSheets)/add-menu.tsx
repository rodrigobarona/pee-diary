import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import * as React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { useI18n } from "@/lib/i18n/context";
import { colors } from "@/lib/theme/colors";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AddOptionProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  description: string;
  color: string;
  onPress: () => void;
}

function AddOption({
  icon,
  label,
  description,
  color,
  onPress,
}: AddOptionProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = React.useCallback(() => {
    scale.value = withTiming(0.97, { duration: 100 });
  }, [scale]);

  const handlePressOut = React.useCallback(() => {
    scale.value = withTiming(1, { duration: 150 });
  }, [scale]);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.optionContainer, animatedStyle]}
    >
      <View
        style={[styles.optionIconContainer, { backgroundColor: `${color}15` }]}
      >
        <MaterialCommunityIcons name={icon} size={28} color={color} />
      </View>
      <View style={styles.optionTextContainer}>
        <Text style={styles.optionLabel}>{label}</Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color="#9CA3AF" />
    </AnimatedPressable>
  );
}

export default function AddMenuScreen() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  const handleOptionPress = React.useCallback((route: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Dismiss the formSheet first, then push the modal form
    router.dismiss();

    // Use setTimeout to let the formSheet dismiss animation complete
    setTimeout(() => {
      router.push(route as any);
    }, 300);
  }, []);

  const options = [
    {
      icon: "toilet" as const,
      label: t("add.urination"),
      description: t("add.urinationDesc"),
      color: colors.primary.DEFAULT,
      route: "/(modals)/add/urination",
    },
    {
      icon: "cup-water" as const,
      label: t("add.fluid"),
      description: t("add.fluidDesc"),
      color: colors.secondary.DEFAULT,
      route: "/(modals)/add/fluid",
    },
    {
      icon: "water-alert" as const,
      label: t("add.leak"),
      description: t("add.leakDesc"),
      color: colors.primary.light, // Design brief: No red for leaks - use soft teal
      route: "/(modals)/add/leak",
    },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom:
            Platform.OS === "ios" ? Math.max(insets.bottom, 20) + 16 : 0,
          paddingTop: Platform.OS === "ios" ? 38 : 0,
        },
      ]}
    >
      {/* Title */}
      <Text style={styles.title}>{t("add.title")}</Text>
      <Text style={styles.subtitle}>{t("add.subtitle")}</Text>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <AddOption
            key={option.route}
            icon={option.icon}
            label={option.label}
            description={option.description}
            color={option.color}
            onPress={() => handleOptionPress(option.route)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  optionsContainer: {
    marginBottom: 12,
  },
  optionContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12, // Design brief: 8-12px max
    borderCurve: "continuous",
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  optionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12, // Design brief: 8-12px max
    alignItems: "center",
    justifyContent: "center",
  },
  optionTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: "#6B7280",
  },
});
