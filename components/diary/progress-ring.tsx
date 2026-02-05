import * as React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Text } from '@/components/ui/text';
import { colors } from '@/lib/theme/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  progress: number; // 0-1
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor?: string;
  value: number;
  target: number;
  unit?: string;
  label?: string;
  onPress?: () => void;
}

export function ProgressRing({
  progress,
  size = 160,
  strokeWidth = 12,
  color = colors.primary.DEFAULT,
  backgroundColor = '#E5E7EB',
  icon,
  iconColor,
  value,
  target,
  unit = '',
  label,
  onPress,
}: ProgressRingProps) {
  // Calculate circle dimensions
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Clamp progress between 0 and 1
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  
  // Animated progress value
  const animatedProgress = useSharedValue(0);
  
  // Animate when progress changes
  React.useEffect(() => {
    animatedProgress.value = withTiming(clampedProgress, {
      duration: 800,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [clampedProgress, animatedProgress]);
  
  // Animated props for the progress circle
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  const content = (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      
      {/* Center content */}
      <View style={styles.centerContent}>
        {icon ? <MaterialCommunityIcons
            name={icon}
            size={size * 0.18}
            color={iconColor ?? color}
            style={styles.icon}
          /> : null}
        <View style={styles.valueContainer}>
          <Text style={[styles.value, { fontSize: size * 0.17 }]}>
            {value}
            {unit ? <Text style={[styles.unit, { fontSize: size * 0.09 }]}>{unit}</Text> : null}
          </Text>
          <Text style={[styles.target, { fontSize: size * 0.08 }]}>
            / {target}{unit}
          </Text>
        </View>
        {label ? <Text style={[styles.label, { fontSize: size * 0.075 }]} numberOfLines={1}>
            {label}
          </Text> : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={styles.pressable}>
        {content}
      </Pressable>
    );
  }

  return content;
}

// Smaller version for secondary metrics
interface SmallProgressRingProps {
  progress: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  value: number;
  target: number;
  label: string;
  color?: string;
  onPress?: () => void;
}

export function SmallProgressRing({
  progress,
  icon,
  value,
  target,
  label,
  color = colors.primary.DEFAULT,
  onPress,
}: SmallProgressRingProps) {
  const size = 80;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  
  const animatedProgress = useSharedValue(0);
  
  React.useEffect(() => {
    animatedProgress.value = withTiming(clampedProgress, {
      duration: 800,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [clampedProgress, animatedProgress]);
  
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  const content = (
    <View style={styles.smallContainer}>
      <View style={[styles.smallRingContainer, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={styles.smallCenterContent}>
          <MaterialCommunityIcons name={icon} size={20} color={color} />
          <Text style={styles.smallValue}>{value}/{target}</Text>
        </View>
      </View>
      <Text style={styles.smallLabel} numberOfLines={1}>{label}</Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressable: {
    alignItems: 'center',
  },
  svg: {
    position: 'absolute',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginBottom: 4,
  },
  valueContainer: {
    alignItems: 'center',
  },
  value: {
    fontWeight: '700',
    color: '#111827',
  },
  unit: {
    fontWeight: '500',
    color: '#6B7280',
  },
  target: {
    color: '#9CA3AF',
    marginTop: -2,
  },
  label: {
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  // Small ring styles
  smallContainer: {
    alignItems: 'center',
    gap: 8,
  },
  smallRingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallCenterContent: {
    position: 'absolute',
    alignItems: 'center',
    gap: 2,
  },
  smallValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  smallLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
});
