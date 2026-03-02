import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { DialogRoot, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { DeleteConfirmationModal } from '@/components/common/delete-confirmation-modal';
import { cn } from '@/lib/tiptap-utils';
import { findFirstFileId } from '@/lib/file-tree';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { KEYBOARD_SHORTCUTS, getShortcutDisplay } from '@/config/keyboard-shortcuts';
import { Tooltip, TooltipTrigger, AppTooltipContent } from '@/components/ui/tooltip';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
} from '@/components/ui/sidebar';
import { Plus } from 'lucide-react';
import { SidebarTreeSkeleton } from '@/components/skeletons/workspace-skeleton';
import { useSelectedFileId } from '@/store/hooks/use-filesystem-store';
import { SmallTextLabel } from '@/components/common/labels/small-text-label';
import { SidebarActionButton } from '@/components/common/sidebar/sidebar-action-button';
import { useAppEvent, APP_EVENTS } from '@/lib/app-events';
import { SpaceSwitcherMenu } from '@/features/sidebar/components/space-switcher-menu';
import { CreateSpaceModal } from '@/features/sidebar/components/create-space-modal';
import { PinnedNodeItem, SidebarNodes } from '@/features/sidebar/components/sidebar-tree-nodes';
import { markNodeAsRecentlyCreated } from '@/features/sidebar/lib/recently-created-node';

type SidebarProps = {
  side?: 'left' | 'right';
};

const Sidebar = memo(function Sidebar({ side = 'left' }: SidebarProps) {
  const {
    spaces,
    activeSpaceId,
    fileTree,
    pinnedNodes,
    spaceName,
    isLoading,
    addNode,
    addSpace,
    renameSpace,
    deleteSpace,
    setActiveSpace,
    getNodePath,
    toggleFolder,
  } = useFileSystem();
  const selectedFileId = useSelectedFileId();
  const navigate = useNavigate();
  const lastExpandedFileId = useRef<string | null>(null);
  const [isSpaceMenuOpen, setIsSpaceMenuOpen] = useState(false);
  const [isCreateSpaceOpen, setIsCreateSpaceOpen] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [createSpaceError, setCreateSpaceError] = useState('');
  const [spaceToDelete, setSpaceToDelete] = useState<{ id: string; name: string } | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const activeSpaceItemRef = useRef<HTMLElement | null>(null);

  const scrollSelectedNodeIntoView = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (!selectedFileId) {
      return;
    }

    const container = document.getElementById('sidebar-scroll-content');
    if (!container) {
      return;
    }

    const target = Array.from(container.querySelectorAll<HTMLElement>('[data-node-id]')).find(
      (element) => element.dataset.nodeId === selectedFileId,
    );

    if (!target) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const isFullyVisible = targetRect.top >= containerRect.top && targetRect.bottom <= containerRect.bottom;

    if (!isFullyVisible) {
      target.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior });
    }
  }, [selectedFileId]);

  const expandToActiveFile = useCallback(async () => {
    if (!selectedFileId) return;
    const path = getNodePath(selectedFileId);

    for (let index = 0; index < path.length; index += 1) {
      const node = path[index];
      if (index < path.length - 1 && node.nodes && node.nodes.length > 0 && !node.isOpen) {
        await toggleFolder(node.id);
      }
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollSelectedNodeIntoView('smooth');
      });
    });
  }, [selectedFileId, getNodePath, toggleFolder, scrollSelectedNodeIntoView]);

  useEffect(() => {
    if (selectedFileId && selectedFileId !== lastExpandedFileId.current) {
      lastExpandedFileId.current = selectedFileId;
      void expandToActiveFile();
    }
  }, [selectedFileId, expandToActiveFile]);

  useAppEvent(APP_EVENTS.EDITOR_ACTIVATE_FILE, () => {
    void expandToActiveFile();
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (
        isSpaceMenuOpen &&
        !menuRef.current?.contains(target) &&
        !triggerRef.current?.contains(target)
      ) {
        setIsSpaceMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isSpaceMenuOpen]);

  useEffect(() => {
    if (isSpaceMenuOpen && activeSpaceItemRef.current) {
      activeSpaceItemRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [isSpaceMenuOpen, activeSpaceId]);

  const handleGlobalAdd = async () => {
    const newId = await addNode(null);
    markNodeAsRecentlyCreated(newId);
    if (!activeSpaceId) {
      return;
    }
    navigate({
      to: '/spaces/$spaceId/files/$fileId',
      params: { spaceId: activeSpaceId, fileId: newId },
    });
  };

  const handleSwitchSpace = (spaceId: string) => {
    setActiveSpace(spaceId);
    setIsSpaceMenuOpen(false);

    const targetSpace = spaces.find((space) => space.id === spaceId);
    const firstId = findFirstFileId(targetSpace?.fileTree ?? []);

    if (firstId) {
      navigate({
        to: '/spaces/$spaceId/files/$fileId',
        params: { spaceId, fileId: firstId },
      });
      return;
    }

    navigate({ to: '/spaces/$spaceId', params: { spaceId } });
  };

  const handleOpenCreateSpace = () => {
    setNewSpaceName('');
    setCreateSpaceError('');
    setIsSpaceMenuOpen(false);
    setIsCreateSpaceOpen(true);
  };

  const handleCloseCreateSpace = () => {
    setIsCreateSpaceOpen(false);
    setNewSpaceName('');
    setCreateSpaceError('');
  };

  const handleCreateSpace = async (event?: React.FormEvent | KeyboardEvent | MouseEvent) => {
    event?.preventDefault?.();
    const nextName = newSpaceName.trim();
    if (!nextName) {
      setCreateSpaceError('Space name is required');
      return;
    }
    const newSpaceId = await addSpace(nextName);
    navigate({ to: '/spaces/$spaceId', params: { spaceId: newSpaceId } });
    setIsCreateSpaceOpen(false);
    setNewSpaceName('');
    setCreateSpaceError('');
  };

  const handleRenameSpace = async (spaceId: string, nextName: string) => {
    await renameSpace(spaceId, nextName || 'Untitled Space');
  };

  const handleRequestDeleteSpace = (spaceId: string) => {
    if (spaces.length <= 1) return;
    const targetSpace = spaces.find((space) => space.id === spaceId);
    if (!targetSpace) return;
    setSpaceToDelete({ id: spaceId, name: targetSpace.name });
  };

  const handleCancelDeleteSpace = () => setSpaceToDelete(null);

  const handleConfirmDeleteSpace = async () => {
    if (!spaceToDelete) return;
    const spaceId = spaceToDelete.id;
    const remaining = spaces.filter((space) => space.id !== spaceId);
    const nextSpace = spaceId === activeSpaceId ? remaining[0] : spaces.find((s) => s.id === activeSpaceId);

    await deleteSpace(spaceId);
    setIsSpaceMenuOpen(false);
    setSpaceToDelete(null);

    if (!nextSpace) {
      navigate({ to: '/' });
      return;
    }

    const firstId = findFirstFileId(nextSpace.fileTree);
    if (firstId) {
      navigate({
        to: '/spaces/$spaceId/files/$fileId',
        params: { spaceId: nextSpace.id, fileId: firstId },
      });
    } else {
      navigate({ to: '/spaces/$spaceId', params: { spaceId: nextSpace.id } });
    }
  };

  const sortedSpaces = useMemo(
    () => [...spaces].sort((a, b) => a.name.localeCompare(b.name)),
    [spaces]
  );

  const addFileShortcut = useMemo(
    () => getShortcutDisplay(KEYBOARD_SHORTCUTS.CREATE_FILE),
    []
  );

  return (
    <ShadcnSidebar 
      side={side}
      variant="floating"
      collapsible="offcanvas"
      className={cn(
        'bg-transparent border-0',
        'shadow-none',
        'top-10! bottom-2! h-auto!',
        'flex flex-col',
        'print-hidden',
      )}
    >
      <SidebarHeader className="px-3 pt-2">
        <div className="h-1" />
      </SidebarHeader>

         <SidebarContent id="sidebar-scroll-content" className="px-2 overflow-y-auto [scrollbar-gutter:stable]">
        {!isLoading && pinnedNodes.length > 0 && (
          <div className="mb-1">
            <SmallTextLabel>pinned</SmallTextLabel>
            <SidebarMenu className="space-y-0.5">
              {pinnedNodes.map((node) => (
                <PinnedNodeItem
                  key={node.id}
                  node={node}
                  addFileShortcut={addFileShortcut}
                />
              ))}
            </SidebarMenu>
          </div>
        )}

        <div className={cn(!isLoading && pinnedNodes.length > 0 && 'mt-2')}>
          <SmallTextLabel>notes</SmallTextLabel>
          <SidebarMenu className="space-y-0.5 pt-px">
            {isLoading ? (
              <SidebarTreeSkeleton rows={10} className="pt-1.5" />
            ) : (
              fileTree.map((node) => (
                <SidebarNodes
                  key={node.id}
                  node={node}
                  level={0}
                  addFileShortcut={addFileShortcut}
                />
              ))
            )}
          </SidebarMenu>
        </div>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-container-border/80 px-3 py-2.5">
        <div className="flex items-center gap-2 w-full">
          <DialogRoot className="relative flex-1">
            <DialogTrigger
              ref={triggerRef}
              label={spaceName}
              isOpen={isSpaceMenuOpen}
              onClick={() => setIsSpaceMenuOpen((open) => !open)}
              className="bg-sidebar-item-hover-bg/50"
            />

            <DialogContent
              isOpen={isSpaceMenuOpen}
              menuRef={menuRef}
              className="max-h-[60vh]"
            >
              <SpaceSwitcherMenu
                spaces={sortedSpaces}
                activeSpaceId={activeSpaceId}
                activeSpaceItemRef={activeSpaceItemRef}
                onSwitchSpace={handleSwitchSpace}
                onRenameSpace={handleRenameSpace}
                onRequestDeleteSpace={handleRequestDeleteSpace}
                onOpenCreateSpace={handleOpenCreateSpace}
              />
            </DialogContent>
          </DialogRoot>

          <Tooltip delayDuration={120}>
            <TooltipTrigger asChild>
              <SidebarActionButton
                onClick={(event) => {
                  event.preventDefault();
                  void handleGlobalAdd();
                }}
                className="shrink-0 text-sidebar-foreground"
                ariaLabel="Add a new file"
              >
                <Plus size={14} strokeWidth={3} />
              </SidebarActionButton>
            </TooltipTrigger>
            <AppTooltipContent label="Add a new file" shortcut={addFileShortcut} />
          </Tooltip>
        </div>
      </SidebarFooter>

      <CreateSpaceModal
        open={isCreateSpaceOpen}
        spaceName={newSpaceName}
        error={createSpaceError}
        onChangeSpaceName={(value) => {
          setNewSpaceName(value);
          if (createSpaceError) {
            setCreateSpaceError('');
          }
        }}
        onClose={handleCloseCreateSpace}
        onSubmit={handleCreateSpace}
      />
      <DeleteConfirmationModal
        isOpen={!!spaceToDelete}
        itemName={spaceToDelete?.name || 'space'}
        onCancel={handleCancelDeleteSpace}
        onConfirm={handleConfirmDeleteSpace}
      />
    </ShadcnSidebar>
  );
});


export default Sidebar;
