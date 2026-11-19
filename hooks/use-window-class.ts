import { useWindowDimensions } from "react-native";
import { useSafeAreaFrame } from "react-native-safe-area-context";

import { widthClassFor, type WidthClass } from "@/lib/layout/window-class";

export interface WindowClass {
  widthClass: WidthClass;
  /** The window's width and height (dp on Android, pt on iOS) */
  width: number;
  height: number;
  fontScale: number;
  /** compact: today's phone layout */
  isCompact: boolean;
}

/**
 * The window's size class, read on every render so it follows folding,
 * unfolding, rotation and split screen. Never cache it outside React.
 *
 * The width comes from the root safe-area frame when it is known: on some
 * Android 15 foldables `useWindowDimensions` keeps the folded size after
 * unfolding (react-native#52952), while the root view's frame is measured.
 */
export function useWindowClass(): WindowClass {
  const window = useWindowDimensions();
  const frame = useSafeAreaFrame();
  const width = frame.width > 0 ? frame.width : window.width;
  const height = frame.height > 0 ? frame.height : window.height;
  const widthClass = widthClassFor(width);
  return {
    widthClass,
    width,
    height,
    fontScale: window.fontScale,
    isCompact: widthClass === "compact",
  };
}
