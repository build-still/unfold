import type { FlatNode } from '@/features/sidebar/api/nodes';

/**
 * Groups flat nodes by their parent id for fast hierarchical lookups.
 */
export const groupNodesByParent = (
  nodes: FlatNode[],
): Map<string | null, FlatNode[]> => {
  const map = new Map<string | null, FlatNode[]>();

  for (const node of nodes) {
    const key = node.parentId ?? null;

    if (!map.has(key)) {
      map.set(key, []);
    }

    map.get(key)!.push(node);
  }

  return map;
};

/**
 * Expands every ancestor of a node so nested selections become visible.
 */
export const expandNodeAncestors = ({
  nodes,
  startNodeId,
  onExpand,
}: {
  nodes: FlatNode[];
  startNodeId: string;
  onExpand: (nodeId: string, open: boolean) => void;
}): void => {
  let current = nodes.find((node) => node.id === startNodeId);
  const visited = new Set<string>();

  while (current) {
    const parentId = current.parentId;

    if (!parentId) {
      break;
    }

    if (visited.has(parentId)) {
      break;
    }

    visited.add(parentId);
    const parent = nodes.find((node) => node.id === parentId);

    if (!parent) {
      break;
    }

    onExpand(parent.id, true);
    current = parent;
  }
};
