import { useDndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronDown, Plus } from 'lucide-react';
import * as React from 'react';

import { useSidebarStore } from '../stores/sidebar-store';
import {
  DND_DROP_NOTES_ROOT,
  dragSourceId,
  dropTargetEmptyPlaceholderId,
  dropTargetNodeId,
} from '../utils/dnd';
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
  onAddChild: (parentId: string) => Promise<void>;
};

function EmptyPlaceholderRow({
  parentId,
  depth,
  isFirstChild,
  isLastChild,
}: {
  parentId: string;
  depth: number;
  isFirstChild: boolean;
  isLastChild: boolean;
}) {
  const { setNodeRef } = useDroppable({
    id: dropTargetEmptyPlaceholderId(parentId),
  });
  const { active } = useDndContext();

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
        ref={setNodeRef}
        style={{
          paddingLeft: `calc(${depth} * var(--spacing-space-sidebar-indent))`,
        }}
        className={active ? 'cursor-default' : 'cursor-pointer'}
      >
        <div className="flex h-7 items-center px-2.5">
          <span className="text-muted-foreground text-tiny truncate">
            no sub notes
          </span>
        </div>
      </div>
    </SidebarMenuItem>
  );
}

function NodeVirtualRow({
  row,
  isFirstChild,
  isLastChild,
  onAddChild,
}: {
  row: Extract<FlatVisibleRow, { kind: FlatVisibleRowKind.node }>;
  isFirstChild: boolean;
  isLastChild: boolean;
  onAddChild: (parentId: string) => Promise<void>;
}) {
  const isExpanded = useSidebarStore((s) => s.expandedIds.has(row.id));
  const isSelected = useSidebarStore((s) => s.selectedIds.has(row.id));
  const toggleExpand = useSidebarStore((s) => s.toggleExpand);
  const selectNode = useSidebarStore((s) => s.selectNode);
  const { active } = useDndContext();

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
        className={active ? 'cursor-default' : 'cursor-pointer'}
        {...listeners}
        {...attributes}
      >
        <SidebarMenuButton
          isActive={isSelected}
          variant="default"
          size="sm"
          className={cn(
            active ? 'cursor-default' : 'cursor-pointer',
            'pr-14',
            !active &&
              'group-hover/menu-item:bg-sidebar-accent group-hover/menu-item:text-sidebar-accent-foreground',
            isOver && 'ring-sidebar-border ring-1',
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
                className={cn('text-sidebar-foreground')}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void onAddChild(row.id);
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
                className={cn('text-sidebar-foreground')}
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
  onAddChild,
}: {
  row: FlatVisibleRow;
  isFirstChild: boolean;
  isLastChild: boolean;
  onAddChild: (parentId: string) => Promise<void>;
}) {
  if (row.kind === 'empty') {
    return (
      <EmptyPlaceholderRow
        parentId={row.parentId}
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
      onAddChild={onAddChild}
    />
  );
}

export function NotesTreeVirtual({
  parentRef,
  flatRows,
  onAddChild,
}: NotesTreeVirtualProps) {
  const virtualizer = useVirtualizer({
    count: flatRows.length,
    getScrollElement: () => parentRef.current,
    // h-7 row (~28px) + pb-1 on the virtual row wrapper (~4px); SidebarMenu is gap-0
    estimateSize: () => 32,
    overscan: 8,
  });

  const { setNodeRef: setNotesRootDropRef, isOver: isOverNotesRoot } =
    useDroppable({
      id: DND_DROP_NOTES_ROOT,
    });
  const { active } = useDndContext();

  const setScrollAndDropRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      setNotesRootDropRef(node);
      parentRef.current = node;
    },
    [setNotesRootDropRef, parentRef],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <SidebarGroupLabel>notes</SidebarGroupLabel>

      <div
        ref={setScrollAndDropRef}
        className={cn(
          'sidebar-scrollbar min-h-48 w-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain rounded-lg border border-dashed border-transparent transition-colors',
          active ? 'cursor-default' : 'cursor-pointer',
          isOverNotesRoot &&
            'border-sidebar-border bg-sidebar-accent/20 dark:border-sidebar-foreground/22',
        )}
      >
        {flatRows.length === 0 ? (
          <p className="text-muted-foreground text-tiny px-2.5 py-2">
            nothing here yet
          </p>
        ) : (
          <SidebarMenu
            className="relative w-full"
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
                <div
                  key={vItem.key}
                  className="absolute top-0 left-0 w-full pb-1"
                  style={{
                    transform: `translateY(${vItem.start}px)`,
                  }}
                  data-index={vItem.index}
                  ref={virtualizer.measureElement}
                >
                  <VirtualRow
                    row={row}
                    isFirstChild={isFirstChild}
                    isLastChild={isLastChild}
                    onAddChild={onAddChild}
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
