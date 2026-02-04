import * as React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { colors } from '@/lib/theme/colors';
import { useI18n } from '@/lib/i18n/context';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AddTabButtonProps {
  accessibilityState?: { selected?: boolean };
}

export function AddTabButton({ accessibilityState: _accessibilityState }: AddTabButtonProps) {
  const router = useRouter();
  const { t } = useI18n();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleMainPressIn = React.useCallback(() => {
    scale.value = withTiming(0.92, { duration: 100 });
  }, [scale]);

  const handleMainPressOut = React.useCallback(() => {
    scale.value = withTiming(1, { duration: 150 });
  }, [scale]);

  const handlePress = React.useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/add-menu');
  }, [router]);

  return (
    <View style={styles.container}>
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handleMainPressIn}
        onPressOut={handleMainPressOut}
        style={[styles.button, animatedStyle]}
        accessibilityRole="button"
        accessibilityLabel={t('add.title')}
      >
        <MaterialCommunityIcons name="plus" size={32} color="#FFFFFF" />
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    borderWidth: 4,
    borderColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
});
