import * as React from 'react';

import { Plus } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

import { ExpandChevronIcon } from '@/components/atoms/expand-chevron-icon';
import { RowActionsReveal } from '@/components/atoms/row-actions-reveal';
import { SelectableRow } from '@/components/atoms/selectable-row';
import { SidebarActionButton } from '@/components/common/sidebar/sidebar-action-button';
import { AppTooltipContent, Tooltip, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SIDEBAR_MINDFUL_OPEN_DURATION,
  SIDEBAR_OPEN_EASE,
} from '@/components/sidebar/sidebar-motion';
import { cn } from '@/lib/utils';

interface SidebarNodeRowProps {
  name: string;
  selected: boolean;
  isRecentlyCreated?: boolean;
  isLoading?: boolean;
  rowType: 'pinned-item' | 'item-row' | 'sub-item-row';
  addFileShortcut: string;
  isOpen: boolean;
  showToggle: boolean;
  onSelect: () => void;
  onKeyboardSelect?: (event: React.KeyboardEvent<HTMLElement>) => void;
  onAddChild: (event: React.MouseEvent) => void;
  onToggleNode: (event: React.MouseEvent) => void;
  className?: string;
  selectedClassName?: string;
  unselectedClassName?: string;
}

export const SidebarNodeRow = React.forwardRef<HTMLElement, SidebarNodeRowProps & React.HTMLAttributes<HTMLElement>>(function SidebarNodeRow({
  name,
  selected,
  isRecentlyCreated = false,
  isLoading = false,
  rowType,
  addFileShortcut,
  isOpen,
  showToggle,
  onSelect,
  onKeyboardSelect,
  onAddChild,
  onToggleNode,
  className,
  selectedClassName,
  unselectedClassName,
  ...props
}, ref) {
  const prefersReducedMotion = useReducedMotion();

  if (isLoading) {
    return (
      <div className={cn(`group/${rowType} px-2 py-1 font-sans space-y-1`, className)}>
        <Skeleton className="h-5 w-3/4 rounded-md" />
      </div>
    );
  }

  return (
    <motion.div
      initial={
        isRecentlyCreated && !prefersReducedMotion
          ? { opacity: 0, y: 8, scale: 0.985 }
          : false
      }
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: 'tween',
        duration: prefersReducedMotion ? 0 : SIDEBAR_MINDFUL_OPEN_DURATION,
        ease: SIDEBAR_OPEN_EASE,
      }}
    >
      <SelectableRow
        ref={ref}
        as="div"
        selected={selected}
        role="button"
        tabIndex={0}
        className={cn(`group/${rowType} px-2 py-1 font-sans`, className)}
        selectedClassName={selectedClassName}
        unselectedClassName={unselectedClassName}
        onClick={onSelect}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect();
          }
          onKeyboardSelect?.(event);
        }}
        {...props}
      >
        <div className="min-w-0 flex-1">
          <span className="block truncate font-sans">{name}</span>
        </div>

        <RowActionsReveal group={rowType}>
          <Tooltip delayDuration={120}>
            <TooltipTrigger asChild>
              <SidebarActionButton
                onClick={(event) => {
                  event.stopPropagation();
                  onAddChild(event);
                }}
                ariaLabel="Add child note"
              >
                <Plus size={14} strokeWidth={3} />
              </SidebarActionButton>
            </TooltipTrigger>
            <AppTooltipContent label="Add a new file" shortcut={addFileShortcut} />
          </Tooltip>

          {showToggle ? (
            <SidebarActionButton
              onClick={(event) => {
                event.stopPropagation();
                onToggleNode(event);
              }}
              ariaLabel={isOpen ? 'Collapse note' : 'Expand note'}
            >
              <ExpandChevronIcon isOpen={isOpen} />
            </SidebarActionButton>
          ) : null}
        </RowActionsReveal>
      </SelectableRow>
    </motion.div>
  );
});
