import * as React from 'react';

import { SIDEBAR_TRANSITION_EASE_CLASS } from '@/components/sidebar/sidebar-motion';
import { cn } from '@/lib/utils';

interface RowActionsRevealProps {
  group: 'pinned-item' | 'item-row' | 'sub-item-row';
  className?: string;
  children: React.ReactNode;
}

const GROUP_BASE_CLASS: Record<RowActionsRevealProps['group'], string> = {
  'pinned-item':  'group-hover/pinned-item:opacity-100 group-hover/pinned-item:pointer-events-auto group-hover/pinned-item:translate-x-0',
  'item-row':     'group-hover/item-row:opacity-100 group-hover/item-row:pointer-events-auto group-hover/item-row:translate-x-0',
  'sub-item-row': 'group-hover/sub-item-row:opacity-100 group-hover/sub-item-row:pointer-events-auto group-hover/sub-item-row:translate-x-0',
};

const GROUP_MAX_W_CLASS: Record<RowActionsRevealProps['group'], string> = {
  'pinned-item':  'group-hover/pinned-item:max-w-28',
  'item-row':     'group-hover/item-row:max-w-22',
  'sub-item-row': 'group-hover/sub-item-row:max-w-22',
};

export function RowActionsReveal({ group, className, children }: RowActionsRevealProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 pl-2 overflow-hidden transition-[max-width,opacity,transform] duration-220',
        SIDEBAR_TRANSITION_EASE_CLASS,
        'opacity-0 max-w-0 pointer-events-none translate-x-1',
        GROUP_BASE_CLASS[group],
        GROUP_MAX_W_CLASS[group],
        className,
      )}
      role="none"
    >
      {children}
    </div>
  );
}
