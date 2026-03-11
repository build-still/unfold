import { memo, useEffect, useState } from 'react';
import { SlidersHorizontalIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { KEYBOARD_SHORTCUTS, getShortcutDisplay } from '@/config/keyboard-shortcuts';
import { FileBreadcrumbs } from '@/components/breadcrumbs/breadcrumbs';
import { cn } from '@/lib/tiptap-utils';
import { ToolbarSidebarToggle } from '@/components/molecules/toolbar-sidebar-toggle';
import { Ripple } from '@/components/ui/ripple';
import { useSidebar } from '@/components/ui/sidebar';
import { SettingsModal } from '@/components/toolbar/settings-modal';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { useAppDispatch } from '@/store/hooks';
import { setPendingFileId } from '@/store/slices/ui-slice';
import { type PrintScope } from '@/utils/print';
import { useExportActions } from '@/features/toolbar/hooks/use-export-actions';
import { useImportActions } from '@/features/toolbar/hooks/use-import-actions';
import { useRelativeEditedTime } from '@/features/toolbar/hooks/use-relative-edited-time';

export const Toolbar = memo(function Toolbar() {
  const { toggleSidebar } = useSidebar();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const toggleSidebarShortcut = getShortcutDisplay(KEYBOARD_SHORTCUTS.TOGGLE_SIDEBAR);
  const { fileId } = useParams({ strict: false });
  const { fileTree, getNode, spaceName, addNode, renameNode, updateNodeContent } = useFileSystem();

  const [printScope, setPrintScope] = useState<PrintScope>('current');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const hasActiveFile = Boolean(fileId);

  useEffect(() => {
    if (!hasActiveFile && printScope !== 'space') {
      setPrintScope('space');
    }
  }, [hasActiveFile, printScope]);

  const { printableCount, isExporting, handleExport } = useExportActions({
    printScope,
    fileId,
    fileTree,
    getNode,
    spaceName,
  });

  const {
    isImporting,
    importError,
    clearImportError,
    handleImportFromWebsite,
    handleImportFromHtml,
  } = useImportActions({
    addNode,
    renameNode,
    updateNodeContent,
    navigateToFile: (newFileId, targetSpaceId) => {
      dispatch(setPendingFileId(newFileId));
      navigate({
        to: '/spaces/$spaceId/files/$fileId',
        params: { spaceId: targetSpaceId, fileId: newFileId },
      });
    },
    onImported: () => {
      setIsSettingsOpen(false);
    },
  });

  useEffect(() => {
    const onKeydown = (event: KeyboardEvent) => {
      const isPrintShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'p';
      if (!isPrintShortcut) return;
      event.preventDefault();
      void handleExport();
    };

    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  }, [handleExport]);

  const activeNode = fileId ? getNode(fileId) : null;
  const { relativeText, absoluteText } = useRelativeEditedTime(activeNode);

  return (
    <div
      className={cn(
        'h-10',
        'bg-background',
        'flex items-center justify-between',
        'text-xs select-none',
        'pl-24 pr-4',
        'relative',
        'print-hidden',
      )}
      data-tauri-drag-region
    >
      <div 
        className="absolute inset-0" 
        data-tauri-drag-region
      />
      
      <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10 -translate-y-px" data-tauri-drag-region>
        <ToolbarSidebarToggle onToggle={toggleSidebar} shortcut={toggleSidebarShortcut} />

        <div className="flex-1 min-w-0 relative z-10"  data-tauri-drag-region>
          <FileBreadcrumbs />
        </div>
      </div>

      <div className="flex items-center text-sidebar-foreground/50 text-xs relative z-10 font-light -translate-y-px" data-tauri-drag-region>
        {relativeText && (
          <span
            className="mr-2 text-sidebar-foreground/60"
            title={absoluteText ?? undefined}
          >
            last edited {relativeText}
          </span>
        )}

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 320, damping: 24 }}
          onClick={() => {
            clearImportError();
            setIsSettingsOpen(true);
          }}
          className={cn(
            'sidebar-icon-button relative ml-2 size-5 rounded-md flex items-center justify-center overflow-hidden',
            'text-sidebar-foreground hover:text-foreground',
            'hover:bg-sidebar-icon-hover-bg/70 active:scale-95'
          )}
          aria-label="Workspace menu"
          data-tauri-drag-region="false"
        >
          <SlidersHorizontalIcon size={14} strokeWidth={2.2} />
          <Ripple />
        </motion.button>

        <SettingsModal
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          printScope={printScope}
          onScopeChange={setPrintScope}
          printableCount={printableCount}
          isExporting={isExporting}
          hasActiveFile={hasActiveFile}
          onImportFromWebsite={handleImportFromWebsite}
          onImportFromHtml={handleImportFromHtml}
          isImporting={isImporting}
          importError={importError}
          onExport={handleExport}
        />

      </div>
    </div>
  );
});
