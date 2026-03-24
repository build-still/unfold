export const DND_DROP_PINNED = 'drop-pinned';
export const DND_DROP_NOTES_ROOT = 'drop-notes-root';

export function dragSourceId(id: string) {
  return `drag-node:${id}`;
}

export function dropTargetNodeId(id: string) {
  return `drop-on:${id}`;
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
