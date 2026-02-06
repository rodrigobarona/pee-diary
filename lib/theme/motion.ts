/**
 * Motion System for Eleva Diary
 *
 * Design Brief Rules:
 * - Motion should explain, reassure, never surprise
 * - Gentle fades, soft vertical transitions
 * - No bouncing, no spring exaggeration
 * - Respect Reduce Motion accessibility setting
 */

import { Easing } from "react-native-reanimated";

/**
 * Timing curves following Apple HIG
 * Based on cubic-bezier values for smooth, natural motion
 */
export const easing = {
  // Standard curve - for most animations
  standard: Easing.bezier(0.25, 0.1, 0.25, 1),

  // Decelerate - for elements entering the screen
  decelerate: Easing.bezier(0, 0, 0.2, 1),

  // Accelerate - for elements leaving the screen
  accelerate: Easing.bezier(0.4, 0, 1, 1),

  // Ease out - gentle deceleration
  easeOut: Easing.bezier(0.33, 1, 0.68, 1),

  // Ease in out - symmetric acceleration/deceleration
  easeInOut: Easing.bezier(0.4, 0, 0.2, 1),

  // Linear - for continuous animations like loading spinners
  linear: Easing.linear,
} as const;

/**
 * Duration values in milliseconds
 * Designed to feel calm and intentional, not rushed
 */
export const duration = {
  // Instant - for micro-interactions (haptic feedback timing)
  instant: 100,

  // Fast - for small state changes (toggle, select)
  fast: 200,

  // Normal - for most transitions (default)
  normal: 300,

  // Slow - for larger animations (modal enter/exit)
  slow: 450,

  // Slower - for emphasis (onboarding, empty states)
  slower: 600,
} as const;

/**
 * Pre-configured timing animation configs
 * Use these with withTiming() for consistent motion
 *
 * IMPORTANT: Never use withSpring() - design brief prohibits bouncy animations
 */
export const timingConfig = {
  // Standard transition
  standard: {
    duration: duration.normal,
    easing: easing.standard,
  },

  // Quick response for interactive elements
  quick: {
    duration: duration.fast,
    easing: easing.easeOut,
  },

  // Gentle entrance animation
  enter: {
    duration: duration.normal,
    easing: easing.decelerate,
  },

  // Smooth exit animation
  exit: {
    duration: duration.fast,
    easing: easing.accelerate,
  },

  // Slow, gentle animation for emphasis
  gentle: {
    duration: duration.slow,
    easing: easing.easeInOut,
  },

  // Fade animation (opacity only)
  fade: {
    duration: duration.normal,
    easing: easing.linear,
  },
} as const;

/**
 * Opacity values for fade animations
 */
export const opacity = {
  visible: 1,
  dim: 0.7,
  muted: 0.5,
  faint: 0.3,
  hidden: 0,
} as const;

/**
 * Scale values for subtle feedback
 * Keep subtle to avoid feeling "bouncy"
 */
export const scale = {
  normal: 1,
  pressed: 0.97,
  subtle: 0.98,
} as const;

/**
 * Translation values for slide animations
 */
export const translate = {
  small: 8,
  medium: 16,
  large: 24,
} as const;

/**
 * Helper to get reduced motion config
 * When reduce motion is enabled, use instant duration
 */
export const getReducedMotionConfig = (reduceMotion: boolean) => ({
  duration: reduceMotion ? 0 : duration.normal,
  easing: easing.standard,
});

/**
 * Export as motion object for convenient access
 */
export const motion = {
  easing,
  duration,
  timingConfig,
  opacity,
  scale,
  translate,
  getReducedMotionConfig,
} as const;
