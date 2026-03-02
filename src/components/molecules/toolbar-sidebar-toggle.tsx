import { PanelLeftIcon } from 'lucide-react';
import { motion } from 'motion/react';

import { Ripple } from '@/components/ui/ripple';
import { AppTooltipContent, Tooltip, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ToolbarSidebarToggleProps {
  onToggle: () => void;
  shortcut: string;
}

export function ToolbarSidebarToggle({ onToggle, shortcut }: ToolbarSidebarToggleProps) {
  return (
    <Tooltip delayDuration={120}>
      <TooltipTrigger asChild>
        <motion.button
          onClick={onToggle}
          className={cn(
            'relative z-20 flex size-7 items-center justify-center overflow-hidden rounded-full bg-transparent text-sidebar-foreground',
            'transition-all duration-200 hover:bg-sidebar-item-hover-bg/80 active:scale-95',
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
      <AppTooltipContent label="Toggle sidebar" shortcut={shortcut} />
    </Tooltip>
  );
}
