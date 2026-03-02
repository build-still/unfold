import { useCallback, useMemo, useState } from 'react';

import { exportToPdf, selectPrintableNodes, type PrintScope } from '@/utils/print';
import type { Node } from '@/types/sidebar';

interface UseExportActionsParams {
  printScope: PrintScope;
  fileId?: string;
  fileTree: Node[];
  getNode: (id: string) => Node | null;
  spaceName?: string;
}

export function useExportActions({ printScope, fileId, fileTree, getNode, spaceName }: UseExportActionsParams) {
  const [isExporting, setIsExporting] = useState(false);

  const printableCount = useMemo(() => {
    return selectPrintableNodes(printScope, fileId, fileTree, getNode).length;
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
      const scopedTitle = printScope === 'space' ? (spaceName || 'space') : currentName;

      await exportToPdf(nodes, scopedTitle);
    } catch (error) {
      console.error('[toolbar:export-pdf]', error);
    } finally {
      setIsExporting(false);
    }
  }, [printScope, fileId, fileTree, getNode, spaceName]);

  return {
    printableCount,
    isExporting,
    handleExport,
  };
}
