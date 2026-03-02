import { useNavigate } from '@tanstack/react-router';

import {
  BreadcrumbEllipsis,
  BreadcrumbItem,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/tiptap-utils';

import type { BreadcrumbNode } from './breadcrumb-types';

interface BreadcrumbOverflowMenuProps {
  hiddenNodes: BreadcrumbNode[];
  activeSpaceId: string;
}

export function BreadcrumbOverflowMenu({ hiddenNodes, activeSpaceId }: BreadcrumbOverflowMenuProps) {
  const navigate = useNavigate();

  return (
    <BreadcrumbItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              'inline-flex items-center justify-center gap-1 rounded-md px-1 py-0 transition-colors leading-tight',
              'bg-transparent hover:bg-sidebar-item-hover-bg/40',
              'text-sidebar-foreground/70 hover:text-foreground',
              'outline-none focus-visible:outline-[1px] focus-visible:outline-foreground/15',
            )}
            data-tauri-drag-region="false"
          >
            <BreadcrumbEllipsis className="size-3.5! shrink-0" />
            <span className="sr-only">toggle menu</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="bg-sidebar-container-bg border border-sidebar-container-border/80 breadcrumbs-text"
        >
          {hiddenNodes.map((node) => (
            <DropdownMenuItem
              key={node.id}
              onClick={() =>
                navigate({
                  to: '/spaces/$spaceId/files/$fileId',
                  params: { spaceId: activeSpaceId, fileId: node.id },
                })
              }
            >
              {node.name || 'new page'}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </BreadcrumbItem>
  );
}
