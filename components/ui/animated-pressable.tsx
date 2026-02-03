import * as React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

interface AnimatedPressableProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

/**
 * AnimatedPressable with GestureDetector for smooth press animations
 * Following: animation-gesture-detector-press rule
 * - Uses GestureDetector with Gesture.Tap() for animated press states
 * - Animates only transform and opacity (GPU-accelerated)
 * - Uses interpolate for derived animation values
 */
export function AnimatedPressable({
  children,
  onPress,
  disabled,
  haptic = true,
  style,
  className,
}: AnimatedPressableProps) {
  // Ground truth state: 0 = not pressed, 1 = pressed
  const pressed = useSharedValue(0);

  const handlePress = React.useCallback(() => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  }, [haptic, onPress]);

  const tapGesture = Gesture.Tap()
    .enabled(!disabled)
    .onBegin(() => {
      pressed.value = withTiming(1, { duration: 100 });
    })
    .onFinalize(() => {
      pressed.value = withTiming(0, { duration: 200 });
    })
    .onEnd(() => {
      runOnJS(handlePress)();
    });

  // Derived animation values - per animation-derived-value rule
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(pressed.value, [0, 1], [1, 0.97]),
      },
    ],
    opacity: interpolate(pressed.value, [0, 1], [1, 0.8]),
  }));

  return (
    <GestureDetector gesture={tapGesture}>
      <Animated.View
        style={[animatedStyle, style]}
        className={className}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
