import { useEffect, useMemo } from 'react';

import { useSidebarStore } from '../stores/sidebar-store';
import type { TreeNode } from '../types/tree-node';
import {
  flattenVisibleTree,
  FlatVisibleRowKind,
} from '../utils/flatten-visible-tree';

/**
 * Derives flatVisibleRows and visibleNodeIds from server-fetched treeRoots
 * combined with expandedIds from the sidebar store.
 * Also syncs visibleNodeIds back into the store for shift-click range-select.
 */
export function useTreeDerived(treeRoots: TreeNode[]) {
  const expandedIds = useSidebarStore((s) => s.expandedIds);
  const setVisibleNodeIds = useSidebarStore((s) => s.setVisibleNodeIds);

  const flatVisibleRows = useMemo(
    () => flattenVisibleTree(treeRoots, expandedIds),
    [treeRoots, expandedIds],
  );

  const visibleNodeIds = useMemo(
    () =>
      flatVisibleRows
        .filter((r) => r.kind === FlatVisibleRowKind.node)
        .map((r) => r.id),
    [flatVisibleRows],
  );

  useEffect(() => {
    setVisibleNodeIds(visibleNodeIds);
  }, [visibleNodeIds, setVisibleNodeIds]);

  return { flatVisibleRows, visibleNodeIds };
}
