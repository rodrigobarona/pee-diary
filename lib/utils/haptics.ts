/**
 * Standardized Haptic Feedback Utilities
 * Design Brief: Light, confirmational haptics - never aggressive
 *
 * Use cases:
 * - light: Tap feedback for buttons, toggles, selections
 * - medium: Confirmation of action (save, submit)
 * - success: Positive outcome (goal achieved, entry saved)
 * - warning: Attention needed but not alarming
 * - error: Action failed (use sparingly)
 */

import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

/**
 * Light tap feedback - most common use
 * For: Button taps, toggle switches, option selection, navigation
 */
export async function lightHaptic(): Promise<void> {
  if (Platform.OS === "web") return;
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/**
 * Medium feedback - for confirmations
 * For: Form submissions, important button presses, FAB press
 */
export async function mediumHaptic(): Promise<void> {
  if (Platform.OS === "web") return;
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/**
 * Heavy feedback - use very sparingly
 * For: Destructive actions confirmation, major milestones only
 */
export async function heavyHaptic(): Promise<void> {
  if (Platform.OS === "web") return;
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

/**
 * Success notification feedback
 * For: Entry saved, goal achieved, export complete
 */
export async function successHaptic(): Promise<void> {
  if (Platform.OS === "web") return;
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/**
 * Warning notification feedback
 * For: Approaching goal limit, validation issue
 */
export async function warningHaptic(): Promise<void> {
  if (Platform.OS === "web") return;
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

/**
 * Error notification feedback - use sparingly
 * For: Failed operations, critical errors
 */
export async function errorHaptic(): Promise<void> {
  if (Platform.OS === "web") return;
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

/**
 * Selection changed feedback
 * For: Picker value changes, slider adjustments
 */
export async function selectionHaptic(): Promise<void> {
  if (Platform.OS === "web") return;
  await Haptics.selectionAsync();
}

/**
 * Unified haptic function with type selection
 * @param type - The type of haptic feedback to trigger
 */
export async function triggerHaptic(
  type:
    | "light"
    | "medium"
    | "heavy"
    | "success"
    | "warning"
    | "error"
    | "selection"
): Promise<void> {
  switch (type) {
    case "light":
      return lightHaptic();
    case "medium":
      return mediumHaptic();
    case "heavy":
      return heavyHaptic();
    case "success":
      return successHaptic();
    case "warning":
      return warningHaptic();
    case "error":
      return errorHaptic();
    case "selection":
      return selectionHaptic();
    default:
      return lightHaptic();
  }
}
