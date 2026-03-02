import * as React from 'react';

import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  error?: string | null;
  helperText?: string;
  children: React.ReactNode;
  labelClassName?: string;
  className?: string;
}

export function FormField({
  label,
  error,
  helperText,
  children,
  labelClassName,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label
        className={cn(
          'block font-sans text-[0.82rem] font-medium tracking-[0.02em] text-modal-surface-foreground/92',
          labelClassName,
        )}
      >
        {label}
      </label>
      {children}
      {helperText && !error ? (
        <p className="text-xs text-modal-surface-foreground/60">{helperText}</p>
      ) : null}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
