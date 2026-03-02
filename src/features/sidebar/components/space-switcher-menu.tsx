import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type * as React from 'react';

import { SelectableRow } from '@/components/atoms/selectable-row';
import { SmallTextLabel } from '@/components/common/labels/small-text-label';
import { InlineRenameInput } from '@/components/molecules/inline-rename-input';
import { RowIconActions } from '@/components/molecules/row-icon-actions';
import { cn } from '@/lib/utils';

interface SpaceItem {
  id: string;
  name: string;
}

interface SpaceSwitcherMenuProps {
  spaces: SpaceItem[];
  activeSpaceId: string | null;
  activeSpaceItemRef?: React.Ref<HTMLElement>;
  onSwitchSpace: (spaceId: string) => void;
  onRenameSpace: (spaceId: string, nextName: string) => Promise<void>;
  onRequestDeleteSpace: (spaceId: string) => void;
  onOpenCreateSpace: () => void;
}

export function SpaceSwitcherMenu({
  spaces,
  activeSpaceId,
  activeSpaceItemRef,
  onSwitchSpace,
  onRenameSpace,
  onRequestDeleteSpace,
  onOpenCreateSpace,
}: SpaceSwitcherMenuProps) {
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');

  const handleStartRename = (space: SpaceItem) => {
    setEditingSpaceId(space.id);
    setDraftName(space.name);
  };

  const handleCommitRename = async (spaceId: string) => {
    await onRenameSpace(spaceId, draftName || 'Untitled Space');
    setEditingSpaceId(null);
    setDraftName('');
  };

  const handleCancelRename = () => {
    setEditingSpaceId(null);
    setDraftName('');
  };

  return (
    <>
      <SmallTextLabel casing="lower">spaces</SmallTextLabel>
      <div className="max-h-[48vh] space-y-0.5 overflow-y-auto overscroll-contain pr-1">
        {spaces.map((space) => {
          const isActive = space.id === activeSpaceId;
          const isEditing = editingSpaceId === space.id;

          return (
            <SelectableRow
              as="div"
              key={space.id}
              onClick={() => onSwitchSpace(space.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSwitchSpace(space.id);
                }
              }}
              elementRef={isActive ? activeSpaceItemRef : undefined}
              selected={isActive}
              className={cn(
                'group/space cursor-pointer gap-2 px-2.5 py-1 text-sm',
                isActive
                  ? 'bg-sidebar-subitem-selected-bg border-border-elevated text-foreground'
                  : 'border-transparent text-foreground/85 hover:bg-hover-bg-subtle hover:text-foreground',
              )}
            >
              {isEditing ? (
                <InlineRenameInput
                  value={draftName}
                  onChange={setDraftName}
                  onCommit={() => {
                    void handleCommitRename(space.id);
                  }}
                  onCancel={handleCancelRename}
                />
              ) : (
                <button onClick={() => onSwitchSpace(space.id)} className="flex-1 truncate text-left text-sm font-medium text-inherit">
                  {space.name}
                </button>
              )}

              {!isEditing ? (
                <RowIconActions
                  className="w-12"
                  actions={[
                    {
                      icon: <Pencil size={14} />,
                      onClick: () => handleStartRename(space),
                      'aria-label': 'rename space',
                    },
                    {
                      icon: <Trash2 size={14} />,
                      onClick: () => onRequestDeleteSpace(space.id),
                      disabled: spaces.length <= 1,
                      'aria-label': 'delete space',
                    },
                  ]}
                />
              ) : null}
            </SelectableRow>
          );
        })}
      </div>

      <button
        onClick={onOpenCreateSpace}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-surface-elevated-border bg-hover-bg-subtle px-3 py-2 text-[13px] font-medium text-foreground-muted-tertiary transition-all duration-200 ease-out hover:border-surface-border-hover hover:bg-surface-elevated hover:text-foreground-muted-hover"
      >
        <Plus size={14} strokeWidth={2} />
        <span>add new space</span>
      </button>
    </>
  );
}
