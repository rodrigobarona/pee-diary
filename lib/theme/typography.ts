/**
 * Typography System for Eleva Diary
 * Based on design brief: Inter (primary) + DM Sans (secondary)
 *
 * Inter: Body text, labels, inputs, charts, settings
 * DM Sans: Section headers, empty states, gentle prompts
 */

import { Platform, TextStyle } from "react-native";

/**
 * Font family constants
 * Uses Google Fonts: Inter + DM Sans
 */
export const fontFamily = {
  // Inter - Primary font for UI
  inter: {
    regular: "Inter_400Regular",
    medium: "Inter_500Medium",
    semiBold: "Inter_600SemiBold",
    bold: "Inter_700Bold",
  },
  // DM Sans - Secondary font for headers and prompts
  dmSans: {
    regular: "DMSans_400Regular",
    medium: "DMSans_500Medium",
    semiBold: "DMSans_600SemiBold",
    bold: "DMSans_700Bold",
  },
  // System fallback (used during font loading)
  system: Platform.select({
    ios: "System",
    android: "Roboto",
    default: "System",
  }),
} as const;

/**
 * Font size scale (in pixels)
 * Based on Apple HIG recommendations
 */
export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 17,
  xl: 20,
  "2xl": 24,
  "3xl": 28,
  "4xl": 34,
} as const;

/**
 * Line height multipliers
 * Design brief: Line height must breathe (1.4–1.6)
 */
export const lineHeight = {
  tight: 1.2,
  snug: 1.35,
  normal: 1.5,
  relaxed: 1.6,
} as const;

/**
 * Letter spacing values
 */
export const letterSpacing = {
  tighter: -0.5,
  tight: -0.25,
  normal: 0,
  wide: 0.25,
  wider: 0.5,
} as const;

/**
 * Typography presets following design brief
 * Ready-to-use text styles for consistency
 */
export const typography: Record<string, TextStyle> = {
  // Large title - DM Sans Bold 34px
  largeTitle: {
    fontFamily: fontFamily.dmSans.bold,
    fontSize: fontSize["4xl"],
    lineHeight: fontSize["4xl"] * lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },

  // Title 1 - DM Sans Bold 28px
  title1: {
    fontFamily: fontFamily.dmSans.bold,
    fontSize: fontSize["3xl"],
    lineHeight: fontSize["3xl"] * lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },

  // Title 2 - DM Sans SemiBold 24px
  title2: {
    fontFamily: fontFamily.dmSans.semiBold,
    fontSize: fontSize["2xl"],
    lineHeight: fontSize["2xl"] * lineHeight.snug,
    letterSpacing: letterSpacing.normal,
  },

  // Title 3 - DM Sans SemiBold 20px
  title3: {
    fontFamily: fontFamily.dmSans.semiBold,
    fontSize: fontSize.xl,
    lineHeight: fontSize.xl * lineHeight.snug,
    letterSpacing: letterSpacing.normal,
  },

  // Headline - Inter SemiBold 17px
  headline: {
    fontFamily: fontFamily.inter.semiBold,
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  // Body - Inter Regular 17px
  body: {
    fontFamily: fontFamily.inter.regular,
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  // Body Medium - Inter Medium 17px
  bodyMedium: {
    fontFamily: fontFamily.inter.medium,
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  // Callout - Inter Regular 16px
  callout: {
    fontFamily: fontFamily.inter.regular,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  // Subheadline - Inter Medium 15px
  subheadline: {
    fontFamily: fontFamily.inter.medium,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  // Footnote - Inter Regular 13px
  footnote: {
    fontFamily: fontFamily.inter.regular,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  // Caption 1 - Inter Regular 12px (smaller than footnote)
  caption1: {
    fontFamily: fontFamily.inter.regular,
    fontSize: 12,
    lineHeight: 12 * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  // Caption 2 - Inter Medium 11px
  caption2: {
    fontFamily: fontFamily.inter.medium,
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.normal,
    letterSpacing: letterSpacing.wide,
  },

  // Section header - DM Sans Medium 13px (sentence case, not uppercase!)
  sectionHeader: {
    fontFamily: fontFamily.dmSans.medium,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
    letterSpacing: letterSpacing.wider,
  },

  // Button text - Inter SemiBold 17px
  button: {
    fontFamily: fontFamily.inter.semiBold,
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * lineHeight.tight,
    letterSpacing: letterSpacing.normal,
  },

  // Tab bar label - Inter Medium 10px
  tabLabel: {
    fontFamily: fontFamily.inter.medium,
    fontSize: 10,
    lineHeight: 10 * lineHeight.tight,
    letterSpacing: letterSpacing.normal,
  },

  // Number display (for stats) - Inter Bold 32px
  statNumber: {
    fontFamily: fontFamily.inter.bold,
    fontSize: 32,
    lineHeight: 32 * lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },

  // Empty state message - DM Sans Regular 17px
  emptyState: {
    fontFamily: fontFamily.dmSans.regular,
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * lineHeight.relaxed,
    letterSpacing: letterSpacing.normal,
  },
} as const;

/**
 * Export font files to load with expo-font
 * Used in app/_layout.tsx
 */
export {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

export {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
