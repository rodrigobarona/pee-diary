import * as React from 'react';
import { Platform, Pressable, StyleSheet, Switch, View } from 'react-native';

import { Text } from './text';
import { hiddenA11y } from '@/lib/a11y';
import { haptics } from '@/lib/haptics';
import { colors } from '@/lib/theme/colors';
import { ripple, spacing } from '@/lib/theme/styles';

const IS_IOS = Platform.OS === 'ios';

// Switch colours, shared with the Settings rows.
// iOS: the system's own off track (UISwitch default) and a white thumb.
// Android (Material 3): a light off track whose outline-coloured thumb
// (colors.outline, 4.48:1 on white) shows the off state; teal when on.
const IOS_SWITCH_TRACK_OFF = '#E9E9EB';
const ANDROID_SWITCH_TRACK_OFF = '#DDE4E4';

export const switchColors = {
  trackColor: {
    false: IS_IOS ? IOS_SWITCH_TRACK_OFF : ANDROID_SWITCH_TRACK_OFF,
    true: colors.primary.DEFAULT,
  },
  iosBackgroundColor: IOS_SWITCH_TRACK_OFF,
  thumbColor: (value: boolean | undefined) =>
    IS_IOS || value ? colors.surface : colors.outline,
};

interface ToggleRowProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** Plays the platform's toggle feedback (on by default). */
  haptic?: boolean;
  testID?: string;
}

/**
 * Row with label and toggle switch. The whole row toggles it and is the one
 * accessible element (role switch, the label as its name, checked state).
 */
export function ToggleRow({
  label,
  description,
  value,
  onValueChange,
  haptic = true,
  testID,
}: ToggleRowProps) {
  const handlePress = React.useCallback(() => {
    if (haptic) {
      haptics.toggle(!value);
    }
    onValueChange(!value);
  }, [haptic, onValueChange, value]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.row,
        IS_IOS && pressed ? styles.rowPressedIOS : undefined,
      ]}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={description}
      accessibilityState={{ checked: value }}
      android_ripple={ripple}
      testID={testID}
    >
      <View style={styles.labelContainer}>
        <Text variant="body">{label}</Text>
        {description ? (
          <Text
            variant={IS_IOS ? 'footnote' : 'subheadline'}
            tone="secondary"
            style={styles.description}
          >
            {description}
          </Text>
        ) : null}
      </View>
      {/* Shows the state only; the row takes the touch, so a tap anywhere
          toggles once */}
      <View pointerEvents="none" {...hiddenA11y}>
        <Switch
          value={value}
          trackColor={switchColors.trackColor}
          thumbColor={switchColors.thumbColor(value)}
          ios_backgroundColor={switchColors.iosBackgroundColor}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: IS_IOS ? 44 : 56,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  rowPressedIOS: {
    backgroundColor: colors.highlight,
  },
  labelContainer: {
    flex: 1,
  },
  description: {
    marginTop: spacing.xxs,
  },
});
