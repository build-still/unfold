import type * as React from 'react';

import { PrimaryActionButton } from '@/components/atoms/primary-action-button';
import { FormField } from '@/components/molecules/form-field';
import { Modal } from '@/components/ui/modal';

interface CreateSpaceModalProps {
  open: boolean;
  spaceName: string;
  error: string;
  onChangeSpaceName: (value: string) => void;
  onClose: () => void;
  onSubmit: (event?: React.FormEvent | KeyboardEvent | MouseEvent) => void;
}

export function CreateSpaceModal({
  open,
  spaceName,
  error,
  onChangeSpaceName,
  onClose,
  onSubmit,
}: CreateSpaceModalProps) {
  return (
    <Modal open={open} onClose={onClose} onCancel={onClose} onConfirm={onSubmit}>
      <form onSubmit={onSubmit} className="flex flex-col gap-6 p-6">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-sidebar-title">create space</h3>
          <p className="text-sm text-foreground-muted-tertiary">name your new space to organize your documents.</p>
        </div>

        <FormField
          label="space name"
          error={error || null}
          labelClassName="pointer-events-auto text-sm font-medium text-modal-surface-foreground/92"
        >
          <input
            autoFocus
            value={spaceName}
            onChange={(event) => onChangeSpaceName(event.target.value)}
            aria-invalid={!!error}
            className="pointer-events-auto w-full rounded-lg border border-surface-elevated-border bg-surface-elevated px-3.5 py-2.5 text-sm text-sidebar-title outline-none transition-all duration-200 placeholder:text-input-placeholder focus:border-surface-elevated-focus focus:bg-surface-deep"
            placeholder="enter a space name"
          />
        </FormField>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-foreground-muted-tertiary transition-all duration-200 hover:bg-surface-elevated hover:text-foreground-muted-hover"
          >
            cancel
          </button>
          <PrimaryActionButton
            type="submit"
            className="pointer-events-auto"
          >
            create space
          </PrimaryActionButton>
        </div>
      </form>
    </Modal>
  );
}
