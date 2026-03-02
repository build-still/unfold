import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Ripple } from '@/components/ui/ripple';
import { cn } from '@/lib/utils';

interface PrimaryActionButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: React.ReactNode;
  rippleDuration?: number;
  rippleColor?: string;
}

export function PrimaryActionButton({
  children,
  className,
  rippleDuration = 1200,
  rippleColor = 'color-mix(in srgb, var(--sidebar-item-hover-bg) 82%, transparent)',
  ...props
}: PrimaryActionButtonProps) {
  return (
    <Button
      variant="outline"
      size="lg"
      className={cn(
        'relative w-fit cursor-pointer justify-start gap-2 overflow-hidden px-3 py-2 text-sm font-semibold',
        'border-2 border-sidebar-border/70 bg-sidebar-item-hover-bg/60 text-sidebar-foreground hover:bg-sidebar-item-hover-bg/80',
        'transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <span className="relative z-10 inline-flex items-center gap-2 font-sans-serif">
        {children}
      </span>
      <Ripple duration={rippleDuration} color={rippleColor} />
    </Button>
  );
}
