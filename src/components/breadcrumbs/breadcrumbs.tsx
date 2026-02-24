import React, { useMemo, memo } from 'react';
import { useParams, useNavigate, Link } from '@tanstack/react-router';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useFileSystem } from '@/contexts/FileSystemContext';
import { cn } from '@/lib/tiptap-utils';

const MAX_VISIBLE_ITEMS = 3; 

export const FileBreadcrumbs = memo(function FileBreadcrumbs() {
  const { fileId } = useParams({ strict: false });
  const { activeSpaceId, spaceName, getNodePath } = useFileSystem();
  const navigate = useNavigate();

  const path = useMemo(() => {
    if (!fileId) return [];
    return getNodePath(fileId);
  }, [fileId, getNodePath]);

  if (!fileId || path.length === 0) {
    return (
      <Breadcrumb className="w-full" data-tauri-drag-region>
        <div className="inline-flex items-center gap-2 rounded-xl bg-sidebar-item-hover-bg/80 px-3 py-1 shadow-breadcrumb backdrop-blur-lg text-sidebar-foreground border border-border-elevated">
          <BreadcrumbList className="breadcrumbs-text text-sidebar-foreground flex items-center gap-2 font-normal leading-tight whitespace-nowrap">
            <BreadcrumbItem>
              <BreadcrumbPage className="text-foreground/75 font-normal tracking-tight">
                {spaceName}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </div>
      </Breadcrumb>
    );
  }

  const shouldCollapse = path.length > MAX_VISIBLE_ITEMS;

  return (
    <Breadcrumb className="w-full" data-tauri-drag-region>
      <div className="inline-flex items-center gap-2 rounded-xl bg-sidebar-item-hover-bg/80 px-3 py-1 shadow-breadcrumb backdrop-blur-lg text-sidebar-foreground border border-border-elevated">
        <BreadcrumbList className="breadcrumbs-text text-sidebar-foreground flex items-center gap-2 font-normal leading-tight whitespace-nowrap ">
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
            <>
              <React.Fragment key={path[0].id}>
                <BreadcrumbSeparator className="text-sidebar-foreground/40 [&>svg]:size-3" />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link
                      to="/spaces/$spaceId/files/$fileId"
                      params={{ spaceId: activeSpaceId, fileId: path[0].id }}
                    className="text-sidebar-foreground/65 hover:text-foreground/85 transition-colors font-normal"
                    data-tauri-drag-region="false"
                    >
                      {path[0].name || "new page"}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </React.Fragment>
              
              <BreadcrumbSeparator className="text-sidebar-foreground/40 [&>svg]:size-3" />
              <BreadcrumbItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        'inline-flex items-center justify-center gap-1 rounded-md px-1 py-0 transition-colors leading-tight',
                        'bg-transparent hover:bg-sidebar-item-hover-bg/40',
                        'text-sidebar-foreground/70 hover:text-foreground',
                        'outline-none focus-visible:outline-[1px] focus-visible:outline-foreground/15'
                      )}
                      data-tauri-drag-region="false"
                    >
                      <BreadcrumbEllipsis className="size-3.5! shrink-0" />
                      <span className="sr-only">Toggle menu</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-sidebar-container-bg border border-sidebar-container-border/80 breadcrumbs-text">
                    {path.slice(1, path.length - 1).map((node) => (
                      <DropdownMenuItem
                        key={node.id}
                        onClick={() => navigate({
                          to: '/spaces/$spaceId/files/$fileId',
                          params: { spaceId: activeSpaceId, fileId: node.id },
                        })}
                      >
                        {node.name || "new page"}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </BreadcrumbItem>
              
              <React.Fragment key={path[path.length - 1].id}>
                <BreadcrumbSeparator className="text-sidebar-foreground/40 [&>svg]:size-3" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-foreground/80 font-normal tracking-tight">
                    {path[path.length - 1].name || "new page"}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </React.Fragment>
            </>
          ) : (
            <>
              {path.map((node, index) => {
                const isLast = index === path.length - 1;
                
                return (
                  <React.Fragment key={node.id}>
                    <BreadcrumbSeparator className="text-sidebar-foreground/40 [&>svg]:size-3" />
                      {isLast ? (
                        <BreadcrumbItem>
                          <BreadcrumbPage className="text-foreground/90 font-normal tracking-tight">
                            {node.name || "new page"}
                          </BreadcrumbPage>
                        </BreadcrumbItem>
                      ) : (
                      <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                          <Link
                            to="/spaces/$spaceId/files/$fileId"
                            params={{ spaceId: activeSpaceId, fileId: node.id }}
                            className="text-sidebar-foreground/65 hover:text-foreground/90 transition-colors font-normal"
                            data-tauri-drag-region="false"
                          >
                            {node.name || "new page"}
                          </Link>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                    )}
                  </React.Fragment>
                );
              })}
            </>
          )}
        </BreadcrumbList>
      </div>
    </Breadcrumb>
  );
});
