import { useCallback, useState } from 'react';

import { extractMainContentFromHtml, importFromWebsite, type ImportExtractionOptions } from '@/utils/web-import';

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim()) {
    return error;
  }
  return 'Import failed. Try another page or HTML source.';
}

interface UseImportActionsParams {
  addNode: (parentId: string | null) => Promise<{ id: string; spaceId: string } | null>;
  renameNode: (nodeId: string, name: string) => Promise<void>;
  updateNodeContent: (nodeId: string, content: string) => Promise<void>;
  navigateToFile: (fileId: string, spaceId: string) => void;
  onImported?: () => void;
}

export function useImportActions({
  addNode,
  renameNode,
  updateNodeContent,
  navigateToFile,
  onImported,
}: UseImportActionsParams) {
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const clearImportError = useCallback(() => {
    setImportError(null);
  }, []);

  const createImportedNote = useCallback(
    async (title: string, contentHtml: string) => {
      const createdNode = await addNode(null);
      if (!createdNode) {
        throw new Error('Could not create a new file for imported content.');
      }

      await renameNode(createdNode.id, title);
      await updateNodeContent(createdNode.id, contentHtml);
      navigateToFile(createdNode.id, createdNode.spaceId);
      setImportError(null);
      onImported?.();
    },
    [addNode, navigateToFile, onImported, renameNode, updateNodeContent],
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

  return {
    isImporting,
    importError,
    clearImportError,
    handleImportFromWebsite,
    handleImportFromHtml,
  };
}
