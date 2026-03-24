import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type Modifier,
} from '@dnd-kit/core';
import { useQueryClient } from '@tanstack/react-query';
import * as React from 'react';

import { nodeQueryKeys } from '../api/query-keys';
import {
  useCreateNodeMutation,
  useMoveNodesMutation,
  useNodesQuery,
  useSetPinnedMutation,
} from '../api/use-nodes';
import { useTreeDerived } from '../hooks/use-tree-state';
import { useTreeUndo, useUndoKeyboard } from '../hooks/use-tree-undo';
import { useSidebarStore } from '../stores/sidebar-store';
import type { TreeNode } from '../types/tree-node';
import { buildNotesTree, listPinnedNodes } from '../utils/build-tree';
import {
  DND_DROP_NOTES_ROOT,
  DND_DROP_PINNED,
  orderedDragIds,
  parseDragSourceId,
} from '../utils/dnd-ids';
import { FlatVisibleRowKind } from '../utils/flatten-visible-tree';

import { NotesTreeVirtual } from './notes-tree-virtual';
import { PinnedSection } from './pinned-section';

import { nodesDelete, nodesMove, nodesSetPinned } from '@/api/nodes';
import type { FlatNodeDto } from '@/api/nodes';
import { Sidebar, SidebarContent, SidebarGroup } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { DEFAULT_SPACE_ID } from '@/config/spaces';

// Shifts the drag overlay so its top-left corner starts exactly at the cursor.
const snapToCursor: Modifier = ({
  activatorEvent,
  draggingNodeRect,
  transform,
}) => {
  if (draggingNodeRect && activatorEvent && 'clientX' in activatorEvent) {
    const evt = activatorEvent as PointerEvent;
    return {
      ...transform,
      x: transform.x + evt.clientX - draggingNodeRect.left,
      y: transform.y + evt.clientY - draggingNodeRect.top,
    };
  }
  return transform;
};

type SpaceSidebarProps = React.ComponentProps<typeof Sidebar> & {
  spaceId?: string;
};

export function SpaceSidebar({
  spaceId = DEFAULT_SPACE_ID,
  ...props
}: SpaceSidebarProps) {
  const qc = useQueryClient();
  const {
    data: flat,
    isLoading,
    isError,
    error: loadError,
  } = useNodesQuery(spaceId);

  const createMut = useCreateNodeMutation();
  const moveMut = useMoveNodesMutation();
  const pinMut = useSetPinnedMutation();

  const treeRoots: TreeNode[] = React.useMemo(
    () => (flat ? buildNotesTree(flat) : []),
    [flat],
  );

  const pinnedFlat = React.useMemo(
    () => (flat ? listPinnedNodes(flat) : []),
    [flat],
  );

  const pinnedIdsOrdered = React.useMemo(
    () => pinnedFlat.map((p) => p.id),
    [pinnedFlat],
  );

  const { flatVisibleRows } = useTreeDerived(treeRoots);

  // Read UI state from store
  const selectedIds = useSidebarStore((s) => s.selectedIds);
  const toggleExpand = useSidebarStore((s) => s.toggleExpand);
  const clearSelection = useSidebarStore((s) => s.clearSelection);
  const setOnAddChild = useSidebarStore((s) => s.setOnAddChild);

  const { pushUndo, undo } = useTreeUndo();
  const shellRef = React.useRef<HTMLDivElement>(null);
  const [dragOverlayCount, setDragOverlayCount] = React.useState(1);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useUndoKeyboard(shellRef, () => {
    void undo();
  });

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
      const id = parseDragSourceId(event.active.id);
      setDragOverlayCount(id && selectedIds.has(id) ? selectedIds.size : 1);
    },
    [selectedIds],
  );

  const handleDragEnd = React.useCallback(
    async (event: DragEndEvent) => {
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
          pushUndo(async () => {
            await nodesSetPinned({ spaceId, nodeIds: moving, isPinned: false });
            await qc.invalidateQueries({
              queryKey: nodeQueryKeys.space(spaceId),
            });
          });
          clearSelection();
          return;
        }

        if (overId === DND_DROP_NOTES_ROOT) {
          if (before) {
            const prevById = new Map(before.map((n) => [n.id, n]));
            await pinMut.mutateAsync({
              spaceId,
              nodeIds: moving,
              isPinned: false,
            });
            await moveMut.mutateAsync({
              spaceId,
              nodeIds: moving,
              newParentId: null,
              insertBeforeId: null,
            });
            pushUndo(async () => {
              for (const id of moving) {
                const row = prevById.get(id);
                if (!row) continue;
                await nodesSetPinned({
                  spaceId,
                  nodeIds: [id],
                  isPinned: row.isPinned,
                });
                await nodesMove({
                  spaceId,
                  nodeIds: [id],
                  newParentId: row.parentId,
                  insertBeforeId: null,
                });
              }
              await qc.invalidateQueries({
                queryKey: nodeQueryKeys.space(spaceId),
              });
            });
          }
          clearSelection();
          return;
        }

        if (overId.startsWith('drop-on:')) {
          const targetId = overId.slice('drop-on:'.length);
          if (moving.includes(targetId)) return;

          if (before) {
            const prevById = new Map(before.map((n) => [n.id, n]));
            await pinMut.mutateAsync({
              spaceId,
              nodeIds: moving,
              isPinned: false,
            });
            await moveMut.mutateAsync({
              spaceId,
              nodeIds: moving,
              newParentId: targetId,
              insertBeforeId: null,
            });
            pushUndo(async () => {
              for (const id of moving) {
                const row = prevById.get(id);
                if (!row) continue;
                await nodesSetPinned({
                  spaceId,
                  nodeIds: [id],
                  isPinned: row.isPinned,
                });
                await nodesMove({
                  spaceId,
                  nodeIds: [id],
                  newParentId: row.parentId,
                  insertBeforeId: null,
                });
              }
              await qc.invalidateQueries({
                queryKey: nodeQueryKeys.space(spaceId),
              });
            });
          }
          clearSelection();
        }
      } catch (e) {
        console.error(e);
      }
    },
    [
      clearSelection,
      fullOrder,
      moveMut,
      pinMut,
      pushUndo,
      qc,
      selectedIds,
      snapshotRows,
      spaceId,
    ],
  );

  const onAddChild = React.useCallback(
    async (parentId: string) => {
      const before = snapshotRows();
      try {
        await createMut.mutateAsync({ spaceId, parentId, name: 'new page' });
        if (before) {
          pushUndo(async () => {
            const created = qc.getQueryData<FlatNodeDto[]>(
              nodeQueryKeys.space(spaceId),
            );
            const newest = created?.find(
              (n) => !before.some((b) => b.id === n.id),
            );
            if (newest) {
              await nodesDelete({ spaceId, nodeIds: [newest.id] });
              await qc.invalidateQueries({
                queryKey: nodeQueryKeys.space(spaceId),
              });
            }
          });
        }
        toggleExpand(parentId, true);
      } catch (e) {
        console.error(e);
      }
    },
    [createMut, pushUndo, qc, snapshotRows, spaceId, toggleExpand],
  );

  // Inject onAddChild into the store so deep components can call it without prop drilling
  React.useEffect(() => {
    setOnAddChild(onAddChild);
  }, [onAddChild, setOnAddChild]);

  const topOffset = 'var(--spacing-space-sidebar-top)';

  return (
    <DndContext
      sensors={sensors}
      modifiers={[snapToCursor]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div ref={shellRef} className="min-w-0 shrink-0 outline-none">
        <Sidebar
          variant="floating"
          collapsible="offcanvas"
          className="w-55 justify-center align-middle"
          style={{
            top: topOffset,
            paddingLeft: 'var(--spacing-space-sidebar-inline)',
            height: `calc(98vh - ${topOffset})`,
          }}
          {...props}
        >
          <div className="h-3" />
          <SidebarContent className="min-h-0 gap-1">
            {isLoading ? (
              <div className="flex flex-col gap-2 px-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-4 w-16 pt-4" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : null}
            {isError ? (
              <p className="text-destructive text-tiny px-2 wrap-break-word">
                Could not load notes.
                {loadError instanceof Error ? ` ${loadError.message}` : ''}
              </p>
            ) : null}
            {!isLoading && !isError ? (
              <>
                <SidebarGroup className="flex flex-col gap-1">
                  <PinnedSection nodes={pinnedFlat} />
                </SidebarGroup>
                <SidebarGroup className="flex min-h-0 flex-1 flex-col">
                  <NotesTreeVirtual
                    parentRef={scrollRef}
                    flatRows={flatVisibleRows}
                  />
                </SidebarGroup>
              </>
            ) : null}
          </SidebarContent>
        </Sidebar>
      </div>
      <DragOverlay dropAnimation={null}>
        <SidebarDragOverlay selectedCount={dragOverlayCount} />
      </DragOverlay>
    </DndContext>
  );
}

function SidebarDragOverlay({ selectedCount }: { selectedCount: number }) {
  return (
    <div className="bg-sidebar text-sidebar-foreground border-sidebar-border text-tiny pointer-events-none rounded-lg border px-3 py-2 shadow-md">
      {selectedCount > 1 ? `${selectedCount} notes` : 'Moving note'}
    </div>
  );
}
