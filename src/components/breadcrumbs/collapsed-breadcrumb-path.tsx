import { Link } from '@tanstack/react-router';

import { BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';

import { BreadcrumbOverflowMenu } from './breadcrumb-overflow-menu';
import type { BreadcrumbNode } from './breadcrumb-types';

interface CollapsedBreadcrumbPathProps {
  path: BreadcrumbNode[];
  activeSpaceId: string;
}

export function CollapsedBreadcrumbPath({ path, activeSpaceId }: CollapsedBreadcrumbPathProps) {
  const firstNode = path[0];
  const currentNode = path[path.length - 1];
  const hiddenNodes = path.slice(1, path.length - 1);

  return (
    <>
      <BreadcrumbSeparator className="text-sidebar-foreground/40 [&>svg]:size-3" />
      <BreadcrumbItem>
        <BreadcrumbLink asChild>
          <Link
            to="/spaces/$spaceId/files/$fileId"
            params={{ spaceId: activeSpaceId, fileId: firstNode.id }}
            className="text-sidebar-foreground/65 hover:text-foreground/85 transition-colors font-normal"
            data-tauri-drag-region="false"
          >
            {firstNode.name || 'new page'}
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>

      <BreadcrumbSeparator className="text-sidebar-foreground/40 [&>svg]:size-3" />
      <BreadcrumbOverflowMenu hiddenNodes={hiddenNodes} activeSpaceId={activeSpaceId} />

      <BreadcrumbSeparator className="text-sidebar-foreground/40 [&>svg]:size-3" />
      <BreadcrumbItem>
        <BreadcrumbPage className="text-foreground/80 font-normal tracking-tight">{currentNode.name || 'new page'}</BreadcrumbPage>
      </BreadcrumbItem>
    </>
  );
}
