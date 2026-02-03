import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { cn } from '@/lib/theme';
import { TextClassContext } from './text';

const buttonVariants = cva(
  'group flex items-center justify-center rounded-lg web:ring-offset-background web:transition-colors web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary web:hover:opacity-90 active:opacity-90',
        destructive: 'bg-destructive web:hover:opacity-90 active:opacity-90',
        outline:
          'border border-input bg-background web:hover:bg-accent web:hover:text-accent-foreground active:bg-accent',
        secondary: 'bg-secondary web:hover:opacity-80 active:opacity-80',
        ghost: 'web:hover:bg-accent web:hover:text-accent-foreground active:bg-accent',
        link: 'web:underline-offset-4 web:hover:underline web:focus:underline',
      },
      size: {
        default: 'h-12 px-5 py-3 native:h-14 native:px-6 native:py-4',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-14 rounded-lg px-8 native:h-16',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const buttonTextVariants = cva(
  'web:whitespace-nowrap text-base native:text-lg font-semibold text-foreground web:transition-colors',
  {
    variants: {
      variant: {
        default: 'text-white',
        destructive: 'text-white',
        outline: 'group-active:text-accent-foreground',
        secondary: 'text-white',
        ghost: 'group-active:text-accent-foreground',
        link: 'text-primary group-active:underline',
      },
      size: {
        default: '',
        sm: 'text-sm',
        lg: 'text-lg native:text-xl',
        icon: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

type ButtonProps = React.ComponentPropsWithoutRef<typeof Pressable> &
  VariantProps<typeof buttonVariants> & {
    haptics?: boolean;
  };

const Button = React.forwardRef<React.ComponentRef<typeof Pressable>, ButtonProps>(
  ({ className, variant, size, haptics = true, onPress, ...props }, ref) => {
    const handlePress = React.useCallback(
      (e: any) => {
        if (haptics) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress?.(e);
      },
      [haptics, onPress]
    );

    return (
      <TextClassContext.Provider
        value={buttonTextVariants({ variant, size })}
      >
        <Pressable
          className={cn(
            props.disabled && 'opacity-50 web:pointer-events-none',
            buttonVariants({ variant, size, className })
          )}
          ref={ref}
          role="button"
          onPress={handlePress}
          {...props}
        />
      </TextClassContext.Provider>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
