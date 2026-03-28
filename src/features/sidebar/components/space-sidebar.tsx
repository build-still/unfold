import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useDndContext,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useQueryClient } from '@tanstack/react-query';
import * as React from 'react';

import { nodeQueryKeys } from '../api/query-keys';
import {
  useMoveNodesMutation,
  useNodesSuspenseQuery,
  useSetPinnedMutation,
} from '../api/use-nodes';
import { useSidebarAddChild } from '../hooks/use-sidebar-add-child';
import { useTreeDerived } from '../hooks/use-tree-state';
import { useUndoKeyboard } from '../hooks/use-tree-undo';
import { useSidebarStore } from '../stores/sidebar-store';
import { pushSidebarTreeUndo } from '../stores/sidebar-tree-undo-store';
import type { TreeNode } from '../types/tree-node';
import { buildNotesTree, listPinnedNodes } from '../utils/build-tree';
import {
  DND_DROP_EMPTY_PREFIX,
  DND_DROP_NOTES_ROOT,
  DND_DROP_ON_PREFIX,
  DND_DROP_PINNED,
  orderedDragIds,
  parseDragSourceId,
  parseDropTargetNestUnderId,
  snapToCursor,
} from '../utils/dnd';
import { FlatVisibleRowKind } from '../utils/flatten-visible-tree';
import { reparentNodesWithUndo } from '../utils/sidebar-dnd-reparent';

import { NotesTreeVirtual } from './notes-tree-virtual';
import { PinnedSection } from './pinned-section';
import { SpaceSidebarSkeleton } from './space-sidebar-skeleton';

import { nodesSetPinned } from '@/api/nodes';
import type { FlatNodeDto } from '@/api/nodes';
import { Sidebar, SidebarContent, SidebarGroup } from '@/components/ui/sidebar';
import { DEFAULT_SPACE_ID } from '@/config/spaces';

type SpaceSidebarProps = React.ComponentProps<typeof Sidebar> & {
  spaceId?: string;
};

type SpaceSidebarShellProps = SpaceSidebarProps & {
  shellRef?: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
};

/** Shared floating sidebar frame (border, size, spacing) for loaded and loading states. */
function SpaceSidebarShell({
  shellRef,
  children,
  ...sidebarProps
}: SpaceSidebarShellProps) {
  return (
    <div ref={shellRef} className="min-w-0 shrink-0 outline-none">
      <Sidebar
        variant="floating"
        collapsible="offcanvas"
        className="w-55 justify-center align-middle"
        style={{
          top: 'var(--spacing-space-sidebar-top)',
          paddingLeft: 'var(--spacing-space-sidebar-inline)',
          height: `calc(98vh - var(--spacing-space-sidebar-top))`,
        }}
        {...sidebarProps}
      >
        <div className="h-3" />
        {children}
      </Sidebar>
    </div>
  );
}

// hover to expand parent directory
const HOVER_EXPAND_MS = 1000;

function SidebarContentWithDndDragSuppression(
  props: React.ComponentProps<typeof SidebarContent>,
) {
  const { active } = useDndContext();
  return (
    <SidebarContent
      data-sidebar-dnd-dragging={active ? 'true' : undefined}
      {...props}
    />
  );
}

const sidebarPointerCollision: CollisionDetection = (args) => {
  const byPointer = pointerWithin(args);
  if (byPointer.length > 0) {
    const onNodeRow = byPointer.filter((c) => {
      const id = String(c.id);
      return (
        id.startsWith(DND_DROP_ON_PREFIX) ||
        id.startsWith(DND_DROP_EMPTY_PREFIX)
      );
    });
    if (onNodeRow.length > 0) {
      return onNodeRow;
    }
    return byPointer;
  }
  return closestCenter(args);
};

export function SpaceSidebar({
  spaceId: spaceIdProp,
  ...props
}: SpaceSidebarProps) {
  const spaceId = spaceIdProp ?? DEFAULT_SPACE_ID;
  return (
    <React.Suspense
      fallback={
        <SpaceSidebarShell {...props}>
          <SidebarContent className="min-h-0 gap-1">
            <SpaceSidebarSkeleton />
          </SidebarContent>
        </SpaceSidebarShell>
      }
    >
      <SpaceSidebarImpl spaceId={spaceId} {...props} />
    </React.Suspense>
  );
}

function SpaceSidebarImpl({
  spaceId,
  ...props
}: SpaceSidebarProps & { spaceId: string }) {
  const qc = useQueryClient();
  const { data: flat } = useNodesSuspenseQuery(spaceId);

  const moveMut = useMoveNodesMutation();
  const pinMut = useSetPinnedMutation();

  const treeRoots: TreeNode[] = React.useMemo(
    () => buildNotesTree(flat),
    [flat],
  );

  const pinnedFlat = React.useMemo(() => listPinnedNodes(flat), [flat]);

  const pinnedIdsOrdered = React.useMemo(
    () => pinnedFlat.map((p) => p.id),
    [pinnedFlat],
  );

  const { flatVisibleRows } = useTreeDerived(treeRoots);

  const selectedIds = useSidebarStore((s) => s.selectedIds);
  const toggleExpand = useSidebarStore((s) => s.toggleExpand);

  const onAddChild = useSidebarAddChild(spaceId);
  const shellRef = React.useRef<HTMLDivElement>(null);
  const [dragOverlayCount, setDragOverlayCount] = React.useState(1);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const hoverExpandTimerRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const lastHoverDropTargetIdRef = React.useRef<string | null>(null);

  const clearHoverExpandTimer = React.useCallback(() => {
    if (hoverExpandTimerRef.current) {
      clearTimeout(hoverExpandTimerRef.current);
      hoverExpandTimerRef.current = null;
    }
  }, []);

  useUndoKeyboard(shellRef);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const fullOrder = React.useMemo(() => {
    const noteRowIds = flatVisibleRows
      .filter((r) => r.kind === FlatVisibleRowKind.node)
      .map((r) => r.id);
    const merged = [...pinnedIdsOrdered, ...noteRowIds];
    const seen = new Set<string>();
    return merged.filter((id) => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [pinnedIdsOrdered, flatVisibleRows]);

  const snapshotRows = React.useCallback(() => {
    return qc.getQueryData<FlatNodeDto[]>(nodeQueryKeys.space(spaceId));
  }, [qc, spaceId]);

  const handleDragStart = React.useCallback(
    (event: DragStartEvent) => {
      clearHoverExpandTimer();
      lastHoverDropTargetIdRef.current = null;
      const id = parseDragSourceId(event.active.id);
      setDragOverlayCount(id && selectedIds.has(id) ? selectedIds.size : 1);
    },
    [clearHoverExpandTimer, selectedIds],
  );

  const handleDragMove = React.useCallback(
    (event: DragMoveEvent) => {
      const overId = event.over?.id != null ? String(event.over.id) : null;
      const targetId = overId ? parseDropTargetNestUnderId(overId) : null;

      if (targetId === lastHoverDropTargetIdRef.current) {
        return;
      }

      clearHoverExpandTimer();
      lastHoverDropTargetIdRef.current = targetId;

      if (!targetId) return;

      hoverExpandTimerRef.current = setTimeout(() => {
        toggleExpand(targetId, true);
        hoverExpandTimerRef.current = null;
      }, HOVER_EXPAND_MS);
    },
    [clearHoverExpandTimer, toggleExpand],
  );

  const handleDragEnd = React.useCallback(
    async (event: DragEndEvent) => {
      clearHoverExpandTimer();
      lastHoverDropTargetIdRef.current = null;

      setDragOverlayCount(1);
      const { active, over } = event;
      const draggedId = parseDragSourceId(active.id);
      if (!draggedId || !over) return;

      const moving = orderedDragIds(draggedId, selectedIds, fullOrder);
      if (moving.length === 0) return;

      const before = snapshotRows();
      const overId = String(over.id);

      try {
        if (overId === DND_DROP_PINNED) {
          await pinMut.mutateAsync({
            spaceId,
            nodeIds: moving,
            isPinned: true,
          });
          pushSidebarTreeUndo(async () => {
            await nodesSetPinned({ spaceId, nodeIds: moving, isPinned: false });
            await qc.invalidateQueries({
              queryKey: nodeQueryKeys.space(spaceId),
            });
          });
          return;
        }

        if (overId === DND_DROP_NOTES_ROOT) {
          await reparentNodesWithUndo({
            spaceId,
            moving,
            newParentId: null,
            before,
            moveMut,
            pinMut,
            qc,
          });
          return;
        }

        const nestUnderId = parseDropTargetNestUnderId(overId);
        if (nestUnderId) {
          if (moving.includes(nestUnderId)) return;

          const didMove = await reparentNodesWithUndo({
            spaceId,
            moving,
            newParentId: nestUnderId,
            before,
            moveMut,
            pinMut,
            qc,
          });
          if (didMove) {
            toggleExpand(nestUnderId, true);
          }
        }
      } catch (e) {
        console.error(e);
      }
    },
    [
      clearHoverExpandTimer,
      fullOrder,
      moveMut,
      pinMut,
      qc,
      selectedIds,
      snapshotRows,
      spaceId,
      toggleExpand,
    ],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={sidebarPointerCollision}
      modifiers={[snapToCursor]}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <SpaceSidebarShell shellRef={shellRef} spaceId={spaceId} {...props}>
        <SidebarContentWithDndDragSuppression className="min-h-0 gap-1">
          <SidebarGroup className="flex flex-col gap-1">
            <PinnedSection nodes={pinnedFlat} />
          </SidebarGroup>
          <SidebarGroup className="flex min-h-0 flex-1 flex-col">
            <NotesTreeVirtual
              parentRef={scrollRef}
              flatRows={flatVisibleRows}
              onAddChild={onAddChild}
            />
          </SidebarGroup>
        </SidebarContentWithDndDragSuppression>
      </SpaceSidebarShell>
      <DragOverlay dropAnimation={null}>
        <SidebarDragOverlay selectedCount={dragOverlayCount} />
      </DragOverlay>
    </DndContext>
  );
}

function SidebarDragOverlay({ selectedCount }: { selectedCount: number }) {
  return (
    <div className="bg-sidebar text-sidebar-foreground border-sidebar-border text-tiny pointer-events-none cursor-default rounded-lg border px-3 py-2 shadow-md">
      {selectedCount > 1 ? `${selectedCount} notes` : 'moving note'}
    </div>
  );
}
