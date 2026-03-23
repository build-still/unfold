import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { isTauri } from '@tauri-apps/api/core';

import { nodeQueryKeys } from './query-keys';

import type {
  CreateNodePayload,
  DeleteNodesPayload,
  FlatNodeDto,
  MoveNodesPayload,
  SetPinnedPayload,
  UpdateNodePayload,
} from '@/api/nodes';
import {
  nodesCreate,
  nodesDelete,
  nodesList,
  nodesMove,
  nodesSetPinned,
  nodesUpdate,
} from '@/api/nodes';

export function useNodesQuery(spaceId: string) {
  return useQuery({
    queryKey: nodeQueryKeys.space(spaceId),
    queryFn: async () => {
      if (!isTauri()) {
        return [];
      }
      return nodesList(spaceId);
    },
  });
}

export function useCreateNodeMutation(
  options?: UseMutationOptions<FlatNodeDto, Error, CreateNodePayload>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: nodesCreate,
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({
        queryKey: nodeQueryKeys.space(variables.spaceId),
      });
    },
    ...options,
  });
}

export function useUpdateNodeMutation(
  options?: UseMutationOptions<FlatNodeDto, Error, UpdateNodePayload>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: nodesUpdate,
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({
        queryKey: nodeQueryKeys.space(variables.spaceId),
      });
    },
    ...options,
  });
}

export function useMoveNodesMutation(
  options?: UseMutationOptions<void, Error, MoveNodesPayload>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: nodesMove,
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({
        queryKey: nodeQueryKeys.space(variables.spaceId),
      });
    },
    ...options,
  });
}

export function useDeleteNodesMutation(
  options?: UseMutationOptions<void, Error, DeleteNodesPayload>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: nodesDelete,
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({
        queryKey: nodeQueryKeys.space(variables.spaceId),
      });
    },
    ...options,
  });
}

export function useSetPinnedMutation(
  options?: UseMutationOptions<void, Error, SetPinnedPayload>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: nodesSetPinned,
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({
        queryKey: nodeQueryKeys.space(variables.spaceId),
      });
    },
    ...options,
  });
}
