import { useBottomTabBarHeight } from 'expo-router/tabs';
import { Platform } from 'react-native';

import { ADD_ENTRY_FAB_CLEARANCE } from '@/components/add-entry-fab';
import { useWindowClass } from '@/hooks/use-window-class';

/**
 * Bottom padding for the scrolling content of the Today and History tabs, so
 * the last item can scroll clear of what floats over it: the translucent tab
 * bar on iOS, the Add Entry button (FAB) on Android.
 */
export function useTabScreenBottomSpace(): number {
  const tabBarHeight = useBottomTabBarHeight();
  const { isCompact } = useWindowClass();

  // Wide windows: the rail is beside the content, nothing floats over it
  if (!isCompact) {
    return 24;
  }

  if (Platform.OS === 'ios') {
    return tabBarHeight + 24;
  }
  if (Platform.OS === 'android') {
    return ADD_ENTRY_FAB_CLEARANCE + 16;
  }
  return 24;
}
