import React from 'react';

import { IconActionButton } from '@/components/atoms/icon-action-button';
import { cn } from '@/lib/tiptap-utils';

interface SidebarActionButtonProps {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  ariaLabel?: string;
  children: React.ReactNode;
}

export function SidebarActionButton({
  onClick,
  className,
  ariaLabel,
  children,
}: SidebarActionButtonProps) {
  return (
    <IconActionButton
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(className)}
    >
      {children}
    </IconActionButton>
  );
}
