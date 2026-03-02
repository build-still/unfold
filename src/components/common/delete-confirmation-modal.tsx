import { ConfirmationModal } from '@/components/molecules/confirmation-modal';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  itemName: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmationModal({
  isOpen,
  itemName,
  onCancel,
  onConfirm,
}: DeleteConfirmationModalProps) {
  const resolvedItemName = itemName?.trim().length ? itemName.trim() : 'this item';
  return (
    <ConfirmationModal
      open={isOpen}
      onClose={onCancel}
      title={(
        <>
          send <span className="font-semibold italic">{resolvedItemName}</span> to trash?
        </>
      )}
      description="it stays in trash for 15 days before it is removed"
      cancelAction={{
        label: 'keep it',
        onClick: onCancel,
        variant: 'outline',
        className: 'border-sidebar-border/60 bg-sidebar-item-hover-bg/40 text-sidebar-foreground/90 transition-all duration-200 hover:bg-sidebar-item-hover-bg/70',
      }}
      confirmAction={{
        label: 'move to trash',
        onClick: onConfirm,
        variant: 'error',
        className: 'border-button-error-border/70 bg-button-error-bg/70 text-button-error-text hover:bg-button-error-hover-bg hover:border-button-error-hover-border',
      }}
    />
  );
}
