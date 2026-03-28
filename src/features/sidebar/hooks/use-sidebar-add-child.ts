import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { nodeQueryKeys } from '../api/query-keys';
import { useCreateNodeMutation } from '../api/use-nodes';
import { useSidebarStore } from '../stores/sidebar-store';
import { pushSidebarTreeUndo } from '../stores/sidebar-tree-undo-store';

import { nodesDelete } from '@/api/nodes';
import type { FlatNodeDto } from '@/api/nodes';

export function useSidebarAddChild(spaceId: string) {
  const qc = useQueryClient();
  const createMut = useCreateNodeMutation();
  const toggleExpand = useSidebarStore((s) => s.toggleExpand);

  return useCallback(
    async (parentId: string) => {
      const before = qc.getQueryData<FlatNodeDto[]>(
        nodeQueryKeys.space(spaceId),
      );
      try {
        await createMut.mutateAsync({
          spaceId,
          parentId,
          name: 'new page',
        });
        if (before) {
          pushSidebarTreeUndo(async () => {
            const created = qc.getQueryData<FlatNodeDto[]>(
              nodeQueryKeys.space(spaceId),
            );
            const newest = created?.find(
              (n) => !before.some((b) => b.id === n.id),
            );
            if (newest) {
              await nodesDelete({ spaceId, nodeIds: [newest.id] });
              await qc.invalidateQueries({
                queryKey: nodeQueryKeys.space(spaceId),
              });
            }
          });
        }
        toggleExpand(parentId, true);
      } catch (e) {
        console.error(e);
      }
    },
    [createMut, qc, spaceId, toggleExpand],
  );
}
