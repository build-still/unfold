import { useDroppable } from '@dnd-kit/react';

import { NotesGroup } from './notes-group';

import { SidebarGroupContent, SidebarMenu } from '@/components/ui/sidebar';
import { FlatNode } from '@/features/sidebar/api/nodes';
import { DROPPABLE_NOTES_SECTION_ID } from '@/features/sidebar/utils/dnd';
import { groupNodesByParent } from '@/features/sidebar/utils/node-tree';
import { cn } from '@/utils/tailwind';

export interface NotesSectionProps {
  nodes: FlatNode[];
  expandParentNodes: (nodeId: string) => void;
  isDraggingInNotesArea: boolean;
}

export const NotesSection = ({
  nodes,
  expandParentNodes,
  isDraggingInNotesArea,
}: NotesSectionProps) => {
  // hierarchy
  const parentNodesMap = groupNodesByParent(nodes);
  const rootNodes = parentNodesMap.get(null) ?? [];

  // dnd root target
  const { isDropTarget, ref } = useDroppable({
    id: DROPPABLE_NOTES_SECTION_ID,
  });

  return (
    <SidebarGroupContent className="h-full min-h-0">
      <div
        ref={ref}
        className={cn(
          isDropTarget || isDraggingInNotesArea
            ? 'border-muted-foreground-heavy/30 bg-sidebar-accent/20 border border-dashed'
            : 'border border-transparent',
          'box-border h-full min-h-0 rounded-2xl p-1 outline-none',
        )}
      >
        <div className="h-full min-h-0 overflow-x-hidden overflow-y-auto outline-none">
          <SidebarMenu className="w-full gap-1">
            {rootNodes.map((node) => (
              <NotesGroup
                key={node.id}
                node={node}
                nodesByParent={parentNodesMap}
                expandParentNodes={expandParentNodes}
              />
            ))}
          </SidebarMenu>
        </div>
      </div>
    </SidebarGroupContent>
  );
};
