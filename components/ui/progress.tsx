import * as React from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { cn } from '@/lib/theme';

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof View> {
  value?: number;
  max?: number;
  indicatorClassName?: string;
}

const Progress = React.forwardRef<React.ComponentRef<typeof View>, ProgressProps>(
  ({ className, value = 0, max = 100, indicatorClassName, ...props }, ref) => {
    const progress = useSharedValue(0);

    React.useEffect(() => {
      progress.value = withTiming(Math.min(Math.max(value, 0), max), {
        duration: 300,
      });
    }, [value, max, progress]);

    const animatedStyle = useAnimatedStyle(() => ({
      width: `${(progress.value / max) * 100}%`,
    }));

    return (
      <View
        ref={ref}
        className={cn(
          'relative h-3 w-full overflow-hidden rounded-full bg-secondary/20',
          className
        )}
        style={{ borderCurve: 'continuous' }}
        {...props}
      >
        <Animated.View
          className={cn('h-full bg-primary', indicatorClassName)}
          style={[{ borderCurve: 'continuous' }, animatedStyle]}
        />
      </View>
    );
  }
);
Progress.displayName = 'Progress';

export { Progress };
