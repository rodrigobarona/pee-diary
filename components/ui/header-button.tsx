import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as React from "react";
import { Platform, Pressable, StyleSheet, Text } from "react-native";

import { colors } from "@/lib/theme/colors";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

// Touch targets: 44pt on iOS (HIG), 48dp on Android (Material 3)
const TARGET_SIZE = Platform.OS === "ios" ? 44 : 48;

interface HeaderIconButtonProps {
  icon: IconName;
  // Accessible name; the icon itself is hidden from screen readers
  label: string;
  onPress: () => void;
  testID?: string;
  color?: string;
}

/**
 * Icon-only button for navigation bars (iOS) and top app bars (Android).
 */
export function HeaderIconButton({
  icon,
  label,
  onPress,
  testID,
  color = Platform.OS === "ios" ? colors.primary.DEFAULT : "#374151",
}: HeaderIconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      android_ripple={{
        color: "rgba(0, 0, 0, 0.12)",
        borderless: true,
        radius: TARGET_SIZE / 2,
      }}
      style={({ pressed }) => [
        styles.iconButton,
        Platform.OS === "ios" && pressed ? styles.pressedIOS : undefined,
      ]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={24}
        color={color}
        accessible={false}
        importantForAccessibility="no"
      />
    </Pressable>
  );
}

interface HeaderTextButtonProps {
  label: string;
  onPress: () => void;
  testID?: string;
  // The confirming action of a sheet (Save, Update) is bold on iOS
  prominent?: boolean;
  disabled?: boolean;
}

/**
 * Text button for navigation bars: Cancel / Save on iOS, the Material 3
 * text button ("Save") in an Android top app bar.
 */
export function HeaderTextButton({
  label,
  onPress,
  testID,
  prominent = false,
  disabled = false,
}: HeaderTextButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      hitSlop={Platform.OS === "android" ? 4 : undefined}
      android_ripple={{ color: "rgba(0, 109, 119, 0.12)" }}
      style={({ pressed }) => [
        styles.textButton,
        Platform.OS === "ios" && pressed ? styles.pressedIOS : undefined,
        disabled ? styles.disabled : undefined,
      ]}
    >
      <Text
        style={[
          styles.textButtonLabel,
          prominent ? styles.textButtonLabelProminent : undefined,
        ]}
        maxFontSizeMultiplier={1.4}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: TARGET_SIZE,
    height: TARGET_SIZE,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: TARGET_SIZE / 2,
  },
  textButton: Platform.select({
    ios: {
      minHeight: 44,
      minWidth: 44,
      paddingHorizontal: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    default: {
      // Material 3 text button: 40dp tall, full radius, 12dp padding
      height: 40,
      paddingHorizontal: 12,
      borderRadius: 20,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
    },
  }),
  textButtonLabel: Platform.select({
    ios: {
      fontSize: 17,
      color: colors.primary.DEFAULT,
    },
    default: {
      fontSize: 14,
      fontWeight: "500",
      letterSpacing: 0.1,
      color: colors.primary.DEFAULT,
    },
  }),
  textButtonLabelProminent: Platform.select({
    ios: { fontWeight: "600" },
    default: {},
  }),
  pressedIOS: {
    opacity: 0.4,
  },
  disabled: {
    opacity: 0.38,
  },
});
