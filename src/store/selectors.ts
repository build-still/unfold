import { createSelector } from '@reduxjs/toolkit';
import { Node } from '@/types/sidebar';
import type { RootState } from '@/store';
import { appApi } from '@/store/api/app-api';

export const selectThemePreference = (state: RootState) => state.ui.themePreference;
export const selectActiveSpaceId = (state: RootState) => state.ui.activeSpaceId;
export const selectActiveFileId = (state: RootState) => state.ui.activeFileId;
export const selectPendingFileId = (state: RootState) => state.ui.pendingFileId;

export const selectWorkspaceQuery = appApi.endpoints.getWorkspace.select();
export const selectWorkspaceData = createSelector(
  selectWorkspaceQuery,
  (queryState) => queryState.data ?? { spaces: [] },
);

export const selectWorkspaceLoading = createSelector(
  selectWorkspaceQuery,
  (queryState) => {
    if (queryState.status === 'uninitialized') {
      return true;
    }

    if (queryState.status === 'pending' && !queryState.data) {
      return true;
    }

    return false;
  },
);

export const selectSpaces = createSelector(selectWorkspaceData, (workspace) => workspace.spaces);

export const selectActiveSpace = createSelector(
  [selectSpaces, selectActiveSpaceId],
  (spaces, activeSpaceId) => {
    if (spaces.length === 0) {
      return null;
    }

    return spaces.find((space) => space.id === activeSpaceId) ?? spaces[0] ?? null;
  },
);

export const selectFileTree = createSelector(
  selectActiveSpace,
  (space) => space?.fileTree ?? [],
);

export const selectPinnedNodes = createSelector(
  selectActiveSpace,
  (space) => space?.pinnedNodes ?? [],
);

export const selectSpaceName = createSelector(
  selectActiveSpace,
  (space) => space?.name ?? '',
);

export function findNodeById(nodes: Node[], id: string): Node | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }

    if (node.nodes) {
      const nested = findNodeById(node.nodes, id);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
}

export function findNodePath(nodes: Node[], id: string): Node[] {
  const path: Node[] = [];

  const search = (items: Node[], currentPath: Node[]): boolean => {
    for (const node of items) {
      const nextPath = [...currentPath, node];

      if (node.id === id) {
        path.push(...nextPath);
        return true;
      }

      if (node.nodes && node.nodes.length > 0 && search(node.nodes, nextPath)) {
        return true;
      }
    }

    return false;
  };

  search(nodes, []);
  return path;
}

export function flattenVisibleNodes(nodes: Node[]): Node[] {
  const result: Node[] = [];

  const walk = (items: Node[]) => {
    items.forEach((node) => {
      result.push(node);

      if (node.isOpen && node.nodes && node.nodes.length > 0) {
        walk(node.nodes);
      }
    });
  };

  walk(nodes);
  return result;
}
