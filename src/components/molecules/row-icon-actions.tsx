import type React from 'react';

import { cn } from '@/lib/utils';

interface IconAction {
  icon: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  'aria-label'?: string;
}

interface RowIconActionsProps {
  actions: IconAction[];
  className?: string;
}

export function RowIconActions({ actions, className }: RowIconActionsProps) {
  return (
    <div
      className={cn(
        'pointer-events-none ml-auto flex shrink-0 items-center justify-end gap-1 opacity-0 transition-opacity duration-150 group-hover/space:pointer-events-auto group-hover/space:opacity-100',
        className,
      )}
    >
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            action.onClick(e);
          }}
          disabled={action.disabled}
          aria-label={action['aria-label']}
          className="rounded-md p-1 text-foreground-muted-secondary transition-colors duration-200 hover:bg-surface-elevated-border hover:text-foreground-muted-hover disabled:cursor-not-allowed disabled:opacity-30"
        >
          {action.icon}
        </button>
      ))}
    </div>
  );
}
