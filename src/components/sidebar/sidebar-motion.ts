export const SIDEBAR_EASE = [0.22, 1, 0.36, 1] as const;
export const SIDEBAR_OPEN_EASE = [0.16, 1, 0.3, 1] as const;
export const SIDEBAR_CLOSE_EASE = [0.4, 0, 1, 1] as const;

export const SIDEBAR_SHELL_TWEEN = {
  type: 'tween',
  duration: 0.28,
  ease: SIDEBAR_EASE,
} as const;

export const SIDEBAR_GAP_TWEEN = {
  type: 'tween',
  duration: 0.24,
  ease: SIDEBAR_EASE,
} as const;

export const SIDEBAR_TRANSITION_EASE_CLASS = 'ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none';

export const SIDEBAR_MINDFUL_OPEN_DURATION = 0.62;
export const SIDEBAR_MINDFUL_CLOSE_DURATION = 0.2;
export const SIDEBAR_MINDFUL_CHILD_STAGGER = 0.055;

export const SIDEBAR_TREE_OPEN_SPRING = {
  type: 'spring',
  stiffness: 180,
  damping: 28,
  mass: 0.95,
} as const;

export const SIDEBAR_TREE_CLOSE_SPRING = {
  type: 'spring',
  stiffness: 220,
  damping: 30,
  mass: 0.9,
} as const;
