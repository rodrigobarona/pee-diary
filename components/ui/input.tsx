import * as React from 'react';
import { TextInput } from 'react-native';
import { cn } from '@/lib/theme';

export interface InputProps
  extends React.ComponentPropsWithoutRef<typeof TextInput> {
  error?: boolean;
}

const Input = React.forwardRef<React.ComponentRef<typeof TextInput>, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        className={cn(
          'web:flex h-12 native:h-14 w-full rounded-lg border border-input bg-background px-4 web:py-2 text-base lg:text-sm native:text-lg native:leading-[1.25] text-foreground placeholder:text-muted-foreground web:ring-offset-background file:border-0 file:bg-transparent file:font-medium web:focus-visible:outline-hidden web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2',
          error && 'border-destructive',
          props.editable === false && 'opacity-50 web:cursor-not-allowed',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
