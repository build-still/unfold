import { useEffect, useRef } from 'react';

export const APP_EVENTS = {
  EDITOR_ACTIVATE_FILE: 'editor:activate-file',
  SIDEBAR_DELETE_NODE: 'sidebar:delete-node',
  OPEN_FIND_DIALOG: 'openFindDialogFromEditor',
  CLOSE_FIND_DIALOG: 'closeFindDialogFromEditor',
} as const;

export type AppEventName = (typeof APP_EVENTS)[keyof typeof APP_EVENTS];

export type AppEventPayloads = {
  [APP_EVENTS.EDITOR_ACTIVATE_FILE]: undefined;
  [APP_EVENTS.SIDEBAR_DELETE_NODE]: { nodeId: string };
  [APP_EVENTS.OPEN_FIND_DIALOG]: { cursorPos: number | null };
  [APP_EVENTS.CLOSE_FIND_DIALOG]: undefined;
};

export function dispatchAppEvent<K extends AppEventName>(
  ...args: AppEventPayloads[K] extends undefined
    ? [name: K]
    : [name: K, detail: AppEventPayloads[K]]
): void {
  const [name, detail] = args as [K, AppEventPayloads[K] | undefined];
  window.dispatchEvent(
    new CustomEvent(name, detail !== undefined ? { detail } : undefined),
  );
}

export function subscribeToAppEvent<K extends AppEventName>(
  name: K,
  handler: (detail: AppEventPayloads[K]) => void,
): () => void {
  const listener = (e: Event) =>
    handler((e as CustomEvent<AppEventPayloads[K]>).detail);
  window.addEventListener(name, listener);
  return () => window.removeEventListener(name, listener);
}

export function useAppEvent<K extends AppEventName>(
  name: K,
  handler: (detail: AppEventPayloads[K]) => void,
): void {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    return subscribeToAppEvent(name, (detail) => handlerRef.current(detail));
  }, [name]);
}
