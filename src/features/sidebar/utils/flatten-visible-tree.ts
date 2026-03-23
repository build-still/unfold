import type { TreeNode } from '../types/tree-node';

/** One visible row in the virtual notes list (real node or empty-state under an expanded leaf). */
export type FlatVisibleRow =
  | {
      kind: 'node';
      id: string;
      title: string;
      depth: number;
      hasChildren: boolean;
    }
  | {
      kind: 'empty';
      id: string;
      depth: number;
      parentId: string;
    };

export function flattenVisibleTree(
  roots: TreeNode[],
  expandedIds: ReadonlySet<string>,
): FlatVisibleRow[] {
  const out: FlatVisibleRow[] = [];

  const walk = (nodes: TreeNode[], depth: number) => {
    for (const n of nodes) {
      const hasChildren = n.children.length > 0;
      const expanded = expandedIds.has(n.id);

      out.push({
        kind: 'node',
        id: n.id,
        title: n.title,
        depth,
        hasChildren,
      });

      if (hasChildren && expanded) {
        walk(n.children, depth + 1);
      } else if (!hasChildren && expanded) {
        out.push({
          kind: 'empty',
          id: `${n.id}::__empty`,
          parentId: n.id,
          depth: depth + 1,
        });
      }
    }
  };

  walk(roots, 0);
  return out;
}
