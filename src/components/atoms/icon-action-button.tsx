import * as React from 'react';

import { AnimatedIcon } from '@/components/ui/animated-icon';
import { cn } from '@/lib/utils';

interface IconActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  iconClassName?: string;
}

export const IconActionButton = React.forwardRef<HTMLButtonElement, IconActionButtonProps>(
  function IconActionButton({ className, iconClassName, children, ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'sidebar-icon-button inline-flex size-5 items-center justify-center rounded-md',
          'transition-colors duration-150 hover:bg-sidebar-icon-hover-bg/75',
          className,
        )}
        {...props}
      >
        <AnimatedIcon className={cn('flex h-full w-full items-center justify-center', iconClassName)}>
          {children}
        </AnimatedIcon>
      </button>
    );
  },
);
