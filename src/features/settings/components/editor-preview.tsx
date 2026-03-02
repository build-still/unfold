import { useState } from 'react';

import { PanelCard } from '@/components/atoms/panel-card';
import { TabSwitcher } from '@/components/ui/tab-switcher';
import type { CustomizationPropertyKey } from '@/types/customization';

import { TypographyPreviewDocument } from './typography-preview-document';

interface EditorPreviewProps {
  draftGetVal: (key: CustomizationPropertyKey) => string | number | undefined;
  savedGetVal: (key: CustomizationPropertyKey) => string | number | undefined;
  hasDraft: boolean;
}

export function EditorPreview({ draftGetVal, savedGetVal, hasDraft }: EditorPreviewProps) {
  const [mode, setMode] = useState<'after' | 'before'>('after');
  const activeGetVal = mode === 'after' ? draftGetVal : savedGetVal;

  return (
    <PanelCard className="border-modal-surface-border/40">
      <div className="flex items-center justify-between border-b border-modal-surface-border/45 bg-sidebar-item-hover-bg/35 px-3.5 py-2.5">
        <div className="space-y-0.5">
          <h4 className="font-sans-serif text-sm font-medium text-modal-surface-foreground/92">preview</h4>
          <p className="font-sans text-xs text-modal-surface-foreground/70">how your typography will look in the editor</p>
        </div>
        <TabSwitcher
          options={[
            { value: 'after', label: 'after' },
            {
              value: 'before',
              label: 'before',
              disabled: !hasDraft,
              tooltip: !hasDraft ? 'make changes to see before/after' : undefined,
            },
          ]}
          value={mode}
          onValueChange={(next) => setMode(next as 'after' | 'before')}
          enableSwipe={false}
          layoutId="preview-tab-pill"
        />
      </div>
      <div className="overflow-y-auto max-h-72 px-5 py-5 dropdown-darker-scroll">
        <TypographyPreviewDocument getValue={activeGetVal} />
      </div>
    </PanelCard>
  );
}
