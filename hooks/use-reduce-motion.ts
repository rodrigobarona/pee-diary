/**
 * Hook for respecting user's Reduce Motion accessibility preference
 * Design Brief: Respect accessibility settings, skip animations when needed
 */

import * as React from "react";
import { AccessibilityInfo } from "react-native";

/**
 * Hook that returns whether reduce motion is enabled
 * @returns boolean - true if user has enabled Reduce Motion setting
 */
export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = React.useState(false);

  React.useEffect(() => {
    // Get initial value
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setReduceMotion(enabled);
    });

    // Listen for changes
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (enabled) => {
        setReduceMotion(enabled);
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}

/**
 * Returns animation duration based on reduce motion preference
 * @param reduceMotion - whether reduce motion is enabled
 * @param normalDuration - normal animation duration in ms
 * @returns 0 if reduce motion enabled, otherwise normalDuration
 */
export function getAnimationDuration(
  reduceMotion: boolean,
  normalDuration: number
): number {
  return reduceMotion ? 0 : normalDuration;
}
