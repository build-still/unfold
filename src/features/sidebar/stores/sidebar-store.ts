import * as React from 'react';
import { create } from 'zustand';

type SidebarState = {
  expandedIds: Set<string>;
  selectedIds: Set<string>;
  lastSelectedId: string | null;
  visibleNodeIds: string[];
  onAddChild: ((parentId: string) => Promise<void>) | null;
};

type SidebarActions = {
  toggleExpand: (id: string, open: boolean) => void;
  selectNode: (event: React.MouseEvent, nodeId: string) => void;
  clearSelection: () => void;
  setVisibleNodeIds: (ids: string[]) => void;
  setOnAddChild: (fn: (parentId: string) => Promise<void>) => void;
};

export const useSidebarStore = create<SidebarState & SidebarActions>(
  (set, get) => ({
    expandedIds: new Set(),
    selectedIds: new Set(),
    lastSelectedId: null,
    visibleNodeIds: [],
    onAddChild: null,

    toggleExpand: (id, open) =>
      set((state) => {
        const next = new Set(state.expandedIds);
        if (open) next.add(id);
        else next.delete(id);
        return { expandedIds: next };
      }),

    selectNode: (event, nodeId) => {
      const { selectedIds, lastSelectedId, visibleNodeIds } = get();
      let nextSelection = new Set(selectedIds);
      const isMeta = event.metaKey || event.ctrlKey;
      const isShift = event.shiftKey;

      if (isShift && lastSelectedId) {
        const anchorIndex = visibleNodeIds.indexOf(lastSelectedId);
        const currentIndex = visibleNodeIds.indexOf(nodeId);
        if (anchorIndex !== -1 && currentIndex !== -1) {
          const [start, end] = [
            Math.min(anchorIndex, currentIndex),
            Math.max(anchorIndex, currentIndex),
          ];
          visibleNodeIds
            .slice(start, end + 1)
            .forEach((id) => nextSelection.add(id));
        } else {
          nextSelection.add(nodeId);
        }
      } else if (isMeta) {
        if (nextSelection.has(nodeId)) nextSelection.delete(nodeId);
        else nextSelection.add(nodeId);
      } else {
        nextSelection = new Set([nodeId]);
      }

      set({ selectedIds: nextSelection, lastSelectedId: nodeId });
    },

    clearSelection: () => set({ selectedIds: new Set(), lastSelectedId: null }),

    setVisibleNodeIds: (ids) => set({ visibleNodeIds: ids }),

    setOnAddChild: (fn) => set({ onAddChild: fn }),
  }),
);
