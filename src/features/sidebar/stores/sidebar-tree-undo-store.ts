import { create } from 'zustand';

import { createUndoStack } from './undo-stack';

const DEFAULT_MAX_DEPTH = 50;

const stack = createUndoStack(DEFAULT_MAX_DEPTH);

type SidebarTreeUndoState = {
  /** For subscribers (e.g. menu item disabled state). */
  undoDepth: number;
  pushUndo: (fn: () => Promise<void>) => void;
  undo: () => Promise<void>;
  clear: () => void;
};

export const useSidebarTreeUndoStore = create<SidebarTreeUndoState>((set) => ({
  undoDepth: 0,
  pushUndo: (fn) => {
    stack.push(fn);
    set({ undoDepth: stack.depth });
  },
  undo: async () => {
    await stack.pop();
    set({ undoDepth: stack.depth });
  },
  clear: () => {
    stack.clear();
    set({ undoDepth: 0 });
  },
}));

export function pushSidebarTreeUndo(fn: () => Promise<void>) {
  useSidebarTreeUndoStore.getState().pushUndo(fn);
}

export function undoSidebarTree() {
  return useSidebarTreeUndoStore.getState().undo();
}
