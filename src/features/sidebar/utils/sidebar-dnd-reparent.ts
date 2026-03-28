import type { QueryClient } from '@tanstack/react-query';

import { nodeQueryKeys } from '../api/query-keys';
import { pushSidebarTreeUndo } from '../stores/sidebar-tree-undo-store';

import { nodesMove, nodesSetPinned } from '@/api/nodes';
import type { FlatNodeDto } from '@/api/nodes';

type MutateMove = (args: {
  spaceId: string;
  nodeIds: string[];
  newParentId: string | null;
  insertBeforeId: string | null;
}) => Promise<void>;

type MutatePin = (args: {
  spaceId: string;
  nodeIds: string[];
  isPinned: boolean;
}) => Promise<void>;

/** Unpin, move under `newParentId` (or root if `null`), register undo from `before` snapshot. */
export async function reparentNodesWithUndo({
  spaceId,
  moving,
  newParentId,
  before,
  moveMut,
  pinMut,
  qc,
}: {
  spaceId: string;
  moving: string[];
  newParentId: string | null;
  before: FlatNodeDto[] | undefined;
  moveMut: { mutateAsync: MutateMove };
  pinMut: { mutateAsync: MutatePin };
  qc: QueryClient;
}): Promise<boolean> {
  if (!before) return false;

  const prevById = new Map(before.map((n) => [n.id, n]));

  await pinMut.mutateAsync({
    spaceId,
    nodeIds: moving,
    isPinned: false,
  });
  await moveMut.mutateAsync({
    spaceId,
    nodeIds: moving,
    newParentId,
    insertBeforeId: null,
  });

  pushSidebarTreeUndo(async () => {
    for (const id of moving) {
      const row = prevById.get(id);
      if (!row) continue;
      await nodesSetPinned({
        spaceId,
        nodeIds: [id],
        isPinned: row.isPinned,
      });
      await nodesMove({
        spaceId,
        nodeIds: [id],
        newParentId: row.parentId,
        insertBeforeId: null,
      });
    }
    await qc.invalidateQueries({
      queryKey: nodeQueryKeys.space(spaceId),
    });
  });

  return true;
}
