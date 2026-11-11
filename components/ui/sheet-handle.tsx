import * as React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

/**
 * Material 3 bottom sheet drag handle (32x4dp, 22dp above it), drawn at the
 * top of the Android sheets. iOS shows the system grabber instead
 * (sheetGrabberVisible), so this renders nothing there.
 */
export function SheetHandle() {
  if (Platform.OS !== 'android') {
    return null;
  }

  return (
    <View
      style={styles.container}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.handle} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 22,
    paddingBottom: 16,
  },
  handle: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(73, 69, 79, 0.4)',
  },
});
