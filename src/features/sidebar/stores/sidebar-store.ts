import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

type SidebarState = {
  expandedIds: Set<string>;
  selectedIds: Set<string>;
  activeNodeId: string | null;
};

export type SelectNodeContext = {
  visibleOrder?: readonly string[];
};

type SidebarActions = {
  toggleExpand: (id: string, open: boolean) => void;
  setActiveNodeId: (nodeId: string) => void;
};

type PersistedSidebarState = {
  expandedIds?: string[];
  selectedIds?: string[];
  activeNodeId?: string | null;
};

export const useSidebarStore = create<SidebarState & SidebarActions>()(
  persist(
    immer((set) => ({
      expandedIds: new Set(),
      selectedIds: new Set(),
      activeNodeId: null,

      toggleExpand: (id, open) =>
        set((state) => {
          if (open) state.expandedIds.add(id);
          else state.expandedIds.delete(id);
        }),

      setActiveNodeId: (nodeId: string) =>
        set((state) => {
          state.activeNodeId = nodeId;
        }),
    })),
    {
      name: 'sidebar-store',

      // serialize Sets
      partialize: (state) => ({
        ...state,
        expandedIds: Array.from(state.expandedIds),
        selectedIds: Array.from(state.selectedIds),
      }),

      // deserialize back to Sets
      merge: (persisted, current) => {
        const persistedState = (persisted ?? {}) as PersistedSidebarState;

        return {
          ...current,
          ...persistedState,
          expandedIds: new Set(persistedState.expandedIds ?? []),
          selectedIds: new Set(persistedState.selectedIds ?? []),
        };
      },
    },
  ),
);
