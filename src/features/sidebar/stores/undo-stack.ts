/** Imperative undo stack (max depth) for sidebar structural actions. */
export function createUndoStack(maxDepth: number) {
  const stack: (() => Promise<void>)[] = [];

  return {
    push(fn: () => Promise<void>) {
      stack.push(fn);
      while (stack.length > maxDepth) {
        stack.shift();
      }
    },
    async pop(): Promise<boolean> {
      const fn = stack.pop();
      if (!fn) return false;
      await fn();
      return true;
    },
    clear() {
      stack.length = 0;
    },
  };
}
