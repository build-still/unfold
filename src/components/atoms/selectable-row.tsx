import * as React from 'react';

import { SIDEBAR_TRANSITION_EASE_CLASS } from '@/components/sidebar/sidebar-motion';
import { cn } from '@/lib/utils';

const mergeRefs = <T,>(...refs: Array<React.Ref<T> | undefined>) => (value: T | null) => {
  refs.forEach((ref) => {
    if (!ref) return;
    if (typeof ref === 'function') {
      ref(value);
      return;
    }
    (ref as React.MutableRefObject<T | null>).current = value;
  });
};

interface SelectableRowProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'button' | 'div';
  elementRef?: React.Ref<HTMLElement>;
  selected?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  selectedClassName?: string;
  unselectedClassName?: string;
}

export const SelectableRow = React.forwardRef<HTMLElement, SelectableRowProps>(function SelectableRow({
  as = 'button',
  elementRef,
  selected = false,
  leading,
  trailing,
  selectedClassName,
  unselectedClassName,
  className,
  children,
  ...props
}, forwardedRef) {
  const combinedRef = mergeRefs<HTMLElement>(elementRef, forwardedRef);

  if (as === 'div') {
    return (
      <div
        ref={combinedRef as React.Ref<HTMLDivElement>}
        aria-pressed={selected}
        className={cn(
          'group flex w-full min-w-0 items-center gap-2 rounded-xl border px-2.5 py-1.5',
          'text-left text-sm font-medium transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-220',
          SIDEBAR_TRANSITION_EASE_CLASS,
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-ring',
          'pointer-events-auto cursor-pointer',
          selected
            ? (selectedClassName ?? 'bg-sidebar-subitem-selected-bg border-border-elevated text-foreground')
            : (unselectedClassName ?? 'border-transparent text-sidebar-foreground/90 hover:bg-sidebar-item-hover-bg/80 hover:text-foreground'),
          className,
        )}
        {...props}
      >
        {leading ? <span className="shrink-0">{leading}</span> : null}
        {children}
        {trailing ? <span className="shrink-0">{trailing}</span> : null}
      </div>
    );
  }

  return (
    <button
      ref={combinedRef as React.Ref<HTMLButtonElement>}
      type="button"
      aria-pressed={selected}
      className={cn(
        'group flex w-full min-w-0 items-center gap-2 rounded-xl border px-2.5 py-1.5',
        'text-left text-sm font-medium transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-220',
        SIDEBAR_TRANSITION_EASE_CLASS,
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-ring',
        'pointer-events-auto cursor-pointer',
        selected
          ? (selectedClassName ?? 'bg-sidebar-subitem-selected-bg border-border-elevated text-foreground')
          : (unselectedClassName ?? 'border-transparent text-sidebar-foreground/90 hover:bg-sidebar-item-hover-bg/80 hover:text-foreground'),
        className,
      )}
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {leading ? <span className="shrink-0">{leading}</span> : null}
      {children}
      {trailing ? <span className="shrink-0">{trailing}</span> : null}
    </button>
  );
});
