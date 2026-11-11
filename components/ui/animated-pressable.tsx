import * as React from 'react';
import {
  Platform,
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ripple as defaultRipple } from '@/lib/theme/styles';

const ReanimatedPressable = Animated.createAnimatedComponent(Pressable);

const IS_IOS = Platform.OS === 'ios';

export type PressFeedback = 'opacity' | 'highlight' | 'none';

export interface AnimatedPressableProps
  extends Omit<PressableProps, 'style' | 'children'> {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  className?: string;
  /**
   * iOS press feedback, as UIKit does it:
   * - 'opacity' (default): the control dims while pressed and fades back,
   *   like a UIButton or a tappable card;
   * - 'highlight': the background turns `highlightColor` while pressed,
   *   like a table cell;
   * - 'none'.
   * Android always shows the Material ripple (`android_ripple`, teal state
   * layer by default; pass `android_ripple={null}` to turn it off).
   */
  feedback?: PressFeedback;
  highlightColor?: string;
}

/**
 * The app's pressable: a real Pressable, so it is one accessible element
 * that forwards every accessibility prop (role, label, hint, state, value,
 * actions), works with TalkBack, Switch Access, VoiceOver and keyboards, and
 * keeps testID and hitSlop.
 *
 * Feedback: Material ripple on Android; dimming (or cell highlight) on iOS,
 * animated on the UI thread.
 */
export const AnimatedPressable = React.forwardRef<View, AnimatedPressableProps>(
  function AnimatedPressable(
    {
      children,
      style,
      feedback = 'opacity',
      highlightColor,
      android_ripple,
      onPressIn,
      onPressOut,
      disabled,
      accessibilityState,
      ...rest
    },
    ref
  ) {
    const pressed = useSharedValue(0);
    const animateIOS = IS_IOS && feedback === 'opacity';

    const handlePressIn = React.useCallback(
      (event: GestureResponderEvent) => {
        if (animateIOS) {
          // Instant dim on touch down, as UIKit does
          pressed.set(withTiming(1, { duration: 50 }));
        }
        onPressIn?.(event);
      },
      [animateIOS, onPressIn, pressed]
    );

    const handlePressOut = React.useCallback(
      (event: GestureResponderEvent) => {
        if (animateIOS) {
          pressed.set(withTiming(0, { duration: 200 }));
        }
        onPressOut?.(event);
      },
      [animateIOS, onPressOut, pressed]
    );

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: interpolate(pressed.get(), [0, 1], [1, 0.55]),
    }));

    const [isHighlighted, setHighlighted] = React.useState(false);
    const highlight = IS_IOS && feedback === 'highlight';

    return (
      <ReanimatedPressable
        ref={ref}
        disabled={disabled}
        {...rest}
        accessibilityState={
          disabled ? { ...accessibilityState, disabled: true } : accessibilityState
        }
        android_ripple={android_ripple === undefined ? defaultRipple : android_ripple ?? undefined}
        onPressIn={(event) => {
          if (highlight) setHighlighted(true);
          handlePressIn(event);
        }}
        onPressOut={(event) => {
          if (highlight) setHighlighted(false);
          handlePressOut(event);
        }}
        style={[
          style,
          animateIOS ? animatedStyle : undefined,
          highlight && isHighlighted && highlightColor
            ? { backgroundColor: highlightColor }
            : undefined,
        ]}
      >
        {children}
      </ReanimatedPressable>
    );
  }
);
