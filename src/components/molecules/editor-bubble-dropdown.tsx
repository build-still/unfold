import React, { Dispatch, SetStateAction } from 'react';
import { CheckIcon, ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, AppTooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface BubbleDropdownItem {
  name: string;
  icon: React.ElementType;
  command: () => void;
  isActive: () => boolean;
}

interface EditorBubbleDropdownProps {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  items: BubbleDropdownItem[];
  tooltipLabel: string;
  trigger: React.ReactNode;
  container?: HTMLElement | null;
  onSelect?: () => void;
  contentClassName?: string;
  triggerClassName?: string;
}

export function EditorBubbleDropdown({
  isOpen,
  setIsOpen,
  items,
  tooltipLabel,
  trigger,
  container,
  onSelect,
  contentClassName,
  triggerClassName,
}: EditorBubbleDropdownProps) {
  const activeItem = items.filter((item) => item.isActive()).pop() ?? { name: 'Multiple' };

  return (
    <Tooltip>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={triggerClassName ?? 'h-8 gap-1 px-2 rounded-lg'}
              onMouseDown={(e) => e.preventDefault()}
            >
              {trigger}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <AppTooltipContent label={tooltipLabel} />

        <DropdownMenuContent
          align="start"
          className={contentClassName ?? 'w-48'}
          container={container}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {items.map((item, index) => (
            <DropdownMenuItem
              key={index}
              onMouseDown={(e) => {
                e.preventDefault();
                item.command();
                onSelect?.();
              }}
              onSelect={(e) => e.preventDefault()}
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1">{item.name}</span>
              {activeItem.name === item.name && (
                <CheckIcon className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </Tooltip>
  );
}
