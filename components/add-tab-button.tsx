import { useRouter } from 'expo-router';
import * as React from 'react';
import { StyleSheet } from 'react-native';

import { AnimatedPressable } from '@/components/ui/animated-pressable';
import { Icon } from '@/components/ui/icon';
import { useI18n } from '@/lib/i18n/context';
import { colors } from '@/lib/theme/colors';
import { iconSize } from '@/lib/theme/styles';

// Fits inside the 49pt iOS tab bar, between the two tabs (44pt target)
const ADD_TAB_BUTTON_SIZE = 44;

/**
 * iOS: the "+" in the middle of the tab bar that opens the Add Entry sheet.
 * It is an action, not a tab: it sits outside the tab list, so VoiceOver
 * reads "Add Entry, button" and the tabs as "1 of 2" and "2 of 2". It dims
 * while pressed, as UIKit buttons do; opening a sheet plays no haptic.
 */
export function AddTabButton() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <AnimatedPressable
      onPress={() => router.push('/add-menu')}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel={t('add.title')}
      accessibilityShowsLargeContentViewer
      accessibilityLargeContentTitle={t('add.title')}
      testID="add-entry-button"
    >
      <Icon name="plus" size={iconSize.xl} color={colors.onPrimary} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: ADD_TAB_BUTTON_SIZE,
    height: ADD_TAB_BUTTON_SIZE,
    borderRadius: ADD_TAB_BUTTON_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
