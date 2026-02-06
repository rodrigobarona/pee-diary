/**
 * Eleva Care Brand Colors
 * Based on the Eleva.care design system
 */
export const colors = {
  // Primary - Deep Teal (calming, medical, trustworthy)
  primary: {
    DEFAULT: "#006D77",
    light: "#83C5BE",
    dark: "#004D54",
  },

  // Secondary - Soft Coral (warm, approachable)
  secondary: {
    DEFAULT: "#E29578",
    light: "#FFDDD2",
  },

  // Accent - Pale Lavender (fresh, clean)
  accent: "#E0FBFC",

  // Neutrals
  background: "#F9FAFB",
  surface: "#FFFFFF",
  text: "#333333",
  textMuted: "#6B7280",
  border: "#E2E8F0",

  // Status (use sparingly per design brief)
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
} as const;

/**
 * Semantic Colors - Apple-like patterns
 * Following iOS Human Interface Guidelines
 */
export const semanticColors = {
  // Labels (text hierarchy)
  label: {
    primary: "#111827",
    secondary: "#6B7280",
    tertiary: "#9CA3AF",
    quaternary: "#D1D5DB",
  },
  // Separators
  separator: {
    DEFAULT: "#E5E7EB",
    opaque: "#F3F4F6",
  },
  // Fills (background tints)
  fill: {
    primary: "rgba(0, 109, 119, 0.12)",
    secondary: "rgba(107, 114, 128, 0.08)",
    tertiary: "rgba(107, 114, 128, 0.04)",
  },
  // Time of day colors (muted, not bright)
  timeOfDay: {
    night: "#8B9DC3", // Muted indigo
    morning: "#D4A373", // Warm sand
    afternoon: "#C9A87C", // Muted gold
    evening: "#A78BBA", // Soft purple
  },
} as const;

/**
 * Urgency Scale Colors - Muted palette
 * Design Brief: Avoid red/green contrasts, avoid alarming colors
 * These are softer alternatives that still convey gradation
 */
export const urgencyColors = {
  1: "#83C5BE", // Soft teal - no urgency
  2: "#A7D3CF", // Light teal - slight
  3: "#D4A373", // Warm sand - moderate
  4: "#E29578", // Soft coral - strong
  5: "#C97B63", // Muted coral - urgent
} as const;

/**
 * Chart Colors - Teal-based palette
 * Avoid red/green traffic light colors
 */
export const chartColors = {
  primary: "#006D77", // Deep teal
  secondary: "#83C5BE", // Soft teal
  tertiary: "#A7D3CF", // Light teal
  accent: "#E29578", // Soft coral (for contrast)
  muted: "#9CA3AF", // Gray for neutral data
} as const;

export type ColorKey = keyof typeof colors;
