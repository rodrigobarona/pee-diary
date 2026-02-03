import * as React from 'react';
import { cn } from '@/lib/theme';
import { Text } from './text';

const Label = React.forwardRef<
  React.ComponentRef<typeof Text>,
  React.ComponentPropsWithoutRef<typeof Text> & {
    required?: boolean;
  }
>(({ className, required, children, ...props }, ref) => (
  <Text
    ref={ref}
    className={cn(
      'text-sm font-medium leading-none text-foreground native:text-base peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      className
    )}
    {...props}
  >
    {children}
    {required ? <Text className="text-destructive"> *</Text> : null}
  </Text>
));
Label.displayName = 'Label';

export { Label };
