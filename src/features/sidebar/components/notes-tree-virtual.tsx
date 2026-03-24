import { useDraggable, useDroppable } from '@dnd-kit/core';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronDown, Plus } from 'lucide-react';
import * as React from 'react';

import { useSidebarStore } from '../stores/sidebar-store';
import {
  DND_DROP_NOTES_ROOT,
  dragSourceId,
  dropTargetNodeId,
} from '../utils/dnd-ids';
import type {
  FlatVisibleRow,
  FlatVisibleRowKind,
} from '../utils/flatten-visible-tree';

import { Button } from '@/components/ui/button';
import {
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/utils/tailwind';

type NotesTreeVirtualProps = {
  parentRef: React.RefObject<HTMLDivElement | null>;
  flatRows: FlatVisibleRow[];
};

function EmptyPlaceholderRow({
  depth,
  isFirstChild,
  isLastChild,
}: {
  depth: number;
  isFirstChild: boolean;
  isLastChild: boolean;
}) {
  return (
    <SidebarMenuItem className="min-w-0">
      {depth > 0 && (
        <div
          className="border-sidebar-border pointer-events-none absolute"
          style={{
            top: isFirstChild ? '3px' : '-4px',
            bottom: isLastChild ? '-4px' : '-4px',
            left: `calc((${depth} - 1) * var(--spacing-space-sidebar-indent) + .9rem)`,
            borderLeftWidth: '1.5px',
            borderLeftStyle: 'solid',
          }}
        />
      )}
      <div
        className="pointer-events-none"
        style={{
          paddingLeft: `calc(${depth} * var(--spacing-space-sidebar-indent))`,
        }}
      >
        <div className="flex h-7 items-center px-2.5">
          <span className="text-muted-foreground text-tiny">no sub notes</span>
        </div>
      </div>
    </SidebarMenuItem>
  );
}

function NodeVirtualRow({
  row,
  isFirstChild,
  isLastChild,
}: {
  row: Extract<FlatVisibleRow, { kind: FlatVisibleRowKind.node }>;
  isFirstChild: boolean;
  isLastChild: boolean;
}) {
  const isExpanded = useSidebarStore((s) => s.expandedIds.has(row.id));
  const isSelected = useSidebarStore((s) => s.selectedIds.has(row.id));
  const toggleExpand = useSidebarStore((s) => s.toggleExpand);
  const selectNode = useSidebarStore((s) => s.selectNode);
  const onAddChild = useSidebarStore((s) => s.onAddChild);

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({ id: dragSourceId(row.id) });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: dropTargetNodeId(row.id),
  });

  const setRef = React.useCallback(
    (node: HTMLElement | null) => {
      setDragRef(node);
      setDropRef(node);
    },
    [setDragRef, setDropRef],
  );

  return (
    <SidebarMenuItem className="min-w-0">
      {row.depth > 0 && (
        <div
          className="border-sidebar-border pointer-events-none absolute"
          style={{
            top: isFirstChild ? '1.5px' : '-4px',
            bottom: isLastChild ? '-1.5px' : '-4px',
            left: `calc((${row.depth} - 1) * var(--spacing-space-sidebar-indent) + .9rem)`,
            borderLeftWidth: '1.5px',
            borderLeftStyle: 'solid',
          }}
        />
      )}

      <div
        ref={setRef}
        style={{
          transform: transform
            ? `translate3d(0, ${transform.y}px, 0)`
            : undefined,
          opacity: isDragging ? 0 : undefined,
          paddingLeft: `calc(${row.depth} * var(--spacing-space-sidebar-indent) + 0.1rem)`,
        }}
        {...listeners}
        {...attributes}
      >
        <SidebarMenuButton
          isActive={isSelected}
          variant="default"
          size="sm"
          className={cn(
            'cursor-pointer pr-14',
            'group-hover/menu-item:bg-sidebar-accent group-hover/menu-item:text-sidebar-accent-foreground',
            isOver && 'ring-sidebar-ring ring-1',
          )}
          onClick={(e) => selectNode(e, row.id)}
        >
          <span className="truncate text-xs">{row.title}</span>
        </SidebarMenuButton>

        <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center gap-0.5 opacity-0 transition-opacity group-hover/menu-item:pointer-events-auto group-hover/menu-item:opacity-100">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="icon"
                size="icon-xs"
                className="text-sidebar-foreground cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void onAddChild?.(row.id);
                }}
              >
                <Plus size={11} strokeWidth={3} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Add child</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="icon"
                size="icon-xs"
                aria-expanded={isExpanded}
                className="text-sidebar-foreground cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleExpand(row.id, !isExpanded);
                }}
              >
                <ChevronDown
                  size={12}
                  strokeWidth={3}
                  className={cn(
                    'transition-transform',
                    !isExpanded && '-rotate-90',
                  )}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {isExpanded ? 'Collapse' : 'Expand'}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </SidebarMenuItem>
  );
}

function VirtualRow({
  row,
  isFirstChild,
  isLastChild,
}: {
  row: FlatVisibleRow;
  isFirstChild: boolean;
  isLastChild: boolean;
}) {
  if (row.kind === 'empty') {
    return (
      <EmptyPlaceholderRow
        depth={row.depth}
        isFirstChild={isFirstChild}
        isLastChild={isLastChild}
      />
    );
  }

  return (
    <NodeVirtualRow
      row={row}
      isFirstChild={isFirstChild}
      isLastChild={isLastChild}
    />
  );
}

export function NotesTreeVirtual({
  parentRef,
  flatRows,
}: NotesTreeVirtualProps) {
  const virtualizer = useVirtualizer({
    count: flatRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 8,
  });

  const { setNodeRef: setNotesRootDropRef, isOver: isOverNotesRoot } =
    useDroppable({
      id: DND_DROP_NOTES_ROOT,
    });

  return (
    <div
      ref={setNotesRootDropRef}
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-2 rounded-lg border border-transparent transition-colors',
        isOverNotesRoot && 'border-sidebar-ring bg-sidebar-accent/20',
      )}
    >
      <SidebarGroupLabel>notes</SidebarGroupLabel>

      <div
        ref={parentRef}
        className="min-h-48 w-full min-w-0 flex-1"
        style={{ scrollbarGutter: 'stable' }}
      >
        {flatRows.length === 0 ? (
          <p className="text-muted-foreground text-tiny px-2.5 py-2">
            nothing here yet
          </p>
        ) : (
          <SidebarMenu
            className="relative flex flex-col gap-1"
            style={{ height: `${virtualizer.getTotalSize()}px` }}
          >
            {virtualizer.getVirtualItems().map((vItem) => {
              const row = flatRows[vItem.index];
              if (!row) return null;

              const prevRow =
                vItem.index > 0 ? flatRows[vItem.index - 1] : null;
              const nextRow =
                vItem.index < flatRows.length - 1
                  ? flatRows[vItem.index + 1]
                  : null;

              const isFirstChild = !prevRow || prevRow.depth < row.depth;
              const isLastChild = !nextRow || nextRow.depth < row.depth;

              return (
                <div key={row.id} className="w-full">
                  <VirtualRow
                    row={row}
                    isFirstChild={isFirstChild}
                    isLastChild={isLastChild}
                  />
                </div>
              );
            })}
          </SidebarMenu>
        )}
      </div>
    </div>
  );
}
