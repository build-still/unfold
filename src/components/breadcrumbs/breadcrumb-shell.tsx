import type { PropsWithChildren } from 'react';

import { Breadcrumb, BreadcrumbList } from '@/components/ui/breadcrumb';

export function BreadcrumbShell({ children }: PropsWithChildren) {
  return (
    <Breadcrumb className="w-full" data-tauri-drag-region>
      <div className="inline-flex items-center gap-2 rounded-xl bg-sidebar-item-hover-bg/80 px-3 py-1 shadow-breadcrumb backdrop-blur-lg text-sidebar-foreground border border-border-elevated">
        <BreadcrumbList className="breadcrumbs-text text-sidebar-foreground flex items-center gap-2 font-normal leading-tight whitespace-nowrap">
          {children}
        </BreadcrumbList>
      </div>
    </Breadcrumb>
  );
}
