import React, { useEffect, useCallback, useMemo } from 'react';
import Sidebar from "../components/sidebar/sidebar";
import { Toolbar } from "../components/toolbar/toolbar";
import { dispatchAppEvent, APP_EVENTS } from '@/lib/app-events';
import { useLayout } from '@/contexts/LayoutContext';
import { useParams } from '@tanstack/react-router';
import { SidebarInset, useSidebar } from '@/components/ui/sidebar';
import { useGlobalSidebarShortcuts } from '@/hooks/use-global-sidebar-shortcuts';
import { SearchBar } from '@/components/search/search-bar';
import { useEditorContext } from '@/contexts/EditorContext';
import { WorkspaceSkeleton } from '@/components/skeletons/workspace-skeleton';
import {
  useSyncActiveFileSelection,
  useSyncActiveSpaceSelection,
} from '@/store/hooks/use-filesystem-store';
import { useAppSelector } from '@/store/hooks';
import { selectActiveSpaceId } from '@/store/selectors';
import { resolveCustomizationProperties } from '@/services/customizationResolver';
import type { CustomizationPropertyKey } from '@/types/customization';

const APP_SCOPE_ID = 'app-default';

const FONT_FAMILY_MAP: Array<[CustomizationPropertyKey, string]> = [
  ['editor.fontFamily', '--custom-editor-font'],
  ['title.fontFamily', '--custom-title-font'],
  ['body.fontFamily', '--font-sans'],
  ['code.fontFamily', '--custom-code-font'],
  ['h1.fontFamily', '--custom-h1-font'],
  ['h2.fontFamily', '--custom-h2-font'],
  ['h3.fontFamily', '--custom-h3-font'],
];

const FONT_SIZE_MAP: Array<[CustomizationPropertyKey, string[]]> = [
  ['editor.fontSize', ['--font-size-editor-base', '--font-size-note']],
  ['title.fontSize', ['--font-size-document-title']],
  ['code.fontSize', ['--font-size-code']],
  ['h1.fontSize', ['--font-size-heading-1']],
  ['h2.fontSize', ['--font-size-heading-2']],
  ['h3.fontSize', ['--font-size-heading-3']],
];

function LoadingScreen() {
  return <WorkspaceSkeleton />;
}

function EditorLayoutContent({children}: {children?: React.ReactNode}) {
  const { fileId, spaceId } = useParams({ strict: false });
  const { layout } = useLayout();
  const { pageEditorRef } = useEditorContext();
  const { state: sidebarState, isMobile } = useSidebar();
  const customizationState = useAppSelector((state) => state.customization);
  const activeSpaceId = useAppSelector(selectActiveSpaceId);
  useSyncActiveSpaceSelection(spaceId ?? null);
  useSyncActiveFileSelection(fileId ?? null);

  useGlobalSidebarShortcuts();

  const sidebarPosition = layout.sidebar_position || 'left';

  const resolvedCustomization = useMemo(() => {
    const appSettings = customizationState.byThemeId[APP_SCOPE_ID];
    const spaceSettings = customizationState.bySpaceId[activeSpaceId];
    return resolveCustomizationProperties(appSettings?.properties, spaceSettings?.properties);
  }, [activeSpaceId, customizationState.byThemeId, customizationState.bySpaceId]);

  const customizationStyles = useMemo(() => {
    const styles: Record<string, string> = {};

    for (const [prop, cssVar] of FONT_FAMILY_MAP) {
      const value = resolvedCustomization[prop]?.value;
      if (typeof value === 'string') {
        styles[cssVar] = value;
      }
    }

    for (const [prop, cssVars] of FONT_SIZE_MAP) {
      const value = resolvedCustomization[prop]?.value;
      if (typeof value === 'number') {
        for (const cssVar of cssVars) {
          styles[cssVar] = `${value}px`;
        }
      }
    }

    return styles;
  }, [resolvedCustomization]);

  const handleKeydown = useCallback((e: KeyboardEvent) => {
    const isFindShortcut = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f';

    if (isFindShortcut) {
      e.preventDefault();
      const cursorPos = pageEditorRef.current?.state.selection.from ?? null;
      dispatchAppEvent(APP_EVENTS.OPEN_FIND_DIALOG, { cursorPos });
      return;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [handleKeydown]);

  const handleEditorAreaMouseDown = useCallback(() => {
    dispatchAppEvent(APP_EVENTS.EDITOR_ACTIVATE_FILE);
  }, []);

  return (
    <div
      className="flex flex-col relative bg-background h-screen w-screen"
      data-tauri-drag-region
      style={customizationStyles as React.CSSProperties}
    >
      {/* Top Toolbar */}
      <Toolbar />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar side={sidebarPosition} />

        <SidebarInset className="flex-1 relative bg-background">
          <div
            className={[
              'editor-scroll-stable flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-transparent',
            ].join(' ')}
          >
            <div
              className={[
                'w-full max-w-5xl min-h-full px-6 pt-5 pb-8 mx-auto',
                'transform-gpu will-change-transform motion-reduce:transform-none',
                'transition-transform duration-500ms ease-[cubic-bezier(0.42,0,0.58,1)] motion-reduce:transition-none',
                !isMobile && sidebarState === 'expanded' && sidebarPosition === 'left'
                  ? 'editor-content-shift-left'
                  : '',
                !isMobile && sidebarState === 'expanded' && sidebarPosition === 'right'
                  ? 'editor-content-shift-right'
                  : '',
              ].join(' ')}
              onMouseDown={handleEditorAreaMouseDown}
            >
              {children}
            </div>
          </div>
        </SidebarInset>
      </div>

      <SearchBar />
    </div>
  );
}

function EditorLayout({children}: {children?: React.ReactNode}) {
  const { isLoading: isLayoutLoading } = useLayout();

  if (isLayoutLoading) {
    return <LoadingScreen />;
  }

  return <EditorLayoutContent>{children}</EditorLayoutContent>;
}

export default EditorLayout;
