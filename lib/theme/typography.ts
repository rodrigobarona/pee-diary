import { Platform, type TextStyle } from 'react-native';

/**
 * One type scale for the app, named after the iOS text styles and mapped to
 * the Material 3 type roles on Android.
 *
 * iOS (Human Interface Guidelines, default "Large" size, points):
 *   largeTitle 34/41, title1 28/34, title2 22/28, title3 20/25,
 *   headline 17/22 semibold, body 17/22, callout 16/21, subheadline 15/20,
 *   footnote 13/18, caption1 12/16, caption2 11/13.
 * Android (Material 3, sp):
 *   largeTitle = headlineLarge 32/40, title1 = headlineMedium 28/36,
 *   title2 = headlineSmall 24/32, title3 = titleLarge 22/28,
 *   headline = titleMedium 16/24 medium, body and callout = bodyLarge 16/24,
 *   subheadline = bodyMedium 14/20, footnote, caption1 and caption2 =
 *   bodySmall 12/16 (Material's 11sp labelSmall is raised to the 12sp floor).
 * button: iOS 17/22 semibold; Material 3 labelLarge 14/20 medium.
 *
 * Minimum size: 11pt on iOS (caption2), 12sp on Android. All text scales
 * with the system font size (Dynamic Type / Android font scale); line
 * heights scale with it.
 *
 * Titles inside the content are emphasised (bold on iOS), as iOS apps do
 * for in-page headings; Android keeps the Material weights.
 */
export type TextVariant =
  | 'largeTitle'
  | 'title1'
  | 'title2'
  | 'title3'
  | 'headline'
  | 'body'
  | 'callout'
  | 'subheadline'
  | 'footnote'
  | 'caption1'
  | 'caption2'
  | 'button';

type TypeStyle = Pick<
  TextStyle,
  'fontSize' | 'lineHeight' | 'fontWeight' | 'letterSpacing'
>;

const ios: Record<TextVariant, TypeStyle> = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700' },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  title3: { fontSize: 20, lineHeight: 25, fontWeight: '600' },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400' },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '400' },
  subheadline: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption1: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  caption2: { fontSize: 11, lineHeight: 13, fontWeight: '400' },
  button: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
};

const material: Record<TextVariant, TypeStyle> = {
  largeTitle: { fontSize: 32, lineHeight: 40, fontWeight: '400' },
  title1: { fontSize: 28, lineHeight: 36, fontWeight: '400' },
  title2: { fontSize: 24, lineHeight: 32, fontWeight: '400' },
  title3: { fontSize: 22, lineHeight: 28, fontWeight: '400' },
  headline: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    letterSpacing: 0.15,
  },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400', letterSpacing: 0.5 },
  callout: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  subheadline: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: 0.25,
  },
  footnote: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    letterSpacing: 0.4,
  },
  caption1: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    letterSpacing: 0.4,
  },
  caption2: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    letterSpacing: 0.4,
  },
  button: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
};

export const typography: Record<TextVariant, TypeStyle> =
  Platform.OS === 'ios' ? ios : material;

/** The smallest text size allowed on this platform (11pt iOS, 12sp Android). */
export const MIN_FONT_SIZE = Platform.OS === 'ios' ? 11 : 12;

/**
 * Cap for text inside controls whose size is fixed by the platform (tab
 * labels, header buttons, chart axes). Body text is never capped.
 */
export const CONTROL_MAX_FONT_SCALE = 1.6;

export const __typeScales = { ios, material };
