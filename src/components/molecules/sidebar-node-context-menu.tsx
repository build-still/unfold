import * as React from 'react';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { KEYBOARD_SHORTCUTS, getShortcutDisplay } from '@/config/keyboard-shortcuts';

interface SidebarNodeContextMenuProps {
  pinLabel: string;
  onCreateChild: () => void;
  onTogglePin: () => void;
  onOpenDeleteModal: () => void;
  children: React.ReactNode;
}

export function SidebarNodeContextMenu({
  pinLabel,
  onCreateChild,
  onTogglePin,
  onOpenDeleteModal,
  children,
}: SidebarNodeContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={onCreateChild}>
          Add child
          <ContextMenuShortcut>{getShortcutDisplay(KEYBOARD_SHORTCUTS.CREATE_FILE)}</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onSelect={onTogglePin}>
          {pinLabel}
          <ContextMenuShortcut>{getShortcutDisplay(KEYBOARD_SHORTCUTS.PIN_NOTE)}</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={onOpenDeleteModal} variant="destructive">
          Delete
          <ContextMenuShortcut>{getShortcutDisplay(KEYBOARD_SHORTCUTS.DELETE_NOTE)}</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
