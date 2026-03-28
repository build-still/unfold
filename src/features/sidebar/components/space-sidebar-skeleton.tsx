import { Skeleton } from '@/components/ui/skeleton';

export const SpaceSidebarSkeleton = () => {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-2 p-3">
        <Skeleton className="h-3 w-10" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="flex flex-col gap-2 p-2">
        <div className="h-2 w-full" />
        <Skeleton className="h-3 w-10" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
    </div>
  );
};
