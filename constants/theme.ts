/**
 * Eleva Care Color Theme
 * Using NativeWind for styling - this file provides fallback colors for native navigation
 */

import { colors } from '@/lib/theme/colors';

export const Colors = {
  light: {
    text: colors.text,
    background: colors.background,
    tint: colors.primary.DEFAULT,
    icon: colors.textMuted,
    tabIconDefault: colors.textMuted,
    tabIconSelected: colors.primary.DEFAULT,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: colors.primary.light,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: colors.primary.light,
  },
};
