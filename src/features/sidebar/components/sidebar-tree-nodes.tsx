import { type KeyboardEvent as ReactKeyboardEvent, memo, useCallback, useEffect, useState } from 'react';

import { useNavigate } from '@tanstack/react-router';
import { motion, useReducedMotion } from 'motion/react';

import { DeleteConfirmationModal } from '@/components/common/delete-confirmation-modal';
import { SidebarChildrenCollapse } from '@/components/molecules/sidebar-children-collapse';
import { SidebarNodeContextMenu } from '@/components/molecules/sidebar-node-context-menu';
import { SidebarNodeRow } from '@/components/molecules/sidebar-node-row';
import { SidebarMenuItem, SidebarMenuSubItem } from '@/components/ui/sidebar';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { useAppEvent, APP_EVENTS } from '@/lib/app-events';
import { cn } from '@/lib/tiptap-utils';
import { useIsNodeSelected, useSelectedFileId } from '@/store/hooks/use-filesystem-store';
import { useAppDispatch } from '@/store/hooks';
import { setPendingFileId } from '@/store/slices/ui-slice';
import { Node as SidebarNode } from '@/types/sidebar';
import { consumeRecentlyCreatedNode, markNodeAsRecentlyCreated } from '@/features/sidebar/lib/recently-created-node';
import {
  SIDEBAR_MINDFUL_CHILD_STAGGER,
  SIDEBAR_TREE_CLOSE_SPRING,
  SIDEBAR_TREE_OPEN_SPRING,
} from '@/components/sidebar/sidebar-motion';

function useNodeActions(node: SidebarNode) {
  const { activeSpaceId, addNode, deleteNode, getPreviousVisibleNode, togglePinNode } = useFileSystem();
  const selectedFileId = useSelectedFileId();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleOpenDeleteModal = useCallback(() => setIsDeleteModalOpen(true), []);
  const handleCancelDelete = useCallback(() => setIsDeleteModalOpen(false), []);

  const handleConfirmDelete = useCallback(async () => {
    if (selectedFileId === node.id) {
      const prevNodeId = getPreviousVisibleNode(node.id);
      if (prevNodeId) {
        dispatch(setPendingFileId(prevNodeId));
        navigate({ to: '/spaces/$spaceId/files/$fileId', params: { spaceId: activeSpaceId, fileId: prevNodeId } });
      } else {
        navigate({ to: '/spaces/$spaceId', params: { spaceId: activeSpaceId } });
      }
    }
    await deleteNode(node.id);
    setIsDeleteModalOpen(false);
  }, [selectedFileId, node.id, getPreviousVisibleNode, navigate, activeSpaceId, deleteNode, dispatch]);

  const handleCreateChild = useCallback(async () => {
    const createdNode = await addNode(node.id);
    if (!createdNode) {
      return;
    }

    markNodeAsRecentlyCreated(createdNode.id);
    dispatch(setPendingFileId(createdNode.id));
    navigate({
      to: '/spaces/$spaceId/files/$fileId',
      params: { spaceId: createdNode.spaceId, fileId: createdNode.id },
    });
  }, [addNode, node.id, navigate, dispatch]);

  const handleTogglePin = useCallback(async () => {
    await togglePinNode(node.id);
  }, [togglePinNode, node.id]);

  const handleAddChild = useCallback(async (event: React.MouseEvent) => {
    event.stopPropagation();
    const createdNode = await addNode(node.id);
    if (!createdNode) {
      return;
    }

    markNodeAsRecentlyCreated(createdNode.id);
    dispatch(setPendingFileId(createdNode.id));
    navigate({
      to: '/spaces/$spaceId/files/$fileId',
      params: { spaceId: createdNode.spaceId, fileId: createdNode.id },
    });
  }, [addNode, node.id, navigate, dispatch]);

  return {
    activeSpaceId,
    navigate,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    handleOpenDeleteModal,
    handleCancelDelete,
    handleConfirmDelete,
    handleCreateChild,
    handleTogglePin,
    handleAddChild,
    dispatch,
  };
}

const PinnedNodeItem = memo(({
  node,
  addFileShortcut,
}: {
  node: SidebarNode;
  addFileShortcut: string;
}) => {
  const { toggleFolder, getNodePath, getNode } = useFileSystem();
  const isSelected = useIsNodeSelected(node.id);
  const dispatch = useAppDispatch();
  const {
    activeSpaceId,
    navigate,
    isDeleteModalOpen,
    handleOpenDeleteModal,
    handleCancelDelete,
    handleConfirmDelete,
    handleCreateChild,
    handleTogglePin,
    handleAddChild,
  } = useNodeActions(node);

  const canonicalNode = getNode(node.id);
  const hasChildren = !!canonicalNode?.nodes?.length;
  const isOpen = !!canonicalNode?.isOpen;

  const handleToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    const path = getNodePath(node.id);
    path.forEach((pathNode, index) => {
      if (index < path.length - 1 && pathNode.nodes && pathNode.nodes.length > 0 && !pathNode.isOpen) {
        toggleFolder(pathNode.id);
      }
    });
    if (hasChildren) {
      toggleFolder(node.id);
    }
  };

  return (
    <>
      <SidebarMenuItem className="px-0">
        <SidebarNodeContextMenu
          pinLabel="Unpin"
          onCreateChild={handleCreateChild}
          onTogglePin={handleTogglePin}
          onOpenDeleteModal={handleOpenDeleteModal}
        >
          <SidebarNodeRow
            name={node.name || 'new page'}
            selected={isSelected}
            data-node-id={node.id}
            rowType="pinned-item"
            addFileShortcut={addFileShortcut}
            isOpen={isOpen}
            showToggle={hasChildren}
            className="text-[13px] font-[450]"
            selectedClassName="bg-sidebar-subitem-selected-bg border-border-elevated text-foreground/90 font-[450]"
            unselectedClassName="border-transparent text-sidebar-foreground/90 hover:bg-sidebar-item-hover-bg/80 hover:text-foreground"
            onSelect={() => {
              dispatch(setPendingFileId(node.id));
              navigate({ to: '/spaces/$spaceId/files/$fileId', params: { spaceId: activeSpaceId, fileId: node.id } });
            }}
            onKeyboardSelect={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                dispatch(setPendingFileId(node.id));
                navigate({ to: '/spaces/$spaceId/files/$fileId', params: { spaceId: activeSpaceId, fileId: node.id } });
              }
            }}
            onAddChild={handleAddChild}
            onToggleNode={handleToggle}
          />
        </SidebarNodeContextMenu>
      </SidebarMenuItem>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        itemName={node.name?.trim() || 'new page'}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
});

export const SidebarNodes = memo(({
  node,
  level = 0,
  isFirstChild = false,
  addFileShortcut,
}: {
  node: SidebarNode;
  level?: number;
  isFirstChild?: boolean;
  addFileShortcut: string;
}) => {
  const { toggleFolder, isNodePinned } = useFileSystem();
  const prefersReducedMotion = useReducedMotion();
  const isSelected = useIsNodeSelected(node.id);
  const dispatch = useAppDispatch();
  const {
    activeSpaceId,
    navigate,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    handleOpenDeleteModal,
    handleCancelDelete,
    handleConfirmDelete,
    handleCreateChild,
    handleTogglePin,
    handleAddChild,
  } = useNodeActions(node);

  const hasChildren = node.nodes && node.nodes.length > 0;
  const isPinned = isNodePinned(node.id);
  const isOpen = !!node.isOpen;
  const isRoot = level === 0;
  const [isRecentlyCreated, setIsRecentlyCreated] = useState(() => consumeRecentlyCreatedNode(node.id));

  useEffect(() => {
    if (!isRecentlyCreated) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setIsRecentlyCreated(false);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isRecentlyCreated]);

  const handleToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    toggleFolder(node.id);
  };

  useAppEvent(APP_EVENTS.SIDEBAR_DELETE_NODE, (detail) => {
    if (detail?.nodeId === node.id) {
      setIsDeleteModalOpen(true);
    }
  });

  const Wrapper = isRoot ? SidebarMenuItem : SidebarMenuSubItem;
  const rowType = isRoot ? 'item-row' : 'sub-item-row';

  return (
    <>
      <Wrapper className={cn(!isRoot && isFirstChild && 'mt-1', 'px-0 pointer-events-auto')}>
        <SidebarNodeContextMenu
          pinLabel={isPinned ? 'Unpin' : 'Pin'}
          onCreateChild={handleCreateChild}
          onTogglePin={handleTogglePin}
          onOpenDeleteModal={handleOpenDeleteModal}
        >
          <SidebarNodeRow
            name={node.name || 'new page'}
            selected={isSelected}
            isRecentlyCreated={isRecentlyCreated}
            data-node-id={node.id}
            rowType={rowType}
            addFileShortcut={addFileShortcut}
            isOpen={isOpen}
            showToggle
            className="text-sm font-medium"
            selectedClassName="bg-sidebar-subitem-selected-bg border-border-elevated text-foreground/90"
            unselectedClassName={cn(
              'border-transparent text-sidebar-foreground/90 hover:text-foreground',
              isRoot ? 'hover:bg-sidebar-item-hover-bg/80' : 'hover:bg-sidebar-item-hover-bg/70',
            )}
            onSelect={() => {
              dispatch(setPendingFileId(node.id));
              navigate({ to: '/spaces/$spaceId/files/$fileId', params: { spaceId: activeSpaceId, fileId: node.id } });
            }}
            onKeyboardSelect={(event: ReactKeyboardEvent<HTMLElement>) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                dispatch(setPendingFileId(node.id));
                navigate({ to: '/spaces/$spaceId/files/$fileId', params: { spaceId: activeSpaceId, fileId: node.id } });
              }
            }}
            onAddChild={handleAddChild}
            onToggleNode={handleToggle}
          />
        </SidebarNodeContextMenu>

        <SidebarChildrenCollapse
          isOpen={isOpen}
          nodeId={node.id}
          isRoot={isRoot}
        >
          {hasChildren ? (
            node.nodes!.map((childNode, index) => (
              <motion.div
                key={childNode.id}
                initial={false}
                animate={{
                  opacity: isOpen ? 1 : 0,
                  y: isOpen ? 0 : -4,
                }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : {
                      ...(isOpen ? SIDEBAR_TREE_OPEN_SPRING : SIDEBAR_TREE_CLOSE_SPRING),
                      delay: isOpen ? Math.min(index * SIDEBAR_MINDFUL_CHILD_STAGGER, 0.28) : 0,
                    }
                }
                style={{ pointerEvents: 'auto' }}
              >
                <SidebarNodes node={childNode} level={level + 1} isFirstChild={index === 0} addFileShortcut={addFileShortcut} />
              </motion.div>
            ))
          ) : (
            <div className="mt-1 px-2 py-1 text-xs text-sidebar-foreground/50">No sub notes</div>
          )}
        </SidebarChildrenCollapse>
      </Wrapper>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        itemName={node.name?.trim() || 'new page'}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
});

export { PinnedNodeItem };
