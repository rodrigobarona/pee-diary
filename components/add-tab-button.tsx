import * as React from 'react';
import { Pressable, StyleSheet, Platform } from 'react-native';
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

// Fits inside the 49pt iOS tab bar, between the two tabs
const ADD_TAB_BUTTON_SIZE = 44;

/**
 * iOS: the "+" in the middle of the tab bar that opens the Add Entry sheet.
 * It is an action, not a tab: it sits outside the tab list, so VoiceOver
 * reads "Add Entry, button" and the tabs as "1 of 2" and "2 of 2".
 */
export function AddTabButton() {
  const router = useRouter();
  const { t } = useI18n();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = React.useCallback(() => {
    scale.set(withTiming(0.92, { duration: 100 }));
  }, [scale]);

  const handlePressOut = React.useCallback(() => {
    scale.set(withTiming(1, { duration: 150 }));
  }, [scale]);

  const handlePress = React.useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/add-menu');
  }, [router]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.button, animatedStyle]}
      accessibilityRole="button"
      accessibilityLabel={t('add.title')}
      accessibilityShowsLargeContentViewer
      accessibilityLargeContentTitle={t('add.title')}
      testID="add-entry-button"
    >
      <MaterialCommunityIcons
        name="plus"
        size={28}
        color="#FFFFFF"
        accessible={false}
        importantForAccessibility="no"
      />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: ADD_TAB_BUTTON_SIZE,
    height: ADD_TAB_BUTTON_SIZE,
    borderRadius: ADD_TAB_BUTTON_SIZE / 2,
    backgroundColor: colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
