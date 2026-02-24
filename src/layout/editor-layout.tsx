import React, { useEffect, useCallback, useMemo } from 'react';
import Sidebar from "../components/sidebar/sidebar";
import { Toolbar } from "../components/toolbar/toolbar";
import { useLayout } from '@/contexts/LayoutContext';
import { useParams } from '@tanstack/react-router';
import { SidebarProvider, SidebarInset, useSidebar } from '@/components/ui/sidebar';
import { useGlobalSidebarShortcuts } from '@/hooks/use-global-sidebar-shortcuts';
import { SearchBar } from '@/components/search/search-bar';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { useEditorContext } from '@/contexts/EditorContext';
import { WorkspaceSkeleton } from '@/components/skeletons/workspace-skeleton';
import {
  useSyncActiveFileSelection,
  useSyncActiveSpaceSelection,
} from '@/store/hooks/use-filesystem-store';
import { useAppSelector } from '@/store/hooks';
import { selectActiveSpaceId } from '@/store/selectors';
import { resolveCustomizationProperties } from '@/services/customizationResolver';

const APP_SCOPE_ID = 'app-default';

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

    const editorFont = resolvedCustomization['editor.fontFamily']?.value;
    if (typeof editorFont === 'string') {
      styles['--custom-editor-font'] = editorFont;
    }

    const titleFont = resolvedCustomization['title.fontFamily']?.value;
    if (typeof titleFont === 'string') {
      styles['--custom-title-font'] = titleFont;
    }

    const bodyFont = resolvedCustomization['body.fontFamily']?.value;
    if (typeof bodyFont === 'string') {
      styles['--font-sans'] = bodyFont;
    }

    const codeFont = resolvedCustomization['code.fontFamily']?.value;
    if (typeof codeFont === 'string') {
      styles['--custom-code-font'] = codeFont;
    }

    const h1Font = resolvedCustomization['h1.fontFamily']?.value;
    if (typeof h1Font === 'string') {
      styles['--custom-h1-font'] = h1Font;
    }

    const h2Font = resolvedCustomization['h2.fontFamily']?.value;
    if (typeof h2Font === 'string') {
      styles['--custom-h2-font'] = h2Font;
    }

    const h3Font = resolvedCustomization['h3.fontFamily']?.value;
    if (typeof h3Font === 'string') {
      styles['--custom-h3-font'] = h3Font;
    }

    const editorSize = resolvedCustomization['editor.fontSize']?.value;
    if (typeof editorSize === 'number') {
      styles['--font-size-editor-base'] = `${editorSize}px`;
      styles['--font-size-note'] = `${editorSize}px`;
    }

    const titleSize = resolvedCustomization['title.fontSize']?.value;
    if (typeof titleSize === 'number') {
      styles['--font-size-document-title'] = `${titleSize}px`;
    }

    const codeSize = resolvedCustomization['code.fontSize']?.value;
    if (typeof codeSize === 'number') {
      styles['--font-size-code'] = `${codeSize}px`;
    }

    const h1Size = resolvedCustomization['h1.fontSize']?.value;
    if (typeof h1Size === 'number') {
      styles['--font-size-heading-1'] = `${h1Size}px`;
    }

    const h2Size = resolvedCustomization['h2.fontSize']?.value;
    if (typeof h2Size === 'number') {
      styles['--font-size-heading-2'] = `${h2Size}px`;
    }

    const h3Size = resolvedCustomization['h3.fontSize']?.value;
    if (typeof h3Size === 'number') {
      styles['--font-size-heading-3'] = `${h3Size}px`;
    }

    return styles;
  }, [resolvedCustomization]);

  const handleKeydown = useCallback((e: KeyboardEvent) => {
    const isFindShortcut = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f';

    if (isFindShortcut) {
      e.preventDefault();
      const cursorPos = pageEditorRef.current?.state.selection.from ?? null;
      document.dispatchEvent(new CustomEvent('openFindDialogFromEditor', {
        detail: { cursorPos },
      }));
      return;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [handleKeydown]);

  const handleEditorAreaMouseDown = useCallback(() => {
    document.dispatchEvent(new CustomEvent('editor:activate-file'));
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
  const { isLoading } = useFileSystem();

  if (isLoading || isLayoutLoading) {
    return <LoadingScreen />;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <EditorLayoutContent>
        {children}
      </EditorLayoutContent>
    </SidebarProvider>
  );
}

export default EditorLayout;
