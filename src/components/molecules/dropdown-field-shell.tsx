import * as React from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropdownFieldShellProps {
  label: string;
  displayValue: React.ReactNode;
  error?: string | null;
  helperText?: string;
  triggerClassName?: string;
  contentClassName?: string;
  children: React.ReactNode;
}

export function DropdownFieldShell({
  label,
  displayValue,
  error,
  helperText,
  triggerClassName,
  contentClassName,
  children,
}: DropdownFieldShellProps) {
  return (
    <div className="space-y-1.5">
      <span className="pl-2.5 text-[10px] font-medium text-modal-surface-foreground/65">{label}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div
            role="button"
            tabIndex={0}
            className={cn(
              'flex h-8 w-full cursor-pointer items-center justify-between rounded-none border-b border-modal-surface-border/75',
              'bg-sidebar-container-bg/90 px-2.5 text-xs text-modal-surface-foreground/85',
              'transition-colors hover:bg-sidebar-item-hover-bg/25',
              'focus-visible:outline-none',
              error && 'border-destructive/50',
              triggerClassName,
            )}
          >
            <span className="truncate">{displayValue}</span>
            <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="bottom"
          sideOffset={6}
          avoidCollisions={false}
          align="start"
          className={cn(
            'w-34 max-h-40 overflow-y-auto gap-.5 rounded-xl border border-sidebar-container-border/80 bg-sidebar-container-bg shadow-dropdown dropdown-darker-scroll',
            contentClassName,
          )}
        >
          {children}
        </DropdownMenuContent>
      </DropdownMenu>
      {helperText && !error && (
        <p className="text-[10px] text-modal-surface-foreground/60">{helperText}</p>
      )}
      {error && <p className="text-[10px] text-destructive">{error}</p>}
    </div>
  );
}
