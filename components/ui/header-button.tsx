import * as React from "react";
import { Platform, Pressable, StyleSheet } from "react-native";

import { Icon, type IconName } from "./icon";
import { Text } from "./text";
import { colors } from "@/lib/theme/colors";
import {
  MIN_TOUCH_TARGET,
  iconSize,
  ripple,
  rippleBorderless,
} from "@/lib/theme/styles";
import { CONTROL_MAX_FONT_SCALE } from "@/lib/theme/typography";

// Touch targets: 44pt on iOS (HIG), 48dp on Android (Material 3)
const TARGET_SIZE = MIN_TOUCH_TARGET;

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
  color = Platform.OS === "ios" ? colors.primary.DEFAULT : colors.textSecondary,
}: HeaderIconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      android_ripple={rippleBorderless(TARGET_SIZE)}
      style={({ pressed }) => [
        styles.iconButton,
        Platform.OS === "ios" && pressed ? styles.pressedIOS : undefined,
      ]}
    >
      <Icon name={icon} size={iconSize.lg} color={color} />
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
      android_ripple={ripple}
      style={({ pressed }) => [
        styles.textButton,
        Platform.OS === "ios" && pressed ? styles.pressedIOS : undefined,
        disabled ? styles.disabled : undefined,
      ]}
    >
      <Text
        variant={Platform.OS === "ios" ? "body" : "button"}
        tone="accent"
        style={prominent ? styles.textButtonLabelProminent : undefined}
        maxFontSizeMultiplier={CONTROL_MAX_FONT_SCALE}
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
      paddingVertical: 4,
      alignItems: "center",
      justifyContent: "center",
    },
    default: {
      // Material 3 text button: 40dp visual (48dp target via hitSlop), full
      // radius, 12dp padding; grows with the font size
      minHeight: 40,
      paddingHorizontal: 12,
      borderRadius: 20,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
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
