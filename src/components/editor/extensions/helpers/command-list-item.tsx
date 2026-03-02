import { cn } from '@/lib/tiptap-utils';

import type { SlashMenuItemType } from '@/components/editor/components/slash-menu/types';

interface CommandListItemProps {
  category: string;
  index: number;
  item: SlashMenuItemType;
  isSelected: boolean;
  onSelect: (index: number) => void;
}

export function CommandListItem({ category, index, item, isSelected, onSelect }: CommandListItemProps) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      data-item-index={index}
      key={`${category}-${item.title}-${index}`}
      onClick={() => onSelect(index)}
      className={cn(
        'group flex w-full items-start gap-2 rounded-xl border border-transparent px-2.5 py-2 text-left transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sidebar-ring/60',
        isSelected
          ? 'border-border-elevated bg-sidebar-subitem-selected-bg text-foreground'
          : 'text-sidebar-foreground/90 hover:bg-sidebar-item-hover-bg/75 hover:text-foreground',
      )}
    >
      <span className={cn('mt-0.5 inline-flex h-5 w-5 items-center justify-center', isSelected ? 'text-sidebar-foreground' : 'text-unselected-icon')}>
        <Icon size={16} />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-sans-serif text-sm font-medium tracking-tight lowercase">{item.title}</span>
        <span className="block truncate font-sans text-xs text-foreground-muted-secondary lowercase">{item.description}</span>
      </span>
    </button>
  );
}
