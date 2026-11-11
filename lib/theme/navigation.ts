import { DefaultTheme, type NativeStackNavigationOptions } from 'expo-router';
import { Platform } from 'react-native';

import { colors } from './colors';

/**
 * The navigation theme: light only for this release, with the brand teal as
 * the tint (instead of react-navigation's default system blue) and the app's
 * own background, surface, text and border tokens.
 */
export const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary.DEFAULT,
    background: colors.background,
    card: colors.background,
    text: colors.text,
    border: colors.border,
  },
};

/**
 * Native header (UINavigationBar on iOS, Material 3 top app bar on Android)
 * shared by every stack: light background matching the screens, teal tint
 * for the back button and bar buttons on iOS, on-surface icons on Android,
 * title start-aligned on Android. The title uses the system's own type
 * style (17pt semibold / Material title large).
 */
export const stackHeaderOptions: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: Platform.OS === 'ios' ? colors.primary.DEFAULT : colors.text,
  headerTitleStyle: { color: colors.text },
  headerTitleAlign: Platform.OS === 'android' ? 'left' : 'center',
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.background },
};

/**
 * Today and History: a large title on iOS where the screen scrolls under it,
 * a small Material 3 top app bar on Android.
 */
export const tabStackHeaderOptions: NativeStackNavigationOptions = {
  ...stackHeaderOptions,
  headerLargeStyle: { backgroundColor: colors.background },
  headerLargeTitleShadowVisible: false,
  headerLargeTitleStyle: { color: colors.text },
};
