import { RotateCcw } from 'lucide-react';

import { cn } from '@/lib/utils';

interface RowResetButtonProps {
  title: string;
  disabled: boolean;
  onClick: () => void;
}

export function RowResetButton({ title, disabled, onClick }: RowResetButtonProps) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center size-5 rounded transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-button-ring',
        disabled
          ? 'text-modal-surface-foreground/18 cursor-default'
          : 'text-modal-surface-foreground/45 hover:text-modal-surface-foreground/80 cursor-pointer',
      )}
    >
      <RotateCcw size={11} />
    </button>
  );
}
