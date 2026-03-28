import { useDndContext, useDraggable, useDroppable } from '@dnd-kit/core';

import { useSidebarStore } from '../stores/sidebar-store';
import { DND_DROP_PINNED, dragSourceId } from '../utils/dnd';

import type { FlatNodeDto } from '@/api/nodes';
import {
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { cn } from '@/utils/tailwind';

type PinnedSectionProps = {
  nodes: FlatNodeDto[];
};

function PinnedRow({ node }: { node: FlatNodeDto }) {
  const isSelected = useSidebarStore((s) => s.selectedIds.has(node.id));
  const selectNode = useSidebarStore((s) => s.selectNode);
  const { active } = useDndContext();

  const dragId = dragSourceId(node.id);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dragId,
  });

  const style = {
    opacity: isDragging ? 0 : undefined,
  };

  const rowCursor = active ? 'cursor-default' : 'cursor-pointer';

  return (
    <SidebarMenuItem className="min-w-0">
      <div
        ref={setNodeRef}
        style={style}
        className={rowCursor}
        {...listeners}
        {...attributes}
      >
        <SidebarMenuButton
          isActive={isSelected}
          variant="default"
          size="sm"
          className="cursor-pointer"
          onClick={(e) => selectNode(e, node.id)}
        >
          <span className="truncate text-xs">{node.name}</span>
        </SidebarMenuButton>
      </div>
    </SidebarMenuItem>
  );
}

export function PinnedSection({ nodes }: PinnedSectionProps) {
  const { setNodeRef, isOver } = useDroppable({ id: DND_DROP_PINNED });
  const { active } = useDndContext();

  const zoneCursor = active ? 'cursor-default' : 'cursor-pointer';

  return (
    <>
      <SidebarGroupLabel>pinned</SidebarGroupLabel>
      <SidebarGroupContent>
        <div
          ref={setNodeRef}
          className={cn(
            'rounded-lg border border-dashed border-transparent transition-colors',
            isOver &&
              'border-sidebar-border bg-sidebar-accent/30 dark:border-sidebar-foreground/22',
            zoneCursor,
          )}
        >
          <SidebarMenu className={cn('flex flex-col gap-1 px-0', zoneCursor)}>
            {nodes.length === 0 ? (
              <p
                className={cn(
                  'text-muted-foreground text-tiny px-2.5 py-1',
                  zoneCursor,
                )}
              >
                drop notes here to pin
              </p>
            ) : (
              nodes.map((node) => <PinnedRow key={node.id} node={node} />)
            )}
          </SidebarMenu>
        </div>
      </SidebarGroupContent>
    </>
  );
}
