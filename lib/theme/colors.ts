/**
 * Eleva Care Brand Colors
 * Based on the Eleva.care design system
 */
export const colors = {
  // Primary - Deep Teal (calming, medical, trustworthy)
  primary: {
    DEFAULT: '#006D77',
    light: '#83C5BE',
    dark: '#004D54',
  },

  // Secondary - Soft Coral (warm, approachable)
  secondary: {
    DEFAULT: '#E29578',
    light: '#FFDDD2',
  },

  // Accent - Pale Lavender (fresh, clean)
  accent: '#E0FBFC',

  // Neutrals
  background: '#F9FAFB',
  surface: '#FFFFFF',
  text: '#333333',
  textMuted: '#6B7280',
  border: '#E2E8F0',

  // Status
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
} as const;

export type ColorKey = keyof typeof colors;
