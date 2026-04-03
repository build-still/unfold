import { useQueryClient } from '@tanstack/react-query';

import {
  useApplySpaceSnapshotMutation,
  useCreateNodeMutation,
  useDeleteNodesMutation,
  useMoveNodesMutation,
  useSetPinnedMutation,
} from '../api/use-nodes';

import {
  nodeQueryKeys,
  nodesList,
  type CreateNodePayload,
  type DeleteNodesPayload,
  type FlatNode,
  type MoveNodesPayload,
  type SetPinnedPayload,
  type SpaceNotesDto,
} from '@/api/nodes';
import { getUndoManager } from '@/core/undo/undo-manager';

const cloneNodes = (nodes: FlatNode[]): FlatNode[] =>
  nodes.map((node) => ({ ...node }));

const areSnapshotsEqual = (a: FlatNode[], b: FlatNode[]): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i += 1) {
    const left = a[i];
    const right = b[i];

    if (
      left.id !== right.id ||
      left.spaceId !== right.spaceId ||
      left.parentId !== right.parentId ||
      left.name !== right.name ||
      left.sortOrder !== right.sortOrder ||
      left.isPinned !== right.isPinned ||
      left.content !== right.content
    ) {
      return false;
    }
  }

  return true;
};

export const useSidebarUndoActions = () => {
  const queryClient = useQueryClient();

  const createNodeMutation = useCreateNodeMutation();
  const deleteNodesMutation = useDeleteNodesMutation();
  const moveNodesMutation = useMoveNodesMutation();
  const setPinnedMutation = useSetPinnedMutation();
  const applySnapshotMutation = useApplySpaceSnapshotMutation();

  const undoManager = getUndoManager();

  const readCachedSnapshot = (spaceId: string): FlatNode[] | null => {
    const cached = queryClient.getQueryData<SpaceNotesDto>(
      nodeQueryKeys.space(spaceId),
    );

    return cached?.nodes ? cloneNodes(cached.nodes) : null;
  };

  const fetchSnapshot = async (spaceId: string): Promise<FlatNode[]> => {
    const data = await nodesList(spaceId);
    queryClient.setQueryData(nodeQueryKeys.space(spaceId), data);
    return cloneNodes(data.nodes);
  };

  const getSnapshot = async (spaceId: string): Promise<FlatNode[]> => {
    const cached = readCachedSnapshot(spaceId);
    if (cached) {
      return cached;
    }
    return fetchSnapshot(spaceId);
  };

  const applySnapshot = async (spaceId: string, nodes: FlatNode[]) => {
    await applySnapshotMutation.mutateAsync({ spaceId, nodes });
    await fetchSnapshot(spaceId);
  };

  const runWithSnapshotUndo = async <T>(
    spaceId: string,
    execute: () => Promise<T>,
  ): Promise<T> => {
    const beforeSnapshot = await getSnapshot(spaceId);
    const result = await execute();
    const afterSnapshot = await fetchSnapshot(spaceId);

    if (areSnapshotsEqual(beforeSnapshot, afterSnapshot)) {
      return result;
    }

    await undoManager.add({
      undo: () => applySnapshot(spaceId, beforeSnapshot),
      redo: () => applySnapshot(spaceId, afterSnapshot),
    });

    return result;
  };

  const createNodeWithUndo = async (payload: CreateNodePayload) => {
    return runWithSnapshotUndo(payload.spaceId, () =>
      createNodeMutation.mutateAsync(payload),
    );
  };

  const deleteNodesWithUndo = async (payload: DeleteNodesPayload) => {
    return runWithSnapshotUndo(payload.spaceId, () =>
      deleteNodesMutation.mutateAsync(payload),
    );
  };

  const moveNodesWithUndo = async (payload: MoveNodesPayload) => {
    return runWithSnapshotUndo(payload.spaceId, () =>
      moveNodesMutation.mutateAsync(payload),
    );
  };

  const setPinnedWithUndo = async (payload: SetPinnedPayload) => {
    return runWithSnapshotUndo(payload.spaceId, () =>
      setPinnedMutation.mutateAsync(payload),
    );
  };

  return {
    createNodeWithUndo,
    deleteNodesWithUndo,
    moveNodesWithUndo,
    setPinnedWithUndo,
  };
};
