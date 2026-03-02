import type { ReactNode } from 'react';

import { cn } from '@/lib/tiptap-utils';

type SmallTextLabelCasing = 'lower' | 'upper' | 'none';

interface SmallTextLabelProps {
  children: ReactNode;
  casing?: SmallTextLabelCasing;
  containerClassName?: string;
  className?: string;
}

const casingClasses: Record<SmallTextLabelCasing, string> = {
  lower: 'lowercase',
  upper: 'uppercase',
  none: '',
};

export function SmallTextLabel({
  children,
  casing = 'lower',
  containerClassName,
  className,
}: SmallTextLabelProps) {
  return (
    <div className={cn('flex items-center gap-1.5 px-2 py-1 mb-0.5', containerClassName)}>
      <span
        className={cn(
          'text-xs text-sidebar-foreground/50 font-medium tracking-wide font-sans-serif',
          casingClasses[casing],
          className,
        )}
      >
        {children}
      </span>
    </div>
  );
}
