import type { NativeStackNavigationOptions } from 'expo-router';
import { Platform } from 'react-native';

import { colors } from './colors';

/**
 * Native header (UINavigationBar on iOS, Material 3 top app bar on Android)
 * shared by every stack: light background matching the screens, teal tint
 * for the back button and bar buttons, title start-aligned on Android.
 */
export const stackHeaderOptions: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: Platform.OS === 'ios' ? colors.primary.DEFAULT : '#1F2937',
  headerTitleStyle: { color: '#111827' },
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
};
