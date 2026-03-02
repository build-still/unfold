import { Link } from '@tanstack/react-router';

import { BreadcrumbItem, BreadcrumbLink, BreadcrumbPage } from '@/components/ui/breadcrumb';

interface BreadcrumbItemLinkProps {
  spaceId: string;
  fileId: string;
  label: string;
  isCurrent?: boolean;
}

export function BreadcrumbItemLink({
  spaceId,
  fileId,
  label,
  isCurrent = false,
}: BreadcrumbItemLinkProps) {
  if (isCurrent) {
    return (
      <BreadcrumbItem>
        <BreadcrumbPage className="text-foreground/90 font-normal tracking-tight">{label}</BreadcrumbPage>
      </BreadcrumbItem>
    );
  }

  return (
    <BreadcrumbItem>
      <BreadcrumbLink asChild>
        <Link
          to="/spaces/$spaceId/files/$fileId"
          params={{ spaceId, fileId }}
          className="text-sidebar-foreground/65 hover:text-foreground/90 transition-colors font-normal"
          data-tauri-drag-region="false"
        >
          {label}
        </Link>
      </BreadcrumbLink>
    </BreadcrumbItem>
  );
}
