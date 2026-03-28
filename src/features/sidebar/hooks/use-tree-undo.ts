import { useEffect, type RefObject } from 'react';

import { undoSidebarTree } from '../stores/sidebar-tree-undo-store';
//TODO: revisit this for event driven logic
export function useUndoKeyboard(containerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (!el.contains(t)) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        void undoSidebarTree();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [containerRef]);
}
