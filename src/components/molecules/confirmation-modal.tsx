import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/utils';

interface ConfirmationAction {
  label: string;
  onClick: () => void;
  variant?: 'outline' | 'error';
  className?: string;
}

interface ConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmAction: ConfirmationAction;
  cancelAction: ConfirmationAction;
  className?: string;
  contentClassName?: string;
}

export function ConfirmationModal({
  open,
  onClose,
  title,
  description,
  confirmAction,
  cancelAction,
  className,
  contentClassName,
}: ConfirmationModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      onCancel={cancelAction.onClick}
      onConfirm={confirmAction.onClick}
      className={cn(
        'border border-sidebar-container-border/80 bg-sidebar-container-bg ring-sidebar-container-border/80 shadow-lg backdrop-blur-2xl backdrop-saturate-150',
        className,
      )}
      backdropClassName="bg-sidebar/50"
    >
      <div className={cn('flex select-none flex-col gap-4 p-6 text-modal-surface-foreground lowercase sm:p-7', contentClassName)}>
        <div className="space-y-2.5">
          <h3 className="font-sans-serif text-lg leading-snug font-medium text-modal-surface-foreground">{title}</h3>
          {description ? (
            <p className="font-sans text-xs leading-relaxed text-modal-surface-foreground/62">{description}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3">
          <Button
            type="button"
            variant={cancelAction.variant ?? 'outline'}
            size="action"
            onClick={cancelAction.onClick}
            className={cancelAction.className}
          >
            {cancelAction.label}
          </Button>
          <Button
            type="button"
            variant={confirmAction.variant ?? 'error'}
            size="action"
            onClick={confirmAction.onClick}
            className={confirmAction.className}
          >
            {confirmAction.label}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
