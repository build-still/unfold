import { PointerActivationConstraints } from '@dnd-kit/dom';
import {
  DragOverlay,
  DragDropProvider,
  KeyboardSensor,
  PointerSensor,
} from '@dnd-kit/react';
import { useEffect, useRef, useState, type ComponentProps } from 'react';

import { useNodesSuspenseQuery } from '../api/use-nodes';
import { useSidebarUndoActions } from '../hooks/use-sidebar-undo-actions';
import { useSidebarStore } from '../stores/sidebar-store';
import {
  DROPPABLE_NOTES_SECTION_ID,
  isPinnedDropTargetId,
  toOperationId,
} from '../utils/dnd';
import { expandNodeAncestors } from '../utils/node-tree';

import { NotesSection } from './notes-section';
import { PinnedSection } from './pinned-section';
import { SidebarDragOverlay } from './sidebar-drag-overlay';

import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';

type OnDragOver = NonNullable<
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
      // prevent click on sidebdar button from starting a drag operation
      new PointerActivationConstraints.Distance({ value: 6 }),
    ],
  }),
  KeyboardSensor,
];

export type SpaceSidebarContentProps = {
  spaceId: string;
};

export const SpaceSidebarContent = ({ spaceId }: SpaceSidebarContentProps) => {
  const nodes = useNodesSuspenseQuery(spaceId).data.nodes ?? [];
  const [activeDragNodeId, setActiveDragNodeId] = useState<string | null>(null);
  const [isDraggingInNotesArea, setIsDraggingInNotesArea] = useState(false);

  const hoverExpandTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const hoverExpandTargetIdRef = useRef<string | null>(null);

  const pinnedNodes = nodes.filter((node) => node.isPinned);

  const toggleExpand = useSidebarStore((store) => store.toggleExpand);

  const expandParentNodes = (startNodeId: string) => {
    expandNodeAncestors({
      nodes,
      startNodeId,
      onExpand: toggleExpand,
    });
  };

  const { moveNodesWithUndo, setPinnedWithUndo } = useSidebarUndoActions();

  const clearHoverExpand = () => {
    if (hoverExpandTimeoutRef.current) {
      clearTimeout(hoverExpandTimeoutRef.current);
      hoverExpandTimeoutRef.current = null;
    }
    hoverExpandTargetIdRef.current = null;
  };

  const onDragStart: OnDragStart = (event) => {
    const sourceItemId = toOperationId(event.operation?.source?.id);
    setActiveDragNodeId(sourceItemId);
    setIsDraggingInNotesArea(
      Boolean(sourceItemId && !isPinnedDropTargetId(sourceItemId)),
    );
  };

  const onDragOver: OnDragOver = (event) => {
    const targetParentId = toOperationId(event.operation?.target?.id);
    const sourceItemId = toOperationId(event.operation?.source?.id);

    if (!sourceItemId || isPinnedDropTargetId(sourceItemId)) {
      setIsDraggingInNotesArea(false);
    } else if (targetParentId) {
      setIsDraggingInNotesArea(!isPinnedDropTargetId(targetParentId));
    }

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
    setIsDraggingInNotesArea(false);
    clearHoverExpand();

    if (event.canceled) {
      return;
    }

    const targetParentId = toOperationId(event.operation?.target?.id);
    const sourceItemId = toOperationId(event.operation?.source?.id);

    if (!sourceItemId || !targetParentId || sourceItemId === targetParentId) {
      return;
    }

    if (
      targetParentId !== DROPPABLE_NOTES_SECTION_ID &&
      !isPinnedDropTargetId(targetParentId)
    ) {
      toggleExpand(targetParentId, true);
    }

    if (isPinnedDropTargetId(targetParentId)) {
      if (pinnedNodes.some((node) => node.id === sourceItemId)) {
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
      spaceId,
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
    <SidebarContent
      data-sidebar-dnd-dragging={activeDragNodeId ? 'true' : undefined}
      className="h-full min-h-0 gap-1 overflow-y-auto"
    >
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
        <SidebarGroup className="h-full">
          <SidebarGroupLabel>notes</SidebarGroupLabel>
          <NotesSection
            nodes={nodes}
            expandParentNodes={expandParentNodes}
            isDraggingInNotesArea={isDraggingInNotesArea}
          />
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
