import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
  type MutationFunctionContext,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { isTauri } from '@tauri-apps/api/core';

import type {
  CreateNodePayload,
  DeleteNodesPayload,
  FlatNode,
  MoveNodesPayload,
  SetPinnedPayload,
  SpaceNotesDto,
  UpdateNodePayload,
  MoveNodesUnpinnedPayload,
  ApplySpaceSnapshotPayload,
} from './nodes';
import {
  nodesCreate,
  nodesDelete,
  nodesList,
  nodesMove,
  nodesSetPinned,
  nodesUpdate,
  nodesMoveUnpinned,
  nodesApplySpaceSnapshot,
  nodeQueryKeys,
  invalidateSpaceNodesQuery,
} from './nodes';

export const emptySpaceNotes: SpaceNotesDto = { nodes: [] };

function nodesQueryOptions(spaceId: string) {
  return {
    queryKey: nodeQueryKeys.space(spaceId),
    queryFn: async (): Promise<SpaceNotesDto> => {
      if (!isTauri()) {
        return emptySpaceNotes;
      }
      return nodesList(spaceId);
    },
  };
}

/** For use under `React.Suspense` — suspends until nodes are available; `data` is always defined when rendered. */
export function useNodesSuspenseQuery(spaceId: string) {
  return useSuspenseQuery(nodesQueryOptions(spaceId));
}

export function useCreateNodeMutation(
  options?: UseMutationOptions<FlatNode, Error, CreateNodePayload>,
) {
  const qc = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: nodesCreate,
    ...restOptions,
    async onSuccess(
      data,
      variables,
      onMutateResult,
      context: MutationFunctionContext,
    ) {
      await invalidateSpaceNodesQuery(qc, variables.spaceId);
      return onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}

export function useUpdateNodeMutation(
  options?: UseMutationOptions<FlatNode, Error, UpdateNodePayload>,
) {
  return useMutation({ mutationFn: nodesUpdate, ...options });
}

export function useMoveNodesMutation(
  options?: UseMutationOptions<void, Error, MoveNodesPayload>,
) {
  const qc = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: nodesMove,
    ...restOptions,
    async onSuccess(
      data,
      variables,
      onMutateResult,
      context: MutationFunctionContext,
    ) {
      await invalidateSpaceNodesQuery(qc, variables.spaceId);
      return onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}

export function useMoveNodesUnpinnedMutation(
  options?: UseMutationOptions<void, Error, MoveNodesUnpinnedPayload>,
) {
  return useMutation({ mutationFn: nodesMoveUnpinned, ...options });
}

export function useApplySpaceSnapshotMutation(
  options?: UseMutationOptions<void, Error, ApplySpaceSnapshotPayload>,
) {
  return useMutation({ mutationFn: nodesApplySpaceSnapshot, ...options });
}

export function useDeleteNodesMutation(
  options?: UseMutationOptions<void, Error, DeleteNodesPayload>,
) {
  const qc = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};
  return useMutation({
    mutationFn: nodesDelete,
    ...restOptions,
    async onSuccess(
      data,
      variables,
      onMutateResult,
      context: MutationFunctionContext,
    ) {
      await invalidateSpaceNodesQuery(qc, variables.spaceId);
      return onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}

export function useSetPinnedMutation(
  options?: UseMutationOptions<void, Error, SetPinnedPayload>,
) {
  const qc = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};
  return useMutation({
    mutationFn: nodesSetPinned,
    ...restOptions,
    async onSuccess(
      data,
      variables,
      onMutateResult,
      context: MutationFunctionContext,
    ) {
      await invalidateSpaceNodesQuery(qc, variables.spaceId);
      return onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
