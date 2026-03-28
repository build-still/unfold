import { useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
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
import {
  useAppMutation,
  useAppQuery,
  useSuspenseAppQuery,
} from '@/lib/react-query';

function nodesQueryOptions(spaceId: string) {
  return {
    queryKey: nodeQueryKeys.space(spaceId),
    queryFn: async () => {
      if (!isTauri()) {
        return [];
      }
      return nodesList(spaceId);
    },
  };
}

/** Standard query: loading/error via result flags (does not suspend). */
export function useNodesQuery(spaceId: string) {
  return useAppQuery({
    ...nodesQueryOptions(spaceId),
    enabled: !!spaceId,
    // Empty list until the first fetch; `initialDataUpdatedAt: 0` keeps data stale so we still fetch
    // despite global `staleTime` (otherwise TanStack would treat initial data as fresh for 60s).
    initialData: [],
    initialDataUpdatedAt: 0,
  });
}

/** For use under `React.Suspense` — suspends until nodes are available; `data` is always defined when rendered. */
export function useNodesSuspenseQuery(spaceId: string) {
  return useSuspenseAppQuery(nodesQueryOptions(spaceId));
}

export function useCreateNodeMutation(
  options?: UseMutationOptions<FlatNodeDto, Error, CreateNodePayload>,
) {
  const qc = useQueryClient();
  return useAppMutation({
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
  return useAppMutation({
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
  return useAppMutation({
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
  return useAppMutation({
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
  return useAppMutation({
    mutationFn: nodesSetPinned,
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({
        queryKey: nodeQueryKeys.space(variables.spaceId),
      });
    },
    ...options,
  });
}
