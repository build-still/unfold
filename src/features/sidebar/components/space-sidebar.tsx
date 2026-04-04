import { Suspense, useEffect, useRef } from 'react';

import { SpaceSidebarContent } from './space-sidebar-content';
import { SpaceSidebarSkeleton } from './space-sidebar-skeleton';

import { useSpaceStore } from '@/components/store/space.store';
import { Sidebar } from '@/components/ui/sidebar';
import { DEFAULT_SPACE_ID } from '@/config/spaces';
import { getUndoManager } from '@/core/undo/undo-manager';

const spaceId = DEFAULT_SPACE_ID;

export const SpaceSidebar = () => {
  const setCurrentSpaceID = useSpaceStore((store) => store.setCurrentSpaceID);
  const sidebarContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCurrentSpaceID(spaceId);
  }, [setCurrentSpaceID]);

  useEffect(() => {
    const undoManager = getUndoManager();
    return undoManager.attachKeyboardShortcuts(
      () => sidebarContainerRef.current,
    );
  }, []);

  return (
    <div ref={sidebarContainerRef} className="h-full">
      <Sidebar
        variant="floating"
        collapsible="offcanvas"
        className="shadow-sidebar-shadow border-sidebar-border bg-sidebar w-50 justify-center rounded-4xl border align-middle select-none"
        style={{
          top: 'var(--spacing-space-sidebar-top)',
          height: `calc(98vh - var(--spacing-space-sidebar-top))`,
        }}
      >
        <div className="h-3" />
        <Suspense fallback={<SpaceSidebarSkeleton />}>
          <SpaceSidebarContent spaceId={spaceId} />
        </Suspense>
      </Sidebar>
    </div>
  );
};
