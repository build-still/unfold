import { Fragment } from 'react';

import { BreadcrumbSeparator } from '@/components/ui/breadcrumb';

import { BreadcrumbItemLink } from './breadcrumb-item-link';
import type { BreadcrumbNode } from './breadcrumb-types';

interface ExpandedBreadcrumbPathProps {
  path: BreadcrumbNode[];
  activeSpaceId: string;
}

export function ExpandedBreadcrumbPath({ path, activeSpaceId }: ExpandedBreadcrumbPathProps) {
  return (
    <>
      {path.map((node, index) => {
        const isLast = index === path.length - 1;
        return (
          <Fragment key={node.id}>
            <BreadcrumbSeparator className="text-sidebar-foreground/40 [&>svg]:size-3" />
            <BreadcrumbItemLink
              spaceId={activeSpaceId}
              fileId={node.id}
              label={node.name || 'new page'}
              isCurrent={isLast}
            />
          </Fragment>
        );
      })}
    </>
  );
}
