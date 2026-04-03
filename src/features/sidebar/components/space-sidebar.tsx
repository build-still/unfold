import { PointerActivationConstraints } from '@dnd-kit/dom';
import {
  DragOverlay,
  DragDropProvider,
  KeyboardSensor,
  PointerSensor,
} from '@dnd-kit/react';
import {
  Suspense,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
} from 'react';

import { useNodesSuspenseQuery } from '../api/use-nodes';
import { useSidebarUndoActions } from '../hooks/use-sidebar-undo-actions';
import { useSidebarStore } from '../stores/sidebar-store';

import { NotesSection } from './notes-section';
import { PinnedSection } from './pinned-section';
import { SidebarDragOverlay } from './sidebar-drag-overlay';
import { SpaceSidebarSkeleton } from './space-sidebar-skeleton';

import { useSpaceStore } from '@/components/store/space.store';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { DEFAULT_SPACE_ID } from '@/config/spaces';
import { getUndoManager } from '@/core/undo/undo-manager';
import {
  DROPPABLE_NOTES_SECTION_ID,
  isPinnedDropTargetId,
  toOperationId,
} from '@/features/sidebar/utils/dnd';
import { expandNodeAncestors } from '@/features/sidebar/utils/node-tree';

/**
 * TODOS
 * 1. pinned section isnt draggable, so unpinning isnt possible, maybe pinning should be a context menu option
 * 2. drag and drop doesnt alway work, fiiles that were just dropped isnt working
 * 3. allow only 5 levels of nesting, and show a warning when user tries to exceed that, this is because the current design of the sidebar with the current indentation style will break if we allow more levels, we can revisit the design later to accomodate more levels
 * 4. touchpad haptics on drag and drop would be a nice to have
 * 5. Scrollbar has gutter, so layout shift is happening. It should be like the Slack Scrollbar.
 * 6. Delete button should show modal to confirm deletion, and it should also show the number of sub notes that will be deleted. This is because deleting a note with many sub notes by mistake can be a bad experience.
 */

const spaceId = DEFAULT_SPACE_ID;

type onDragOver = NonNullable<
  ComponentProps<typeof DragDropProvider>['onDragOver']
>;
type OnDragStart = NonNullable<
  ComponentProps<typeof DragDropProvider>['onDragStart']
>;
type OnDragEnd = NonNullable<
  ComponentProps<typeof DragDropProvider>['onDragEnd']
>;

const sidebarSensors = [
  PointerSensor.configure({
    activationConstraints: [
      // Prevent every click from starting a drag operation.
      new PointerActivationConstraints.Distance({ value: 6 }),
    ],
  }),
  KeyboardSensor,
];

const SpaceSidebarContent = () => {
  // query data
  const nodes = useNodesSuspenseQuery(spaceId).data.nodes ?? [];
  const [activeDragNodeId, setActiveDragNodeId] = useState<string | null>(null);

  // hover-expand timers
  const hoverExpandTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const hoverExpandTargetIdRef = useRef<string | null>(null);

  // derived data
  const pinnedNodes = nodes.filter((node) => node.isPinned);

  // store actions
  const toggleExpand = useSidebarStore((s) => s.toggleExpand);

  // tree navigation helpers
  const expandParentNodes = (startNodeId: string) => {
    expandNodeAncestors({
      nodes,
      startNodeId,
      onExpand: toggleExpand,
    });
  };

  // mutations
  const { moveNodesWithUndo, setPinnedWithUndo } = useSidebarUndoActions();

  const clearHoverExpand = () => {
    if (hoverExpandTimeoutRef.current) {
      clearTimeout(hoverExpandTimeoutRef.current);
      hoverExpandTimeoutRef.current = null;
    }
    hoverExpandTargetIdRef.current = null;
  };

  const onDragStart: OnDragStart = (event) => {
    setActiveDragNodeId(toOperationId(event.operation?.source?.id));
  };

  const onDragOver: onDragOver = (event) => {
    const targetParentId = toOperationId(event.operation?.target?.id);
    const sourceItemId = toOperationId(event.operation?.source?.id);

    if (!sourceItemId || !targetParentId) {
      clearHoverExpand();
      return;
    }

    if (
      sourceItemId === targetParentId ||
      targetParentId === DROPPABLE_NOTES_SECTION_ID ||
      isPinnedDropTargetId(targetParentId) ||
      isPinnedDropTargetId(sourceItemId)
    ) {
      clearHoverExpand();
      return;
    }

    if (hoverExpandTargetIdRef.current === targetParentId) {
      return;
    }

    clearHoverExpand();
    hoverExpandTargetIdRef.current = targetParentId;

    hoverExpandTimeoutRef.current = setTimeout(() => {
      toggleExpand(targetParentId, true);
      hoverExpandTimeoutRef.current = null;
      hoverExpandTargetIdRef.current = null;
    }, 900);
  };

  const onDragEnd: OnDragEnd = (event) => {
    setActiveDragNodeId(null);
    clearHoverExpand();

    const targetParentId = toOperationId(event.operation?.target?.id);
    const sourceItemId = toOperationId(event.operation?.source?.id);

    if (!sourceItemId) return;
    if (!targetParentId) return;
    if (sourceItemId === targetParentId) return;

    if (
      targetParentId !== DROPPABLE_NOTES_SECTION_ID &&
      !isPinnedDropTargetId(targetParentId)
    ) {
      toggleExpand(targetParentId, true);
    }

    if (isPinnedDropTargetId(targetParentId)) {
      if (pinnedNodes.some((n) => n.id === sourceItemId)) {
        // already pinned, do nothing
        return;
      }

      const sourceNode = nodes.find((node) => node.id === sourceItemId);
      if (!sourceNode) {
        return;
      }

      void setPinnedWithUndo({
        spaceId,
        nodeIds: [sourceNode.id],
        isPinned: true,
      });
      return;
    }

    void moveNodesWithUndo({
      spaceId: spaceId,
      nodeIds: [sourceItemId],
      newParentId:
        targetParentId === DROPPABLE_NOTES_SECTION_ID ? null : targetParentId,
    });
  };

  useEffect(() => {
    return () => {
      clearHoverExpand();
    };
  }, []);

  return (
    <SidebarContent className="h-full min-h-0 gap-1 overflow-y-auto">
      <DragDropProvider
        sensors={sidebarSensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
      >
        <SidebarGroup>
          <SidebarGroupLabel>pinned</SidebarGroupLabel>
          <PinnedSection
            pinnedNodes={pinnedNodes}
            expandParentNodes={expandParentNodes}
          />
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>notes</SidebarGroupLabel>
          <NotesSection nodes={nodes} expandParentNodes={expandParentNodes} />
        </SidebarGroup>
        <DragOverlay>
          <SidebarDragOverlay
            nodes={nodes}
            activeDragNodeId={activeDragNodeId}
          />
        </DragOverlay>
      </DragDropProvider>
    </SidebarContent>
  );
};

export const SpaceSidebar = () => {
  const setCurrentSpaceID = useSpaceStore((s) => s.setCurrentSpaceID);
  const sidebarContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCurrentSpaceID(spaceId);
  }, [setCurrentSpaceID, spaceId]);

  useEffect(() => {
    const undoManager = getUndoManager();
    return undoManager.attachKeyboardShortcuts(
      () => sidebarContainerRef.current,
    );
  }, []);

  return (
    <div ref={sidebarContainerRef} className="h-full">
      <Sidebar
        variant="floating"
        collapsible="offcanvas"
        className="shadow-sidebar-shadow border-sidebar-border bg-sidebar w-50 justify-center rounded-4xl border align-middle select-none"
        style={{
          top: 'var(--spacing-space-sidebar-top)',
          height: `calc(98vh - var(--spacing-space-sidebar-top))`,
        }}
      >
        <div className="h-3" />
        <Suspense fallback={<SpaceSidebarSkeleton />}>
          <SpaceSidebarContent />
        </Suspense>
      </Sidebar>
    </div>
  );
};
