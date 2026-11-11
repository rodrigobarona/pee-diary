import * as Slot from '@rn-primitives/slot';
import type { SlottableTextProps, TextRef } from '@rn-primitives/types';
import * as React from 'react';
import { Text as RNText } from 'react-native';

import { cn } from '@/lib/theme';
import { colors } from '@/lib/theme/colors';
import { typography, type TextVariant } from '@/lib/theme/typography';

const TextClassContext = React.createContext<string | undefined>(undefined);

/**
 * Text colours. Every tone meets WCAG AA on white, #F9FAFB and #F3F4F6
 * (see lib/theme/colors.ts).
 */
export const textTones = {
  primary: colors.text,
  secondary: colors.textSecondary,
  tertiary: colors.textTertiary,
  accent: colors.primary.DEFAULT,
  onAccent: colors.onPrimary,
  destructive: colors.destructive,
} as const;

export type TextTone = keyof typeof textTones;

export type TextProps = SlottableTextProps & {
  /** A style from the shared type scale (lib/theme/typography.ts). */
  variant?: TextVariant;
  /** A colour token; defaults to primary when a variant is given. */
  tone?: TextTone;
};

const Text = React.forwardRef<TextRef, TextProps>(
  ({ className, asChild = false, variant, tone, style, ...props }, ref) => {
    const textClass = React.useContext(TextClassContext);
    const Component = asChild ? Slot.Text : RNText;

    if (variant || tone) {
      // Inside a Button the text classes set the colour, unless a tone is
      // given explicitly
      const color =
        tone !== undefined
          ? textTones[tone]
          : textClass
            ? undefined
            : textTones.primary;
      return (
        <Component
          className={cn('web:select-text', textClass, className)}
          ref={ref}
          style={[
            variant ? typography[variant] : undefined,
            color ? { color } : undefined,
            style,
          ]}
          {...props}
        />
      );
    }

    return (
      <Component
        className={cn(
          'text-base text-foreground web:select-text',
          textClass,
          className
        )}
        ref={ref}
        style={style}
        {...props}
      />
    );
  }
);
Text.displayName = 'Text';

export { Text, TextClassContext };
