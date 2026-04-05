import { Suspense, useEffect } from 'react';

import { SpaceSidebarContent } from './space-sidebar-content';
import { SpaceSidebarSkeleton } from './space-sidebar-skeleton';

import { Sidebar } from '@/components/ui/sidebar';
import { DEFAULT_SPACE_ID } from '@/config/spaces';
import type { SidebarPosition } from '@/config/types';
import { useSpaceStore } from '@/features/sidebar/stores/space-store';

const spaceId = DEFAULT_SPACE_ID;

type SpaceSidebarProps = {
  side: SidebarPosition;
};
/**
 * TODOS
 * 1. pinned section isnt draggable, so unpinning isnt possible, maybe pinning should be a context menu option
 * 2. drag and drop doesnt alway work, fiiles that were just dropped isnt working
 * 3. allow only 5 levels of nesting, and show a warning when user tries to exceed that, this is because the current design of the sidebar with the current indentation style will break if we allow more levels, we can revisit the design later to accomodate more levels
 * 4. touchpad haptics on drag and drop would be a nice to have
 * 5. Scrollbar has gutter, so layout shift is happening. It should be like the Slack Scrollbar.
 * 6. Delete button should show modal to confirm deletion, and it should also show the number of sub notes that will be deleted. This is because deleting a note with many sub notes by mistake can be a bad experience.
 */
export const SpaceSidebar = ({ side }: SpaceSidebarProps) => {
  const setCurrentSpaceID = useSpaceStore((store) => store.setCurrentSpaceID);

  useEffect(() => {
    setCurrentSpaceID(spaceId);
  }, [setCurrentSpaceID]);

  return (
    <Sidebar
      side={side}
      variant="floating"
      collapsible="offcanvas"
      className="shadow-sidebar-shadow border-sidebar-border bg-sidebar justify-center rounded-4xl border align-middle select-none"
      style={{
        top: 'var(--spacing-space-sidebar-top)',
        height: `calc(98vh - var(--spacing-space-sidebar-top))`,
      }}
    >
      <div className="flex h-full flex-col">
        <div className="h-3" />
        <Suspense fallback={<SpaceSidebarSkeleton />}>
          <SpaceSidebarContent spaceId={spaceId} />
        </Suspense>
      </div>
    </Sidebar>
  );
};
