import { useDraggable, useDroppable } from '@dnd-kit/react';
import { ChevronRight, Plus } from 'lucide-react';

import { useSidebarUndoActions } from '../hooks/use-sidebar-undo-actions';
import { useSidebarStore } from '../stores/sidebar-store';

import { NoSubNotes } from './no-sub-notes';

import { FlatNode } from '@/api/nodes';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SidebarContextMenuShortcuts } from '@/config/sidebar';
import { cn } from '@/utils/tailwind';

export interface NotesGroupProps {
  node: FlatNode;
  nodesByParent: Map<string | null, FlatNode[]>;
  expandParentNodes: (nodeId: string) => void;
}

export const NotesGroup = ({
  node,
  nodesByParent,
  expandParentNodes,
}: NotesGroupProps) => {
  const children = nodesByParent.get(node.id) ?? [];
  const spaceId = node.spaceId;

  // state
  const isExpanded = useSidebarStore((store) => store.expandedIds.has(node.id));
  const toggleExpand = useSidebarStore((store) => store.toggleExpand);
  const isActive = useSidebarStore((store) => store.activeNodeId === node.id);
  const setActiveNodeId = useSidebarStore((store) => store.setActiveNodeId);

  // mutations
  const { createNodeWithUndo, deleteNodesWithUndo, setPinnedWithUndo } =
    useSidebarUndoActions();

  // dnd bindings
  const { ref, handleRef, isDragging } = useDraggable({
    id: node.id,
    type: 'item',
  });
  const { ref: droppableRef } = useDroppable({ id: node.id });

  const rowContent = (
    <div
      ref={(element) => {
        ref(element);
        handleRef(element);
        droppableRef(element);
      }}
      data-sidebar-dnd-dragging={isDragging}
      className="group/note-row flex w-full items-center gap-1"
      onClick={() => {
        setActiveNodeId(node.id);
        expandParentNodes(node.id);
      }}
    >
      <span className="min-w-0 flex-1 truncate text-xs">{node.name}</span>

      <span className="pointer-events-none ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover/note-row:pointer-events-auto group-hover/note-row:opacity-100">
        <Tooltip disableHoverableContent>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="text-sidebar-foreground hover:text-sidebar-accent-foreground flex h-5 w-5 cursor-pointer items-center justify-center rounded-sm"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();

                void createNodeWithUndo({
                  spaceId,
                  parentId: node.id,
                  name: 'new page',
                });

                if (!isExpanded) {
                  toggleExpand(node.id, true);
                }
              }}
            >
              <Plus size={10} strokeWidth={3} />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="bg-sidebar text-sidebar-foreground border-sidebar-border"
          >
            add child
          </TooltipContent>
        </Tooltip>

        <Tooltip disableHoverableContent>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="text-sidebar-foreground hover:text-sidebar-accent-foreground flex h-5 w-5 cursor-pointer items-center justify-center rounded-sm"
              onClick={(event) => {
                event.stopPropagation();
                toggleExpand(node.id, !isExpanded);
              }}
            >
              <ChevronRight
                size={12}
                strokeWidth={3}
                className={cn(
                  'transition-transform duration-200',
                  isExpanded && 'rotate-90',
                )}
              />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="bg-sidebar text-sidebar-foreground border-sidebar-border"
          >
            {isExpanded ? 'collapse' : 'expand'}
          </TooltipContent>
        </Tooltip>
      </span>
    </div>
  );

  return (
    <SidebarMenuItem className="w-full">
      <div className="w-full">
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <SidebarMenuButton
              asChild
              variant="outline"
              size="sm"
              isActive={isActive}
              className="w-full"
            >
              {rowContent}
            </SidebarMenuButton>
          </ContextMenuTrigger>

          <ContextMenuContent>
            <ContextMenuItem
              onSelect={(event) => {
                event.preventDefault();
                void setPinnedWithUndo({
                  spaceId: node.spaceId,
                  nodeIds: [node.id],
                  isPinned: !node.isPinned,
                });
              }}
            >
              {node.isPinned ? 'unpin' : 'pin'}
              <ContextMenuShortcut>
                {SidebarContextMenuShortcuts.notes.pin}
              </ContextMenuShortcut>
            </ContextMenuItem>

            <ContextMenuItem
              onSelect={(event) => {
                event.preventDefault();
                void createNodeWithUndo({
                  spaceId,
                  parentId: node.id,
                  name: 'new page',
                });

                if (!isExpanded) {
                  toggleExpand(node.id, true);
                }
              }}
            >
              add child
              <ContextMenuShortcut>
                {SidebarContextMenuShortcuts.notes.add_child}
              </ContextMenuShortcut>
            </ContextMenuItem>

            <ContextMenuItem
              variant="destructive"
              onSelect={(event) => {
                event.preventDefault();
                void deleteNodesWithUndo({
                  spaceId: node.spaceId,
                  nodeIds: [node.id],
                });
              }}
            >
              delete
              <ContextMenuShortcut variant="destructive">
                {SidebarContextMenuShortcuts.notes.delete}
              </ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </div>

      {isExpanded ? (
        children.length > 0 ? (
          <SidebarMenuSub className="mt-1 gap-1">
            {children.map((child) => (
              <NotesGroup
                key={child.id}
                node={child}
                nodesByParent={nodesByParent}
                expandParentNodes={expandParentNodes}
              />
            ))}
          </SidebarMenuSub>
        ) : (
          <SidebarMenuSub className="mt-1 gap-1">
            <SidebarMenuItem className="w-full">
              <NoSubNotes />
            </SidebarMenuItem>
          </SidebarMenuSub>
        )
      ) : null}
    </SidebarMenuItem>
  );
};
