import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * The app's haptics, with one meaning each and the platform's own feedback:
 * - selection(): a value changed in a picker, segmented control or scale
 *   (UISelectionFeedbackGenerator; Android "segment tick");
 * - toggle(on): a switch row changed (Android toggle on/off);
 * - success(): an entry was saved (UINotificationFeedbackGenerator success;
 *   Android "confirm");
 * - warning(): a destructive action was confirmed (warning; Android "reject").
 * Nothing plays for navigation, row taps, opening dialogs or tab changes.
 * On Android, performAndroidHapticsAsync uses View.performHapticFeedback,
 * which follows the system "Touch feedback" setting.
 */
function run(effect: () => Promise<void>) {
  effect().catch(() => {
    // Haptics are a nicety; a device without them is fine
  });
}

export const haptics = {
  selection() {
    if (Platform.OS === 'ios') run(() => Haptics.selectionAsync());
    else if (Platform.OS === 'android')
      run(() =>
        Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Segment_Tick)
      );
  },
  toggle(on: boolean) {
    if (Platform.OS === 'ios') run(() => Haptics.selectionAsync());
    else if (Platform.OS === 'android')
      run(() =>
        Haptics.performAndroidHapticsAsync(
          on ? Haptics.AndroidHaptics.Toggle_On : Haptics.AndroidHaptics.Toggle_Off
        )
      );
  },
  success() {
    if (Platform.OS === 'ios')
      run(() =>
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      );
    else if (Platform.OS === 'android')
      run(() =>
        Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm)
      );
  },
  warning() {
    if (Platform.OS === 'ios')
      run(() =>
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
      );
    else if (Platform.OS === 'android')
      run(() =>
        Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Reject)
      );
  },
};
