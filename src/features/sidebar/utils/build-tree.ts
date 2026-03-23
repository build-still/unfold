import type { TreeNode } from '../types/tree-node';

import type { FlatNodeDto } from '@/api/nodes';

function sortByOrder(a: FlatNodeDto, b: FlatNodeDto): number {
  if (a.sortOrder !== b.sortOrder) {
    return a.sortOrder - b.sortOrder;
  }
  return a.name.localeCompare(b.name, undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

/**
 * Notes tree from stored `parentId` for every node (pinned or not) so pinned
 * notes stay under their parent in the outline. The pinned strip is an extra
 * shortcut list; it does not replace the hierarchy.
 */
export function buildNotesTree(flat: FlatNodeDto[]): TreeNode[] {
  const byId = new Map(flat.map((r) => [r.id, r]));
  const children = new Map<string | null, FlatNodeDto[]>();

  for (const row of flat) {
    let parentId = row.parentId;
    if (parentId !== null && !byId.has(parentId)) {
      parentId = null;
    }
    const list = children.get(parentId) ?? [];
    list.push(row);
    children.set(parentId, list);
  }

  for (const [, list] of children) {
    list.sort(sortByOrder);
  }

  function toTree(row: FlatNodeDto): TreeNode {
    const ch = children.get(row.id) ?? [];
    return {
      id: row.id,
      title: row.name,
      sortOrder: row.sortOrder,
      children: ch.map(toTree),
    };
  }

  const roots = children.get(null) ?? [];
  return roots.map(toTree);
}

export function listPinnedNodes(flat: FlatNodeDto[]): FlatNodeDto[] {
  return [...flat].filter((r) => r.isPinned).sort(sortByOrder);
}
