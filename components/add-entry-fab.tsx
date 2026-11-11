import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';

import { useI18n } from '@/lib/i18n/context';
import { colors } from '@/lib/theme/colors';

// Material 3 FAB: 56dp, 16dp corners, 16dp from the edges
const FAB_SIZE = 56;
const FAB_MARGIN = 16;

// Space to leave under the last item of a list so the FAB does not cover it
export const ADD_ENTRY_FAB_CLEARANCE = FAB_SIZE + FAB_MARGIN * 2;

/**
 * Android: the floating action button that opens the Add Entry sheet, at the
 * bottom end of the Today and History screens, above the navigation bar. On
 * iOS the "+" in the tab bar does this, so this renders nothing there.
 */
export function AddEntryFab() {
  const router = useRouter();
  const { t } = useI18n();

  if (Platform.OS !== 'android') {
    return null;
  }

  return (
    <Pressable
      onPress={() => router.push('/add-menu')}
      style={styles.fab}
      android_ripple={{ color: 'rgba(255, 255, 255, 0.24)' }}
      accessibilityRole="button"
      accessibilityLabel={t('add.title')}
      testID="add-entry-button"
    >
      <MaterialCommunityIcons
        name="plus"
        size={24}
        color="#FFFFFF"
        accessible={false}
        importantForAccessibility="no"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    end: FAB_MARGIN,
    bottom: FAB_MARGIN,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    // Material 3 elevation level 3
    elevation: 6,
  },
});
