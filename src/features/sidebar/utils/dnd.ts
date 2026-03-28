import { Modifier } from '@dnd-kit/core';

export const DND_DROP_PINNED = 'drop-pinned';
export const DND_DROP_NOTES_ROOT = 'drop-notes-root';
export const DND_DROP_ON_PREFIX = 'drop-on:';
/** Unique id for “no sub notes” rows (same nest-under semantics as `drop-on:<parentId>`). */
export const DND_DROP_EMPTY_PREFIX = 'drop-empty:';

export function dragSourceId(id: string) {
  return `drag-node:${id}`;
}

export function dropTargetNodeId(id: string) {
  return `${DND_DROP_ON_PREFIX}${id}`;
}

export function dropTargetEmptyPlaceholderId(parentId: string) {
  return `${DND_DROP_EMPTY_PREFIX}${parentId}`;
}

/** Parses `drop-on:<nodeId>` droppable ids; returns `null` if not a node drop target. */
export function parseDropOnNodeId(overId: string): string | null {
  if (!overId.startsWith(DND_DROP_ON_PREFIX)) return null;
  return overId.slice(DND_DROP_ON_PREFIX.length);
}

/** Nest-under id from either a node row (`drop-on:`) or empty placeholder (`drop-empty:`). */
export function parseDropTargetNestUnderId(overId: string): string | null {
  const onNode = parseDropOnNodeId(overId);
  if (onNode) return onNode;
  if (!overId.startsWith(DND_DROP_EMPTY_PREFIX)) return null;
  return overId.slice(DND_DROP_EMPTY_PREFIX.length);
}

export function parseDragSourceId(
  activeId: string | number | undefined,
): string | null {
  if (activeId == undefined || activeId == null) return null;
  const s = String(activeId);
  if (!s.startsWith('drag-node:')) return null;
  return s.slice('drag-node:'.length);
}

export function orderedDragIds(
  activeId: string,
  selectedIds: ReadonlySet<string>,
  order: string[],
): string[] {
  const set = selectedIds.has(activeId) ? selectedIds : new Set([activeId]);
  return order.filter((id) => set.has(id));
}

// Shifts the drag overlay so its top-left corner starts exactly at the cursor.
export const snapToCursor: Modifier = ({
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
