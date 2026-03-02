import * as React from 'react';

import { motion, useReducedMotion } from 'motion/react';

import {
  SIDEBAR_TREE_CLOSE_SPRING,
  SIDEBAR_TREE_OPEN_SPRING,
} from '@/components/sidebar/sidebar-motion';
import { SidebarMenuSub } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface SidebarChildrenCollapseProps {
  isOpen: boolean;
  nodeId: string;
  isRoot: boolean;
  children: React.ReactNode;
}

export function SidebarChildrenCollapse({
  isOpen,
  nodeId,
  isRoot,
  children,
}: SidebarChildrenCollapseProps) {
  const prefersReducedMotion = useReducedMotion();

  const containerTransition = prefersReducedMotion
    ? { duration: 0 }
    : isOpen
      ? SIDEBAR_TREE_OPEN_SPRING
      : SIDEBAR_TREE_CLOSE_SPRING;

  const contentTransition = prefersReducedMotion
    ? { duration: 0 }
    : {
      ...(isOpen ? SIDEBAR_TREE_OPEN_SPRING : SIDEBAR_TREE_CLOSE_SPRING),
      delay: isOpen ? 0.06 : 0,
    };

  return (
    <motion.div
      key={`sub-${nodeId}`}
      initial={false}
      animate={{
        height: isOpen ? 'auto' : 0,
        opacity: isOpen ? 1 : 0,
        y: isOpen ? 0 : -3,
      }}
      transition={containerTransition}
      className="overflow-hidden"
      style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
    >
      <motion.div
        initial={false}
        animate={{
          opacity: isOpen ? 1 : 0,
          y: isOpen ? 0 : -1.5,
        }}
        transition={contentTransition}
        className="min-h-0 overflow-hidden"
      >
          <SidebarMenuSub className={cn(isRoot ? 'ml-2.5' : 'ml-0', 'pl-2.5 pt-0 pb-0 gap-1 before:top-1')}>
            {children}
          </SidebarMenuSub>
      </motion.div>
    </motion.div>
  );
}
