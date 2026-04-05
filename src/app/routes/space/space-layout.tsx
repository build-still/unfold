import * as React from 'react';

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { AppLevelLayout } from '@/config/app-level';
import { COMMAND_IDS, useRegisterCommand } from '@/config/commands';
import { DEFAULT_SPACE_ID } from '@/config/spaces';
import { useConfig } from '@/config/use-config';
import { getUndoManager } from '@/core/undo/undo-manager';
import { SpaceSidebar } from '@/features/sidebar/components/space-sidebar';
import { useSidebarUndoActions } from '@/features/sidebar/hooks/use-sidebar-undo-actions';
import { useSidebarStore } from '@/features/sidebar/stores/sidebar-store';
import { useFullscreen } from '@/hooks/use-fullscreen';

function ActiveFileIdPanel() {
  const activeId = useSidebarStore((s) => s.activeNodeId);
  return (
    <div className="text-muted-foreground border-border mb-3 shrink-0 border-b pb-2 font-mono text-xs">
      {activeId ?? '—'}
    </div>
  );
}

export function SpaceLayout({ children }: { children: React.ReactNode }) {
  // state
  const fullScreen = useFullscreen();
  const { config } = useConfig();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const { createNodeWithUndo } = useSidebarUndoActions();

  const trafficLightHeight = `${AppLevelLayout.trafficLights.heightRem}rem`;
  const trafficLightWidth = `${AppLevelLayout.trafficLights.widthRem}rem`;
  const sidebarPosition = config.sidebar.position;

  // handlers
  const handleToggleSidebarCommand = () => {
    setIsSidebarOpen((isOpen) => !isOpen);
  };

  const handleCreateRootFileCommand = () => {
    void createNodeWithUndo({
      spaceId: DEFAULT_SPACE_ID,
      parentId: null,
      name: 'new page',
    });
  };

  const handleUndoCommand = () => {
    void getUndoManager().undo();
  };

  const handleRedoCommand = () => {
    void getUndoManager().redo();
  };

  useRegisterCommand(COMMAND_IDS.sidebarToggle, handleToggleSidebarCommand);
  useRegisterCommand(COMMAND_IDS.fileNew, handleCreateRootFileCommand);
  useRegisterCommand(COMMAND_IDS.undo, handleUndoCommand);
  useRegisterCommand(COMMAND_IDS.redo, handleRedoCommand);

  // render
  const mainInset = (
    <SidebarInset className="min-h-0 flex-1 overflow-y-auto">
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <ActiveFileIdPanel />
        {children}
      </div>
    </SidebarInset>
  );

  const headerControls = (
    <div
      className="flex items-center gap-1 px-1"
      style={{ height: trafficLightHeight }}
    >
      <SidebarTrigger className="mt-1" />
    </div>
  );

  return (
    <div className="flex h-svh w-full flex-col">
      <SidebarProvider
        open={isSidebarOpen}
        onOpenChange={setIsSidebarOpen}
        className="flex min-h-0 flex-1 flex-row"
        style={
          {
            '--sidebar-width': `${config.sidebar.width}px`,
          } as React.CSSProperties
        }
      >
        <div className="sticky top-0 right-0 left-0 flex shrink-0">
          <div
            style={
              fullScreen
                ? undefined
                : { height: trafficLightHeight, width: trafficLightWidth }
            }
          />
          {sidebarPosition === 'left' ? (
            <>
              {headerControls}
              <span className="flex-1" style={{ height: trafficLightHeight }} />
            </>
          ) : (
            <>
              <span className="flex-1" style={{ height: trafficLightHeight }} />
              {headerControls}
            </>
          )}
        </div>
        {sidebarPosition === 'left' ? (
          <>
            <SpaceSidebar side={sidebarPosition} />
            {mainInset}
          </>
        ) : (
          <>
            {mainInset}
            <SpaceSidebar side={sidebarPosition} />
          </>
        )}
      </SidebarProvider>
    </div>
  );
}
