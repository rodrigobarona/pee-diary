import { Platform } from 'react-native';

/**
 * Eleva Care colour tokens (light only for this release).
 *
 * Every text colour meets WCAG AA (4.5:1) on the surfaces it is used on
 * (white #FFFFFF, backgrounds #F9FAFB and #F2F2F7, muted #F3F4F6); every
 * meaningful icon and control outline meets 3:1. Ratios are on white unless
 * stated; the lowest ratio on any of those surfaces is noted where it is
 * close to the limit.
 * Keep in step with the colour tokens in global.css.
 *
 * Fills (bars, dots, tinted tiles) may use the light brand colours; text and
 * icons that carry meaning use the "text"/"accent" tokens.
 */
export const colors = {
  // Brand teal. White on teal 6.08:1; teal on white 6.08:1, on #F9FAFB 5.82:1
  primary: {
    DEFAULT: '#006D77',
    light: '#83C5BE', // fills only
    dark: '#004D54', // 9.59:1
    // Selected container (Material 3 primary container) and its text
    container: '#CDE8EA',
    onContainer: '#004D54', // 7.46:1 on the container
    // Faint tint for unselected options and icon tiles
    subtle: '#E6F2F3',
  },

  // Brand coral: a fill colour only (2.39:1 as text). Text and icons in the
  // coral family use secondary.text.
  secondary: {
    DEFAULT: '#E29578',
    light: '#FFDDD2',
    text: '#9A4A2C', // 6.19:1, 4.87:1 on secondary.light
  },

  // Pale aqua (fills only)
  accent: '#E0FBFC',

  // Surfaces. iOS: the grouped background (systemGroupedBackground) so the
  // white cards and lists stand out without shadows; Android: a light
  // neutral, with outlined cards.
  background: Platform.select({ ios: '#F2F2F7', default: '#F9FAFB' }),
  surface: '#FFFFFF',
  surfaceMuted: '#F3F4F6',

  // Text
  text: '#111827', // 17.74:1
  textSecondary: '#4B5563', // 7.56:1, 6.87:1 on #F3F4F6
  textTertiary: '#5C6370', // 6.05:1, 5.49:1 on #F3F4F6
  textPlaceholder: '#6B7280', // 4.83:1 (inputs on white only)
  onPrimary: '#FFFFFF',

  // Lines and outlines
  border: '#E2E8F0', // decorative card and field borders
  separator: '#E5E7EB', // decorative hairlines
  // Radio rings, switch outlines, Android chevrons: 4.48:1 (non-text 3:1)
  outline: '#6F7979',
  // iOS disclosure chevrons: 3.26:1
  chevron: '#8E8E93',

  // Destructive actions and errors: the platform's accessible red
  // (iOS #D70015 5.38:1; Material 3 error #B3261E 6.54:1)
  destructive: Platform.select({ ios: '#D70015', default: '#B3261E' }),

  // Identity accents for the three entry types. Not judgements: the leak
  // colour marks the category only, never a selected or error state.
  category: {
    urination: { accent: '#006D77', container: '#E6F2F3' },
    fluid: { accent: '#9A4A2C', fill: '#E29578', container: '#FFDDD2' },
    leak: { accent: '#BE123C', container: '#FEE2E2' }, // 6.29:1, 5.15:1 on container
  },

  // Neutral highlight colours
  amber: { accent: '#92400E', container: '#FEF3C7' }, // 6.37:1 on container
  indigo: { accent: '#4F46E5', container: '#EEF2FF' }, // 6.29:1
  violet: { accent: '#7C3AED', container: '#EDE9FE' }, // 5.70:1
  sky: { accent: '#0369A1', container: '#E0F2FE' }, // 5.93:1
  green: { accent: '#047857', container: '#D1FAE5' }, // 5.48:1
  orange: { accent: '#C2410C', container: '#FFEDD5' }, // 5.18:1

  // Press feedback
  ripple: 'rgba(0, 109, 119, 0.12)', // Material 3 pressed state layer, teal
  rippleNeutral: 'rgba(0, 0, 0, 0.12)',
  highlight: '#E5E5EA', // iOS cell highlight (systemGray5)
} as const;

export type ColorKey = keyof typeof colors;
