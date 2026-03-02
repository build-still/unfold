import * as React from 'react';

interface InlineRenameInputProps {
  value: string;
  onChange: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
  className?: string;
}

export const InlineRenameInput = React.forwardRef<HTMLInputElement, InlineRenameInputProps>(
  function InlineRenameInput({ value, onChange, onCommit, onCancel, className }, ref) {
    return (
      <input
        ref={ref}
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => onCommit()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onCommit();
          }
          if (e.key === 'Escape') {
            onCancel();
          }
        }}
        className={
          className ??
          'w-full rounded-md border border-surface-elevated-border bg-surface-elevated px-2 py-1 text-[13px] text-foreground outline-none transition-all duration-200 focus:border-surface-elevated-focus'
        }
      />
    );
  },
);
