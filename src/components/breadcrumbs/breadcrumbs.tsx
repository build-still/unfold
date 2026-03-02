import { memo, useMemo } from 'react';
import { useParams } from '@tanstack/react-router';

import { BreadcrumbItem, BreadcrumbLink, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { useFileSystem } from '@/contexts/FileSystemContext';

import { BreadcrumbShell } from './breadcrumb-shell';
import { CollapsedBreadcrumbPath } from './collapsed-breadcrumb-path';
import { ExpandedBreadcrumbPath } from './expanded-breadcrumb-path';

const MAX_VISIBLE_ITEMS = 3;

export const FileBreadcrumbs = memo(function FileBreadcrumbs() {
  const { fileId } = useParams({ strict: false });
  const { activeSpaceId, spaceName, getNodePath } = useFileSystem();

  const path = useMemo(() => {
    if (!fileId) return [];
    return getNodePath(fileId);
  }, [fileId, getNodePath]);

  if (!fileId || path.length === 0) {
    return (
      <BreadcrumbShell>
        <BreadcrumbItem>
          <BreadcrumbPage className="text-foreground/75 font-normal tracking-tight">{spaceName}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbShell>
    );
  }

  const shouldCollapse = path.length > MAX_VISIBLE_ITEMS;

  return (
    <BreadcrumbShell>
      <BreadcrumbItem>
        <BreadcrumbLink asChild>
          <span
            className="text-sidebar-foreground/70 hover:text-foreground/85 transition-colors font-normal tracking-tight cursor-default"
            data-tauri-drag-region="false"
          >
            {spaceName}
          </span>
        </BreadcrumbLink>
      </BreadcrumbItem>

      {shouldCollapse ? (
        <CollapsedBreadcrumbPath path={path} activeSpaceId={activeSpaceId} />
      ) : (
        <ExpandedBreadcrumbPath path={path} activeSpaceId={activeSpaceId} />
      )}
    </BreadcrumbShell>
  );
});
