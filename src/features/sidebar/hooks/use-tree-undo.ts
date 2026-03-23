import { useCallback, useEffect, useMemo, useRef, type RefObject } from 'react';

import { createUndoStack } from '../stores/undo-stack';

const DEFAULT_MAX = 50;

export function useTreeUndo(options?: { maxDepth?: number }) {
  const maxDepth = options?.maxDepth ?? DEFAULT_MAX;
  const stackRef = useRef<ReturnType<typeof createUndoStack> | null>(null);
  if (!stackRef.current) {
    stackRef.current = createUndoStack(maxDepth);
  }

  const pushUndo = useCallback((fn: () => Promise<void>) => {
    stackRef.current?.push(fn);
  }, []);

  const undo = useCallback(async () => {
    await stackRef.current?.pop();
  }, []);

  const clearUndo = useCallback(() => {
    stackRef.current?.clear();
  }, []);

  const stackApi = useMemo(
    () => ({ pushUndo, undo, clearUndo }),
    [pushUndo, undo, clearUndo],
  );

  return stackApi;
}

/** Cmd+Z / Ctrl+Z when focus is inside `containerRef` (e.g. sidebar). */
export function useUndoKeyboard(
  containerRef: RefObject<HTMLElement | null>,
  onUndo: () => void | Promise<void>,
) {
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
        void onUndo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [containerRef, onUndo]);
}
