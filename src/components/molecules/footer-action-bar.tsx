import * as React from 'react';

import { PrimaryActionButton } from '@/components/atoms/primary-action-button';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FooterActionBarProps {
  hint: React.ReactNode;
  primaryLabel: React.ReactNode;
  onPrimaryClick: () => void;
  primaryDisabled?: boolean;
  secondaryLabel?: React.ReactNode;
  onSecondaryClick?: () => void;
  secondaryDisabled?: boolean;
  className?: string;
}

export function FooterActionBar({
  hint,
  primaryLabel,
  onPrimaryClick,
  primaryDisabled,
  secondaryLabel,
  onSecondaryClick,
  secondaryDisabled,
  className,
}: FooterActionBarProps) {
  return (
    <footer className={cn('flex items-center justify-between gap-4 border-t border-modal-surface-border/70 px-5 py-3', className)}>
      <p className="font-sans text-xs italic text-modal-surface-foreground/60">{hint}</p>
      <div className="flex items-center gap-2">
        {secondaryLabel ? (
          <Button
            onClick={onSecondaryClick}
            variant="transparent"
            disabled={secondaryDisabled}
            className="rounded-lg px-3 py-2 text-xs font-medium text-modal-surface-foreground/62 transition-all duration-150 hover:bg-sidebar-item-hover-bg/30 hover:text-modal-surface-foreground/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {secondaryLabel}
          </Button>
        ) : null}
        <PrimaryActionButton
          onClick={onPrimaryClick}
          disabled={primaryDisabled}
        >
          {primaryLabel}
        </PrimaryActionButton>
      </div>
    </footer>
  );
}
