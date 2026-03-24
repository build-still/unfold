import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';

import { useSidebarStore } from '../stores/sidebar-store';
import { DND_DROP_PINNED, dragSourceId } from '../utils/dnd-ids';

import type { FlatNodeDto } from '@/api/nodes';
import {
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

type PinnedSectionProps = {
  nodes: FlatNodeDto[];
};

function PinnedRow({ node }: { node: FlatNodeDto }) {
  const isSelected = useSidebarStore((s) => s.selectedIds.has(node.id));
  const selectNode = useSidebarStore((s) => s.selectNode);

  const dragId = dragSourceId(node.id);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dragId,
  });

  const style = {
    opacity: isDragging ? 0 : undefined,
  };

  return (
    <SidebarMenuItem className="min-w-0">
      <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
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

  return (
    <>
      <SidebarGroupLabel>pinned</SidebarGroupLabel>
      <SidebarGroupContent ref={setNodeRef}>
        <SidebarMenu
          className={`flex flex-col gap-1 rounded-lg border border-transparent px-0 transition-colors ${
            isOver ? 'border-sidebar-ring bg-sidebar-accent/30' : ''
          }`}
        >
          {nodes.length === 0 ? (
            <p className="text-muted-foreground text-tiny px-2.5 py-1">
              drop notes here to pin
            </p>
          ) : (
            nodes.map((node) => <PinnedRow key={node.id} node={node} />)
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </>
  );
}
