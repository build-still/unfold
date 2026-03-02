import { useCallback, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { removeLastOpenedFile } from '@/utils/last-opened';
import { Node } from '@/types/sidebar';
import {
  findNodeById,
  findNodePath,
  flattenVisibleNodes,
  selectActiveFileId,
  selectActiveSpaceId,
  selectFileTree,
  selectPinnedNodes,
  selectSpaceName,
  selectSpaces,
  selectWorkspaceLoading,
} from '@/store/selectors';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setActiveFileId, setActiveSpaceId } from '@/store/slices/ui-slice';
import {
  useAddNodeMutation,
  useCreateSpaceMutation,
  useDeleteNodeMutation,
  useDeleteSpaceMutation,
  useRenameNodeMutation,
  useRenameSpaceMutation,
  useToggleNodeOpenMutation,
  useToggleNodePinnedMutation,
  useUpdateNodeContentMutation,
} from '@/store/api/app-api';

interface Space {
  id: string;
  name: string;
  fileTree: Node[];
  pinnedNodes: Node[];
}

export interface FileSystemState {
  fileTree: Node[];
  pinnedNodes: Node[];
  spaceName: string;
  spaces: Space[];
  activeSpaceId: string;
  isLoading: boolean;
  setActiveSpace: (id: string) => void;
  addSpace: (name?: string) => Promise<string>;
  renameSpace: (id: string, name: string) => Promise<void>;
  deleteSpace: (id: string) => Promise<void>;
  addNode: (parentId: string | null) => Promise<string>;
  updateNodeContent: (id: string, content: string) => Promise<void>;
  renameNode: (id: string, name: string) => Promise<void>;
  getNode: (id: string) => Node | null;
  toggleFolder: (id: string) => Promise<void>;
  togglePinNode: (id: string) => Promise<void>;
  isNodePinned: (id: string) => boolean;
  getNodePath: (id: string) => Node[];
  deleteNode: (id: string) => Promise<void>;
  getPreviousVisibleNode: (id: string) => string | null;
}

export function useFileSystemStore(): FileSystemState {
  const dispatch = useAppDispatch();

  const activeSpaceId = useAppSelector(selectActiveSpaceId);
  const spaces = useAppSelector(selectSpaces);
  const fileTree = useAppSelector(selectFileTree);
  const pinnedNodes = useAppSelector(selectPinnedNodes);
  const spaceName = useAppSelector(selectSpaceName);
  const isLoading = useAppSelector(selectWorkspaceLoading);

  const [createSpaceMutation] = useCreateSpaceMutation();
  const [renameSpaceMutation] = useRenameSpaceMutation();
  const [deleteSpaceMutation] = useDeleteSpaceMutation();
  const [addNodeMutation] = useAddNodeMutation();
  const [updateNodeContentMutation] = useUpdateNodeContentMutation();
  const [renameNodeMutation] = useRenameNodeMutation();
  const [toggleNodeOpenMutation] = useToggleNodeOpenMutation();
  const [toggleNodePinnedMutation] = useToggleNodePinnedMutation();
  const [deleteNodeMutation] = useDeleteNodeMutation();

  const setActiveSpace = useCallback(
    (id: string) => {
      const exists = spaces.some((space) => space.id === id);

      if (exists) {
        dispatch(setActiveSpaceId(id));
        return;
      }

      const fallback = spaces[0]?.id ?? '';
      dispatch(setActiveSpaceId(fallback));
    },
    [dispatch, spaces],
  );

  const addSpace = useCallback(
    async (name?: string) => {
      const id = uuidv4();
      const result = await createSpaceMutation({ id, name }).unwrap();
      dispatch(setActiveSpaceId(result.id));
      return result.id;
    },
    [createSpaceMutation, dispatch],
  );

  const renameSpace = useCallback(
    async (id: string, name: string) => {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return;
      }

      await renameSpaceMutation({ id, name: trimmedName }).unwrap();
    },
    [renameSpaceMutation],
  );

  const deleteSpace = useCallback(
    async (id: string) => {
      if (spaces.length <= 1) {
        return;
      }

      await deleteSpaceMutation({ id }).unwrap();
      removeLastOpenedFile(id);

      if (activeSpaceId !== id) {
        return;
      }

      const remainingSpaces = spaces.filter((space) => space.id !== id);
      const fallbackId = remainingSpaces[0]?.id ?? '';
      dispatch(setActiveSpaceId(fallbackId));
    },
    [activeSpaceId, deleteSpaceMutation, dispatch, spaces],
  );

  const addNode = useCallback(
    async (parentId: string | null) => {
      if (!activeSpaceId) {
        return '';
      }

      const id = uuidv4();
      const result = await addNodeMutation({ id, spaceId: activeSpaceId, parentId }).unwrap();
      return result.id;
    },
    [activeSpaceId, addNodeMutation],
  );

  const updateNodeContent = useCallback(
    async (id: string, content: string) => {
      await updateNodeContentMutation({ id, content }).unwrap();
    },
    [updateNodeContentMutation],
  );

  const renameNode = useCallback(
    async (id: string, name: string) => {
      await renameNodeMutation({ id, name }).unwrap();
    },
    [renameNodeMutation],
  );

  const getNode = useCallback(
    (id: string): Node | null => {
      return findNodeById(fileTree, id);
    },
    [fileTree],
  );

  const toggleFolder = useCallback(
    async (id: string) => {
      const node = findNodeById(fileTree, id);
      if (!node) {
        return;
      }

      await toggleNodeOpenMutation({ id, isOpen: !node.isOpen }).unwrap();
    },
    [fileTree, toggleNodeOpenMutation],
  );

  const togglePinNode = useCallback(
    async (id: string) => {
      const node = findNodeById(fileTree, id);
      if (!node) {
        return;
      }

      await toggleNodePinnedMutation({ id, isPinned: !node.isPinned }).unwrap();
    },
    [fileTree, toggleNodePinnedMutation],
  );

  const isNodePinned = useCallback(
    (id: string): boolean => {
      return pinnedNodes.some((node) => node.id === id);
    },
    [pinnedNodes],
  );

  const getNodePath = useCallback(
    (id: string): Node[] => {
      return findNodePath(fileTree, id);
    },
    [fileTree],
  );

  const deleteNode = useCallback(
    async (id: string) => {
      await deleteNodeMutation({ id }).unwrap();
    },
    [deleteNodeMutation],
  );

  const getPreviousVisibleNode = useCallback(
    (id: string): string | null => {
      const flatList = flattenVisibleNodes(fileTree);
      const currentIndex = flatList.findIndex((node) => node.id === id);

      if (currentIndex > 0) {
        return flatList[currentIndex - 1].id;
      }

      return null;
    },
    [fileTree],
  );

  return useMemo(
    () => ({
      fileTree,
      pinnedNodes,
      spaceName,
      spaces,
      activeSpaceId,
      isLoading,
      setActiveSpace,
      addSpace,
      renameSpace,
      deleteSpace,
      addNode,
      updateNodeContent,
      renameNode,
      getNode,
      toggleFolder,
      togglePinNode,
      isNodePinned,
      getNodePath,
      deleteNode,
      getPreviousVisibleNode,
    }),
    [
      activeSpaceId,
      addNode,
      addSpace,
      deleteNode,
      deleteSpace,
      fileTree,
      getNode,
      getNodePath,
      getPreviousVisibleNode,
      isLoading,
      isNodePinned,
      pinnedNodes,
      renameNode,
      renameSpace,
      setActiveSpace,
      spaceName,
      spaces,
      toggleFolder,
      togglePinNode,
      updateNodeContent,
    ],
  );
}

export function useSyncActiveFileSelection(fileId: string | null): void {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setActiveFileId(fileId));
  }, [dispatch, fileId]);
}

export function useSyncActiveSpaceSelection(spaceId: string | null): void {
  const dispatch = useAppDispatch();
  const spaces = useAppSelector(selectSpaces);
  const activeSpaceId = useAppSelector(selectActiveSpaceId);

  useEffect(() => {
    if (!spaceId || activeSpaceId === spaceId) {
      return;
    }

    const exists = spaces.some((space) => space.id === spaceId);
    if (!exists) {
      return;
    }

    dispatch(setActiveSpaceId(spaceId));
  }, [activeSpaceId, dispatch, spaceId, spaces]);
}

export function useIsNodeSelected(nodeId: string): boolean {
  const activeFileId = useAppSelector(selectActiveFileId);
  return activeFileId === nodeId;
}

export function useSelectedFileId(): string | null {
  return useAppSelector(selectActiveFileId);
}
