import * as React from 'react';

import { PanelCard } from '@/components/atoms/panel-card';
import { cn } from '@/lib/utils';

interface PanelSectionProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}

export function PanelSection({
  title,
  description,
  actions,
  className,
  bodyClassName,
  children,
}: PanelSectionProps) {
  return (
    <PanelCard className={className}>
      <div className="flex items-start justify-between gap-3 border-b border-modal-surface-border/45 bg-sidebar-item-hover-bg/35 px-3.5 py-2.5">
        <div className="space-y-0.5">
          <h4 className="font-sans-serif text-sm font-medium text-modal-surface-foreground/92">{title}</h4>
          {description ? (
            <p className="font-sans text-xs text-modal-surface-foreground/70">{description}</p>
          ) : null}
        </div>
        {actions}
      </div>
      <div className={cn('px-3.5 py-3', bodyClassName)}>{children}</div>
    </PanelCard>
  );
}
