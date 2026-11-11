import * as React from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { colors } from '@/lib/theme/colors';
import { MIN_TOUCH_TARGET, radius, spacing } from '@/lib/theme/styles';
import { typography } from '@/lib/theme/typography';

export interface InputProps
  extends React.ComponentPropsWithoutRef<typeof TextInput> {
  error?: boolean;
  /**
   * 'outlined' (default): a bordered field on its own.
   * 'plain': no border or background, for a field inside a FormCard.
   */
  appearance?: 'outlined' | 'plain';
}

/**
 * Text field in the body text style. Text scales with the system font size;
 * the field grows with it (minHeight, not height). Name it with
 * accessibilityLabel: the placeholder is not a label.
 */
const Input = React.forwardRef<React.ComponentRef<typeof TextInput>, InputProps>(
  ({ error, appearance = 'outlined', style, editable, ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        editable={editable}
        placeholderTextColor={colors.textPlaceholder}
        selectionColor={colors.primary.DEFAULT}
        cursorColor={colors.primary.DEFAULT}
        style={[
          styles.input,
          appearance === 'outlined' ? styles.outlined : undefined,
          error ? styles.error : undefined,
          editable === false ? styles.disabled : undefined,
          style,
        ]}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

const styles = StyleSheet.create({
  input: {
    // No lineHeight: a TextInput with one offsets its text on iOS
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    letterSpacing: typography.body.letterSpacing,
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
  },
  outlined: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderCurve: 'continuous',
  },
  error: {
    borderWidth: 2,
    borderColor: colors.destructive,
  },
  disabled: {
    opacity: 0.5,
  },
});

export { Input };
