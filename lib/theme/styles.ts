import { StyleSheet } from "react-native";
import { colors } from "./colors";

/**
 * Shared style constants following React Native best practices (Rule 9.2):
 * - boxShadow (modern shadow syntax)
 * - borderCurve: 'continuous' (smoother iOS corners)
 * - gap (instead of child margins)
 */

export const formStyles = StyleSheet.create({
  // Card container for forms
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12, // Design brief: 8-12px max
    borderCurve: "continuous",
    padding: 16,
    gap: 12,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)", // Subtle shadow
  },

  // Alternative card without padding (for option rows)
  cardNoPadding: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12, // Design brief: 8-12px max
    borderCurve: "continuous",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)", // Subtle shadow
  },

  // Row for options/settings
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  // Section title (sentence case per design brief - no all-caps)
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },

  // Screen title
  screenTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },

  // Screen subtitle
  screenSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 20,
  },

  // Separator line
  separator: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginLeft: 70,
  },

  // Full-width separator
  separatorFull: {
    height: 1,
    backgroundColor: "#F3F4F6",
  },
});

export const buttonStyles = StyleSheet.create({
  // Primary button
  primary: {
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: 12, // Design brief: 8-12px max
    borderCurve: "continuous",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  primaryText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Secondary button
  secondary: {
    backgroundColor: colors.secondary.DEFAULT,
    borderRadius: 12, // Design brief: 8-12px max
    borderCurve: "continuous",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  secondaryText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Disabled state
  disabled: {
    opacity: 0.5,
  },

  // Destructive button
  destructive: {
    backgroundColor: "#EF4444",
    borderRadius: 12, // Design brief: 8-12px max
    borderCurve: "continuous",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  destructiveText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export const iconStyles = StyleSheet.create({
  // Icon container (small)
  containerSmall: {
    width: 40,
    height: 40,
    borderRadius: 10, // Design brief: 8-12px
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },

  // Icon container (medium)
  containerMedium: {
    width: 48,
    height: 48,
    borderRadius: 12, // Design brief: 8-12px max
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },

  // Icon container (large)
  containerLarge: {
    width: 56,
    height: 56,
    borderRadius: 12, // Design brief: 8-12px max
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
});

// Common spacing values
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  "3xl": 32,
  "4xl": 40,
} as const;

/**
 * Border radius values - Design Brief: 8-12px, soft but not bubbly
 * IMPORTANT: Only use 'full' for circular elements (avatars, circular buttons)
 */
export const borderRadius = {
  none: 0,
  sm: 6, // Small elements, badges
  md: 8, // Chips, pills, small interactive elements
  lg: 10, // Cards, containers - DEFAULT for most UI
  xl: 12, // Large cards, modals - MAX for non-circular
  full: 9999, // ONLY for circular elements
} as const;

/**
 * Shadow system - Design Brief: Extremely subtle, one elevation level
 * Never use heavy "material" shadows
 */
export const shadows = {
  none: "none",
  // Subtle shadow for minimal elevation
  subtle: "0 1px 2px rgba(0, 0, 0, 0.03)",
  // Card shadow - default for cards
  card: "0 1px 3px rgba(0, 0, 0, 0.05)",
  // Elevated shadow - MAX allowed
  elevated: "0 2px 6px rgba(0, 0, 0, 0.06)",
} as const;

/**
 * Shadow styles for React Native (StyleSheet compatible)
 * Use these in StyleSheet.create() for native shadows
 */
export const shadowStyles = StyleSheet.create({
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  subtle: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  elevated: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
});
