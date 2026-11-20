import { Platform, type PressableAndroidRippleConfig } from 'react-native';

import { colors } from './colors';

/**
 * Layout and interaction tokens shared by every screen.
 */

// 4/8-point grid
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// Horizontal screen margin: 16 on compact widths on both platforms
export const SCREEN_MARGIN = spacing.lg;

/**
 * Window width classes (dp on Android, pt on iOS), the same on both
 * platforms: Material 3's breakpoints, which Samsung and Apple's iPhone Duo
 * guidance line up with. Layouts switch on the window's width, never on the
 * device or its orientation (see hooks/use-window-class.ts).
 * - compact  < 600: phones, cover screens (today's layout)
 * - medium   600-839: unfolded foldables in portrait
 * - expanded >= 840: unfolded foldables in landscape, tablets
 */
export const BREAKPOINTS = {
  medium: 600,
  expanded: 840,
} as const;

/**
 * Widest a column of content may grow on large windows, so lines stay
 * readable (about 45-75 characters) and controls are not stretched.
 * - reading: forms, sheets, Settings, legal text
 * - page: the Today and History screens in one column
 * - wide: screens in two panes (Today with its side pane, History)
 */
export const MAX_CONTENT_WIDTH = {
  reading: 600,
  page: 680,
  wide: 1040,
} as const;

/**
 * Style for a content column centred in its parent and no wider than
 * `maxWidth` (for a ScrollView's contentContainerStyle or a View).
 */
export function columnStyle(maxWidth: number) {
  return { width: '100%', maxWidth, alignSelf: 'center' } as const;
}

// Corner radii
export const radius = {
  sm: 8, // small tiles, inner elements
  md: 12, // cards, grouped lists, option tiles, text fields
  lg: 16, // sheets content blocks, large buttons on Android FAB
  full: 9999, // chips, pills, circular buttons
} as const;

// Minimum touch target: 44x44pt (iOS HIG), 48x48dp (Material 3)
export const MIN_TOUCH_TARGET = Platform.OS === 'ios' ? 44 : 48;

/**
 * hitSlop that grows a control whose visual is `size` tall/wide to the
 * platform's minimum touch target.
 */
export function hitSlopFor(width: number, height: number = width) {
  const h = Math.max(0, Math.ceil((MIN_TOUCH_TARGET - width) / 2));
  const v = Math.max(0, Math.ceil((MIN_TOUCH_TARGET - height) / 2));
  return { top: v, bottom: v, left: h, right: h };
}

// Icon sizes
export const iconSize = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
} as const;

/**
 * Android press feedback (Material 3 pressed state layer). `foreground`
 * draws the ripple over the content, so it shows on filled cards too; give
 * rounded pressables `overflow: 'hidden'` so it follows the corners.
 */
export const ripple: PressableAndroidRippleConfig = {
  color: colors.ripple,
  foreground: true,
};

export const rippleNeutral: PressableAndroidRippleConfig = {
  color: colors.rippleNeutral,
  foreground: true,
};

// Ripple for round icon buttons (drawn outside the bounds, as Material does)
export const rippleBorderless = (size: number): PressableAndroidRippleConfig => ({
  color: colors.rippleNeutral,
  borderless: true,
  radius: size / 2,
});

/**
 * A card: white surface, 12-point corners. iOS uses no shadow (grouped
 * content on the background); Android uses a Material 3 outlined card.
 */
export const cardStyle = Platform.select({
  ios: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderCurve: 'continuous' as const,
  },
  default: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

/**
 * Selected and unselected option tiles (volume, drink type, leak amount,
 * activities): one neutral selection style for every picker, the brand
 * teal on its container. The border width stays the same so nothing moves.
 * Category colours are kept for icons only, never for the selected state.
 */
export const selectionStyle = {
  unselected: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 2,
  },
  selected: {
    backgroundColor: colors.primary.container,
    borderColor: colors.primary.DEFAULT,
    borderWidth: 2,
  },
  // Text on the tiles
  textUnselected: colors.text,
  textSelected: colors.primary.onContainer,
} as const;
