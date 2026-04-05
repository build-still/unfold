import { FlatNode } from '@/features/sidebar/api/nodes';

export interface SidebarDragOverlayProps {
  nodes: FlatNode[];
  activeDragNodeId: string | null;
}

export const SidebarDragOverlay = ({
  nodes,
  activeDragNodeId,
}: SidebarDragOverlayProps) => {
  if (!activeDragNodeId) {
    return null;
  }

  const sourceNode = nodes.find((node) => node.id === activeDragNodeId);

  return (
    <div className="pointer-events-none w-40 max-w-60">
      <div className="text-sidebar-accent-foreground border-sidebar-border bg-sidebar-accent shadow-sidebar-shadow flex h-7 items-center gap-2 rounded-xl border px-2.5 py-1">
        <span className="truncate text-xs font-medium">
          {sourceNode?.name ?? 'moving note'}
        </span>
      </div>
    </div>
  );
};
