import * as React from 'react';

import { Ripple } from '@/components/ui/ripple';
import { cn } from '@/lib/utils';

interface ChoiceRowProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'title'> {
  title: string;
  subtitle?: string;
  selected?: boolean;
  showDivider?: boolean;
  hideIndicator?: boolean;
}

export function ChoiceRow({
  title,
  subtitle,
  selected = false,
  disabled,
  showDivider = false,
  hideIndicator = false,
  className,
  ...props
}: ChoiceRowProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      className={cn(
        'group relative flex w-full items-start justify-between gap-3 overflow-hidden text-left',
        'px-3.5 py-2.5 transition-colors duration-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-ring',
        selected
          ? 'bg-sidebar-item-hover-bg/55 text-modal-surface-foreground'
          : 'bg-transparent text-modal-surface-foreground/80 hover:bg-sidebar-item-hover-bg/30',
        disabled && 'cursor-not-allowed opacity-45',
        className,
      )}
      {...props}
    >
      <div className="relative z-10 min-w-0 space-y-0.5">
        <p className="font-sans-serif text-sm font-medium leading-tight">{title}</p>
        {subtitle ? (
          <p className="font-sans text-xs leading-snug text-modal-surface-foreground/58">{subtitle}</p>
        ) : null}
      </div>
      {!hideIndicator ? (
        <span
          className={cn(
            'relative z-10 mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border',
            selected
              ? 'border-2 border-sidebar-border/70 bg-sidebar-item-hover-bg/60 text-modal-surface-foreground/85'
              : 'border-modal-surface-border/55 text-transparent',
          )}
        >
          {selected ? <span className="size-2 rounded-full bg-modal-surface-foreground/68" /> : null}
        </span>
      ) : null}
      <Ripple duration={1200} color="color-mix(in srgb, var(--sidebar-item-hover-bg) 85%, transparent)" />
      {showDivider ? (
        <span className="pointer-events-none absolute right-3 bottom-0 left-3 h-px bg-modal-surface-border/45" />
      ) : null}
    </button>
  );
}
