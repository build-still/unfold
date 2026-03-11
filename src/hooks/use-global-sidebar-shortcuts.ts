
import { useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { useEditorContext } from '@/contexts/EditorContext';
import { KEYBOARD_SHORTCUTS } from '@/config/keyboard-shortcuts';
import { dispatchAppEvent, APP_EVENTS } from '@/lib/app-events';
import { useAppDispatch } from '@/store/hooks';
import { setPendingFileId } from '@/store/slices/ui-slice';

const parseAccelerator = (accelerator: string) => {
  const parts = accelerator.split('+');
  const key = parts[parts.length - 1];
  const modifiers = parts.slice(0, -1);
  
  return {
    key: key.toLowerCase(),
    requiresCmdOrCtrl: modifiers.includes('CmdOrCtrl') || modifiers.includes('Cmd') || modifiers.includes('Ctrl'),
    requiresAlt: modifiers.includes('Alt'),
    requiresShift: modifiers.includes('Shift'),
  };
};

export function  useGlobalSidebarShortcuts() {
  const { fileId } = useParams({ strict: false });
  const { addNode, togglePinNode } = useFileSystem();
  const { pageEditorRef, titleEditorRef } = useEditorContext();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const isEditingContent = (): boolean => {
    const activeElement = document.activeElement as HTMLElement;
    if (!activeElement) return false;
    
    const tagName = activeElement.tagName.toLowerCase();
    const isEditableInput = tagName === 'input' || tagName === 'textarea';
    
    const isContentEditable = activeElement.isContentEditable;

    const isPageEditorFocused = pageEditorRef.current?.isFocused ?? false;
    const isTitleEditorFocused = titleEditorRef.current?.isFocused ?? false;
    
    return isEditableInput || isContentEditable || isPageEditorFocused || isTitleEditorFocused;
  };

  useEffect(() => {
    const createFileShortcut = parseAccelerator(KEYBOARD_SHORTCUTS.CREATE_FILE);
    const deleteShortcut = parseAccelerator(KEYBOARD_SHORTCUTS.DELETE_NOTE);
    const pinShortcut = parseAccelerator(KEYBOARD_SHORTCUTS.PIN_NOTE);

    const handleKeyDown = async (event: KeyboardEvent) => {
      const isCmdOrCtrl = event.metaKey || event.ctrlKey;
      const isAlt = event.altKey;
      const isShift = event.shiftKey;

      if (
        event.key.toLowerCase() === createFileShortcut.key &&
        (!createFileShortcut.requiresCmdOrCtrl || isCmdOrCtrl) &&
        (!createFileShortcut.requiresAlt || isAlt) &&
        (!createFileShortcut.requiresShift || isShift)
      ) {
        event.preventDefault();
        const createdNode = await addNode(fileId || null);
        if (createdNode) {
          dispatch(setPendingFileId(createdNode.id));
          navigate({
            to: '/spaces/$spaceId/files/$fileId',
            params: { spaceId: createdNode.spaceId, fileId: createdNode.id },
          });
        }
        return;
      }

      if (
        fileId &&
        !isEditingContent() &&
        event.key.toLowerCase() === deleteShortcut.key.toLowerCase() &&
        (!deleteShortcut.requiresCmdOrCtrl || isCmdOrCtrl) &&
        (!deleteShortcut.requiresAlt || isAlt) &&
        (!deleteShortcut.requiresShift || isShift)
      ) {
        event.preventDefault();
        dispatchAppEvent(APP_EVENTS.SIDEBAR_DELETE_NODE, { nodeId: fileId });
        return;
      }

      if (
        fileId &&
        !isEditingContent() &&
        event.key.toLowerCase() === pinShortcut.key.toLowerCase() &&
        (!pinShortcut.requiresCmdOrCtrl || isCmdOrCtrl) &&
        (!pinShortcut.requiresAlt || isAlt) &&
        (!pinShortcut.requiresShift || isShift)
      ) {
        event.preventDefault();
        await togglePinNode(fileId);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, fileId, addNode, togglePinNode, navigate, pageEditorRef, titleEditorRef]);
}
