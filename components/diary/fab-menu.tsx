import * as React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import * as DropdownMenu from 'zeego/dropdown-menu';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { i18n } from '@/lib/i18n';

export function FABMenu() {
  const router = useRouter();
  const pressed = useSharedValue(0);

  const handleSelect = React.useCallback(
    (action: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      switch (action) {
        case 'urination':
          router.push('/add/urination');
          break;
        case 'fluid':
          router.push('/add/fluid');
          break;
        case 'leak':
          router.push('/add/leak');
          break;
      }
    },
    [router]
  );

  const triggerHaptic = React.useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // GestureDetector for animated press states - per animation-gesture-detector-press rule
  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      pressed.value = withSpring(1, { damping: 15, stiffness: 400 });
      runOnJS(triggerHaptic)();
    })
    .onFinalize(() => {
      pressed.value = withTiming(0, { duration: 200 });
    });

  // Derived animation values - only transform and opacity for GPU acceleration
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(pressed.value, [0, 1], [1, 0.92]) },
      { rotate: `${interpolate(pressed.value, [0, 1], [0, 45])}deg` },
    ],
    opacity: interpolate(pressed.value, [0, 1], [1, 0.9]),
  }));

  return (
    <View className="absolute bottom-6 right-6">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <GestureDetector gesture={tapGesture}>
            <Animated.View
              className="h-14 w-14 items-center justify-center rounded-full bg-primary"
              style={[
                animatedStyle,
                {
                  borderCurve: 'continuous',
                  boxShadow: '0 4px 12px rgba(0, 109, 119, 0.3)',
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Add new entry"
              accessibilityHint="Opens menu to add urination, fluid intake, or leak entry"
            >
              <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
            </Animated.View>
          </GestureDetector>
        </DropdownMenu.Trigger>

        <DropdownMenu.Content>
          <DropdownMenu.Item
            key="urination"
            onSelect={() => handleSelect('urination')}
          >
            <DropdownMenu.ItemIcon
              ios={{ name: 'drop.fill', pointSize: 18 }}
              androidIconName="water"
            />
            <DropdownMenu.ItemTitle>
              {i18n.t('entry.addUrination')}
            </DropdownMenu.ItemTitle>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            key="fluid"
            onSelect={() => handleSelect('fluid')}
          >
            <DropdownMenu.ItemIcon
              ios={{ name: 'cup.and.saucer.fill', pointSize: 18 }}
              androidIconName="local_cafe"
            />
            <DropdownMenu.ItemTitle>
              {i18n.t('entry.addFluid')}
            </DropdownMenu.ItemTitle>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            key="leak"
            onSelect={() => handleSelect('leak')}
          >
            <DropdownMenu.ItemIcon
              ios={{ name: 'exclamationmark.triangle.fill', pointSize: 18 }}
              androidIconName="warning"
            />
            <DropdownMenu.ItemTitle>
              {i18n.t('entry.addLeak')}
            </DropdownMenu.ItemTitle>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </View>
  );
}
