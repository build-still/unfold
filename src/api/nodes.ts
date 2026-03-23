import { invoke } from '@tauri-apps/api/core';

export type FlatNodeDto = {
  id: string;
  spaceId: string;
  parentId: string | null;
  name: string;
  sortOrder: number;
  isPinned: boolean;
  isOpen: boolean;
};

export type CreateNodePayload = {
  spaceId: string;
  parentId: string | null;
  name: string;
};

export type UpdateNodePayload = {
  spaceId: string;
  id: string;
  name?: string;
  isOpen?: boolean;
};

export type MoveNodesPayload = {
  spaceId: string;
  nodeIds: string[];
  newParentId: string | null;
  insertBeforeId: string | null;
};

export type DeleteNodesPayload = {
  spaceId: string;
  nodeIds: string[];
};

export type SetPinnedPayload = {
  spaceId: string;
  nodeIds: string[];
  isPinned: boolean;
};

export async function nodesList(spaceId: string): Promise<FlatNodeDto[]> {
  return invoke<FlatNodeDto[]>('nodes_list', { spaceId });
}

export async function nodesCreate(
  payload: CreateNodePayload,
): Promise<FlatNodeDto> {
  return invoke<FlatNodeDto>('nodes_create', { request: payload });
}

export async function nodesUpdate(
  payload: UpdateNodePayload,
): Promise<FlatNodeDto> {
  return invoke<FlatNodeDto>('nodes_update', { request: payload });
}

export async function nodesMove(payload: MoveNodesPayload): Promise<void> {
  return invoke<void>('nodes_move', { request: payload });
}

export async function nodesDelete(payload: DeleteNodesPayload): Promise<void> {
  return invoke<void>('nodes_delete', { request: payload });
}

export async function nodesSetPinned(payload: SetPinnedPayload): Promise<void> {
  return invoke<void>('nodes_set_pinned', { request: payload });
}
