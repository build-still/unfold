import * as React from 'react';
import { create } from 'zustand';

type SidebarState = {
  expandedIds: Set<string>;
  selectedIds: Set<string>;
  lastSelectedId: string | null;
  visibleNodeIds: string[];
};

type SidebarActions = {
  toggleExpand: (id: string, open: boolean) => void;
  selectNode: (event: React.MouseEvent, nodeId: string) => void;
  clearSelection: () => void;
  setVisibleNodeIds: (ids: string[]) => void;
};

export const useSidebarStore = create<SidebarState & SidebarActions>((set) => ({
  expandedIds: new Set(),
  selectedIds: new Set(),
  lastSelectedId: null,
  visibleNodeIds: [],

  toggleExpand: (id, open) =>
    set((state) => {
      const next = new Set(state.expandedIds);
      if (open) next.add(id);
      else next.delete(id);
      return { expandedIds: next };
    }),

  selectNode: (_event, nodeId) => {
    set({ selectedIds: new Set([nodeId]), lastSelectedId: nodeId });
  },

  clearSelection: () => set({ selectedIds: new Set(), lastSelectedId: null }),

  setVisibleNodeIds: (ids) => set({ visibleNodeIds: ids }),
}));
