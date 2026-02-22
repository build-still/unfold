import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { PanelLeftIcon, SlidersHorizontalIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { KEYBOARD_SHORTCUTS, getShortcutDisplay } from '@/config/keyboard-shortcuts';
import { FileBreadcrumbs } from '@/components/breadcrumbs/breadcrumbs';
import { cn } from '@/lib/tiptap-utils';
import { Ripple } from '@/components/ui/ripple';
import { useSidebar } from '@/components/ui/sidebar';
import { Tooltip, TooltipTrigger, AppTooltipContent } from '@/components/ui/tooltip';
import { SettingsModal } from '@/components/toolbar/settings-modal';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { PrintScope, exportToPdf, selectPrintableNodes } from '@/utils/print';
import {
  extractMainContentFromHtml,
  importFromWebsite,
  type ImportExtractionOptions,
} from '@/utils/web-import';

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim()) {
    return error;
  }
  return 'Import failed. Try another page or HTML source.';
}

function parseNodeTimestamp(value?: string): Date | null {
  if (!value) {
    return null;
  }

  const normalized = value.includes('T')
    ? value
    : `${value.replace(' ', 'T')}Z`;

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatRelativeTime(timestamp: Date, nowMs: number): string {
  const diffMs = timestamp.getTime() - nowMs;
  const absMs = Math.abs(diffMs);

  if (absMs < 45_000) {
    return 'just now';
  }

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const minute = 60_000;
  const hour = 3_600_000;
  const day = 86_400_000;

  if (absMs < hour) {
    return rtf.format(Math.round(diffMs / minute), 'minute');
  }

  if (absMs < day) {
    return rtf.format(Math.round(diffMs / hour), 'hour');
  }

  return rtf.format(Math.round(diffMs / day), 'day');
}

export const Toolbar = memo(function Toolbar() {
  const { toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const toggleSidebarShortcut = getShortcutDisplay(KEYBOARD_SHORTCUTS.TOGGLE_SIDEBAR);
  const { fileId } = useParams({ strict: false });
  const { fileTree, getNode, spaceName, addNode, renameNode, updateNodeContent } = useFileSystem();

  const [printScope, setPrintScope] = useState<PrintScope>('current');
  // const [isPrinting, setIsPrinting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const hasActiveFile = Boolean(fileId);

  useEffect(() => {
    if (!hasActiveFile && printScope !== 'space') {
      setPrintScope('space');
    }
  }, [hasActiveFile, printScope]);

  const printableCount = useMemo(() => {
    const nodes = selectPrintableNodes(printScope, fileId, fileTree, getNode);
    return nodes.length;
  }, [printScope, fileId, fileTree, getNode]);

  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true);
      const nodes = selectPrintableNodes(printScope, fileId, fileTree, getNode);
      if (!nodes.length) {
        return;
      }

      const currentNode = fileId ? getNode(fileId) : null;
      const currentName = currentNode?.name?.trim() || 'new page';
      const scopedTitle = printScope === 'space'
        ? (spaceName || 'space')
        : currentName;

      await exportToPdf(nodes, scopedTitle);
    } catch (error) {
      console.error('[toolbar:export-pdf]', error);
    } finally {
      setIsExporting(false);
    }
  }, [printScope, fileId, fileTree, getNode, spaceName]);

  // Keep handlePrint as alias for keyboard shortcut handler
  const handlePrint = handleExport;

  const createImportedNote = useCallback(
    async (title: string, contentHtml: string) => {
      const newId = await addNode(null);
      if (!newId) {
        throw new Error('Could not create a new file for imported content.');
      }

      await renameNode(newId, title);
      await updateNodeContent(newId, contentHtml);
      navigate({ to: '/files/$fileId', params: { fileId: newId } });
      setIsSettingsOpen(false);
      setImportError(null);
    },
    [addNode, navigate, renameNode, updateNodeContent],
  );

  const handleImportFromWebsite = useCallback(
    async (url: string, options: ImportExtractionOptions) => {
      setIsImporting(true);
      setImportError(null);

      try {
        const imported = await importFromWebsite(url, options);
        await createImportedNote(imported.title, imported.contentHtml);
      } catch (error) {
        setImportError(toErrorMessage(error));
      } finally {
        setIsImporting(false);
      }
    },
    [createImportedNote],
  );

  const handleImportFromHtml = useCallback(
    async (html: string, sourceUrl: string | undefined, options: ImportExtractionOptions) => {
      setIsImporting(true);
      setImportError(null);

      try {
        const imported = extractMainContentFromHtml(html, sourceUrl, options);
        await createImportedNote(imported.title, imported.contentHtml);
      } catch (error) {
        setImportError(toErrorMessage(error));
      } finally {
        setIsImporting(false);
      }
    },
    [createImportedNote],
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const onKeydown = (event: KeyboardEvent) => {
      const isPrintShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'p';
      if (!isPrintShortcut) return;
      event.preventDefault();
      void handlePrint();
    };

    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  }, [handlePrint]);

  const activeNode = fileId ? getNode(fileId) : null;
  const editedDate = parseNodeTimestamp(activeNode?.updatedAt ?? activeNode?.createdAt);
  const relativeText = editedDate ? formatRelativeTime(editedDate, nowMs) : null;
  const absoluteText = editedDate
    ? editedDate.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : null;

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
        <Tooltip delayDuration={120}>
          <TooltipTrigger asChild>
            <motion.button 
              onClick={toggleSidebar}
              className={cn(
                'relative z-20 flex items-center justify-center size-7 overflow-hidden',
                'rounded-full bg-transparent text-sidebar-foreground',
                'transition-all duration-200 hover:bg-sidebar-item-hover-bg/80 active:scale-95'
              )}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              aria-label="Toggle sidebar"
              data-tauri-drag-region="false"
            >
              <PanelLeftIcon size={15} strokeWidth={2.2} />
              <Ripple />
            </motion.button>
          </TooltipTrigger>
          <AppTooltipContent label="Toggle sidebar" shortcut={toggleSidebarShortcut} />
        </Tooltip>

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
            setImportError(null);
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
          onPrint={handlePrint}
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
