import { useDroppable } from '@dnd-kit/react';

import { useSidebarUndoActions } from '../hooks/use-sidebar-undo-actions';
import { useSidebarStore } from '../stores/sidebar-store';

import { FlatNode } from '@/api/nodes';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { SidebarContextMenuShortcuts } from '@/config/sidebar';
import { DROPPABLE_PINNED_SECTION_ID } from '@/features/sidebar/utils/dnd';
import { cn } from '@/utils/tailwind';

interface PinnedSectionProps {
  pinnedNodes: FlatNode[];
  expandParentNodes: (nodeId: string) => void;
}

export const PinnedSection = ({
  pinnedNodes,
  expandParentNodes,
}: PinnedSectionProps) => {
  // mutations
  const { setPinnedWithUndo } = useSidebarUndoActions();

  // dnd root target
  const { isDropTarget, ref } = useDroppable({
    id: DROPPABLE_PINNED_SECTION_ID,
  });

  // active selection
  const currentlyActiveNodeId = useSidebarStore((s) => s.activeNodeId);
  const setActiveNodeId = useSidebarStore((s) => s.setActiveNodeId);

  return (
    <SidebarGroupContent>
      <div
        ref={ref}
        className={cn(
          isDropTarget
            ? 'border-muted-foreground-heavy/40 bg-sidebar-accent/10 border border-dashed'
            : 'border border-transparent',
          'overflow-hidden rounded-2xl p-1',
        )}
      >
        <SidebarMenu className="w-full gap-1">
          {pinnedNodes.map((node) => (
            <SidebarMenuItem key={node.id}>
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  <SidebarMenuButton
                    variant="outline"
                    size="sm"
                    isActive={currentlyActiveNodeId === node.id}
                    className="w-full focus-visible:ring-transparent"
                    onClick={() => {
                      setActiveNodeId(node.id);
                      expandParentNodes(node.id);
                    }}
                  >
                    <span className="min-w-0 truncate text-xs">
                      {node.name}
                    </span>
                  </SidebarMenuButton>
                </ContextMenuTrigger>

                <ContextMenuContent>
                  <ContextMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      void setPinnedWithUndo({
                        spaceId: node.spaceId,
                        nodeIds: [node.id],
                        isPinned: false,
                      });
                    }}
                  >
                    unpin
                    <ContextMenuShortcut>
                      {SidebarContextMenuShortcuts.pinned.unpin}
                    </ContextMenuShortcut>
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </div>
    </SidebarGroupContent>
  );
};
