import { SidebarInset, SidebarProvider, SidebarTrigger } from '../ui/sidebar';

import { AppLevelLayout } from '@/config/app-level';
import { SpaceSidebar } from '@/features/sidebar/space-sidebar';
import { useFullscreen } from '@/hooks/use-fullscreen';

export function SpaceLayout({ children }: { children: React.ReactNode }) {
  const fullScreen = useFullscreen();
  const trafficLightHeight = `${AppLevelLayout.trafficLights.heightRem}rem`;
  const trafficLightWidth = `${AppLevelLayout.trafficLights.widthRem}rem`;

  return (
    <div className="flex h-svh w-full flex-col">
      <SidebarProvider className="flex min-h-0 flex-1 flex-row">
        <div className="sticky top-0 right-0 left-0 flex shrink-0">
          <div
            style={
              fullScreen
                ? undefined
                : { height: trafficLightHeight, width: trafficLightWidth }
            }
          />
          {
            <span className="flex-1" style={{ height: trafficLightHeight }}>
              {' '}
              <SidebarTrigger className="-ml-1" />
            </span>
          }
        </div>
        <SpaceSidebar />
        <SidebarInset className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex min-h-0 flex-1 flex-col p-4">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
