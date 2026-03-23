import { useCallback, useMemo, useRef, useState } from 'react';

import type { TreeNode } from '../types/tree-node';
import { flattenVisibleTree } from '../utils/flatten-visible-tree';

type UseTreeStateArgs = {
  treeRoots: TreeNode[];
};

export function useTreeState({ treeRoots }: UseTreeStateArgs) {
  const [expandedIds, setExpandedIds] = useState(() => new Set<string>());
  const [selectedIds, setSelectedIds] = useState(() => new Set<string>());
  const lastSelectedId = useRef<string | null>(null);

  const flatVisibleRows = useMemo(
    () => flattenVisibleTree(treeRoots, expandedIds),
    [treeRoots, expandedIds],
  );

  const visibleNodeIds = useMemo(
    () => flatVisibleRows.filter((r) => r.kind === 'node').map((r) => r.id),
    [flatVisibleRows],
  );

  const toggleExpand = useCallback((id: string, open: boolean) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const onSelect = useCallback(
    (event: React.MouseEvent, nodeId: string) => {
      event.stopPropagation();

      let nextSelection = new Set(selectedIds);
      const isMeta = event.metaKey || event.ctrlKey;
      const isShift = event.shiftKey;

      if (isShift && lastSelectedId.current) {
        const anchorIndex = visibleNodeIds.indexOf(lastSelectedId.current);
        const currentIndex = visibleNodeIds.indexOf(nodeId);

        if (anchorIndex !== -1 && currentIndex !== -1) {
          const [start, end] = [
            Math.min(anchorIndex, currentIndex),
            Math.max(anchorIndex, currentIndex),
          ];

          visibleNodeIds.slice(start, end + 1).forEach((id) => {
            nextSelection.add(id);
          });
        } else {
          nextSelection.add(nodeId);
        }
      } else if (isMeta) {
        if (nextSelection.has(nodeId)) {
          nextSelection.delete(nodeId);
        } else {
          nextSelection.add(nodeId);
        }
      } else {
        nextSelection = new Set([nodeId]);
      }

      lastSelectedId.current = nodeId;
      setSelectedIds(nextSelection);
    },
    [selectedIds, visibleNodeIds],
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    lastSelectedId.current = null;
  }, []);

  return {
    expandedIds,
    selectedIds,
    flatVisibleRows,
    visibleNodeIds,
    onSelect,
    toggleExpand,
    clearSelection,
    setSelectedIds,
  };
}
