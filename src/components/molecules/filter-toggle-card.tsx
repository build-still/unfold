import * as React from 'react';

import { cn } from '@/lib/utils';

interface FilterToggleCardProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'title'> {
  title: string;
  subtitle: string;
  selected: boolean;
}

export function FilterToggleCard({ title, subtitle, selected, className, ...props }: FilterToggleCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        'relative rounded-xl border px-3.5 py-2.5 text-left transition-colors',
        selected
          ? 'border-modal-surface-border/65 bg-import-filter text-foreground'
          : 'border-modal-surface-border/55 bg-sidebar-container-bg/80 text-modal-surface-foreground/80 hover:border-modal-surface-border/70 hover:bg-sidebar-container-bg/60',
        className,
      )}
      {...props}
    >
      <span className="block font-sans-serif text-sm leading-tight">{title}</span>
      <span className="block pt-1 font-sans text-xs leading-tight text-modal-surface-foreground/58">{subtitle}</span>
      <span
        className={cn(
          'absolute top-2.5 right-2.5 inline-flex h-4.5 w-8 items-center overflow-hidden rounded-full p-0.5 transition-colors',
          selected
            ? 'bg-highlight-vivid ring-1 ring-inset ring-highlight-vivid/50 shadow-none'
            : 'bg-(--import-toggle-off-track) ring-1 ring-inset ring-(--import-toggle-off-ring)',
        )}
      >
        <span
          className={cn(
            'size-3 rounded-full transition-transform',
            selected
              ? 'translate-x-3.75 bg-(--import-toggle-knob-on)'
              : 'translate-x-px bg-(--import-toggle-knob-off)',
          )}
        />
      </span>
    </button>
  );
}
