import * as React from 'react';

import { cn } from '@/lib/utils';

interface PanelCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const PanelCard = React.forwardRef<HTMLDivElement, PanelCardProps>(
  function PanelCard({ className, children, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'overflow-hidden rounded-xl border border-modal-surface-border/55 bg-sidebar-container-bg',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
