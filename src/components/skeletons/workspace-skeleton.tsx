import { EditorSkeleton } from "@/components/editor/editor-skeleton";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const SIDEBAR_ROW_WIDTHS = [
  "w-[86%]",
  "w-[72%]",
  "w-[91%]",
  "w-[64%]",
  "w-[78%]",
  "w-[88%]",
  "w-[69%]",
] as const;

type SidebarTreeSkeletonProps = {
  rows?: number;
  className?: string;
};

export function SidebarTreeSkeleton({ rows = 8, className }: SidebarTreeSkeletonProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="px-2">
          <Skeleton className={cn("h-4 rounded-md", SIDEBAR_ROW_WIDTHS[index % SIDEBAR_ROW_WIDTHS.length])} />
        </div>
      ))}
    </div>
  );
}

export function SidebarPanelSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="px-3 pt-2">
        <div className="h-1" />
      </div>
      <div className="flex-1 overflow-hidden px-3">
        <div className="mb-3">
          <div className="px-2 py-1">
            <Skeleton className="h-3 w-12 rounded-sm" />
          </div>
          <SidebarTreeSkeleton rows={2} />
        </div>
        <div>
          <div className="px-2 py-1">
            <Skeleton className="h-3 w-10 rounded-sm" />
          </div>
          <SidebarTreeSkeleton rows={10} />
        </div>
      </div>
      <div className="border-t border-sidebar-container-border/80 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 flex-1 rounded-lg" />
          <Skeleton className="size-5 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function WorkspaceSkeleton() {
  return (
    <div
      className="h-screen w-screen bg-background"
      role="status"
      aria-live="polite"
      aria-label="Loading workspace"
    >
      <div className="flex h-svh flex-col overflow-hidden">
        <div className="h-10 shrink-0 bg-background" />

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <ShadcnSidebar
            side="left"
            variant="floating"
            collapsible="offcanvas"
            className="bg-transparent border-0 shadow-none top-10! bottom-2! h-auto! flex flex-col"
          >
            <SidebarHeader className="px-3 pt-2">
              <div className="h-1" />
            </SidebarHeader>
            <SidebarContent className="px-3 overflow-y-auto">
              <div className="mb-1">
                <div className="px-2 py-1">
                  <Skeleton className="h-3 w-12 rounded-sm" />
                </div>
                <SidebarTreeSkeleton rows={2} />
              </div>
              <div className="mt-2">
                <div className="px-2 py-1">
                  <Skeleton className="h-3 w-10 rounded-sm" />
                </div>
                <SidebarTreeSkeleton rows={10} className="pt-1.5" />
              </div>
            </SidebarContent>
            <SidebarFooter className="border-t border-sidebar-container-border/80 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 flex-1 rounded-lg" />
                <Skeleton className="size-5 rounded-md" />
              </div>
            </SidebarFooter>
          </ShadcnSidebar>

          <main className="flex-1 overflow-hidden">
            <div className="mx-auto h-full w-full max-w-5xl px-6 pt-5 pb-8">
              <EditorSkeleton />
            </div>
          </main>
        </div>

      </div>
      <span className="sr-only">Preparing workspace</span>
    </div>
  );
}
