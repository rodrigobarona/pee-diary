import { StyleSheet } from 'react-native';
import { colors } from './colors';

/**
 * Shared style constants following React Native best practices (Rule 9.2):
 * - boxShadow (modern shadow syntax)
 * - borderCurve: 'continuous' (smoother iOS corners)
 * - gap (instead of child margins)
 */

export const formStyles = StyleSheet.create({
  // Card container for forms
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderCurve: 'continuous',
    padding: 16,
    gap: 12,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },

  // Alternative card without padding (for option rows)
  cardNoPadding: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderCurve: 'continuous',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },

  // Row for options/settings
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  // Section title (uppercase label)
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },

  // Screen title
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },

  // Screen subtitle
  screenSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },

  // Separator line
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 70,
  },

  // Full-width separator
  separatorFull: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
});

export const buttonStyles = StyleSheet.create({
  // Primary button
  primary: {
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: 14,
    borderCurve: 'continuous',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  primaryText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Secondary button
  secondary: {
    backgroundColor: colors.secondary.DEFAULT,
    borderRadius: 14,
    borderCurve: 'continuous',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  secondaryText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Disabled state
  disabled: {
    opacity: 0.5,
  },

  // Destructive button
  destructive: {
    backgroundColor: '#EF4444',
    borderRadius: 14,
    borderCurve: 'continuous',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  destructiveText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export const iconStyles = StyleSheet.create({
  // Icon container (small)
  containerSmall: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Icon container (medium)
  containerMedium: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Icon container (large)
  containerLarge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
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
} as const;

// Common border radius values
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;
