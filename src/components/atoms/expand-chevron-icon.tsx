import { ChevronDown } from 'lucide-react';

import { SIDEBAR_TRANSITION_EASE_CLASS } from '@/components/sidebar/sidebar-motion';
import { cn } from '@/lib/utils';

interface ExpandChevronIconProps {
  isOpen: boolean;
  className?: string;
}

export function ExpandChevronIcon({ isOpen, className }: ExpandChevronIconProps) {
  return (
    <span
      className={cn(
        'inline-flex transition-transform duration-220',
        SIDEBAR_TRANSITION_EASE_CLASS,
        !isOpen && '-rotate-90 opacity-90',
        className,
      )}
    >
      <ChevronDown size={14} strokeWidth={3} />
    </span>
  );
}
