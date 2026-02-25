import { useId, useMemo } from 'react';
import { motion, type PanInfo } from 'motion/react';

import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const DEFAULT_SWIPE_THRESHOLD = 42;

export interface TabSwitcherOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
  tooltip?: string;
}

interface TabSwitcherProps<T extends string> {
  options: Array<TabSwitcherOption<T>>;
  value: T;
  onValueChange: (nextValue: T) => void;
  className?: string;
  tabClassName?: string;
  activeTabClassName?: string;
  inactiveTabClassName?: string;
  layoutId?: string;
  enableSwipe?: boolean;
  swipeThreshold?: number;
  dragElastic?: number;
}

export function TabSwitcher<T extends string>({
  options,
  value,
  onValueChange,
  className,
  tabClassName,
  activeTabClassName,
  inactiveTabClassName,
  layoutId,
  enableSwipe = true,
  swipeThreshold = DEFAULT_SWIPE_THRESHOLD,
  dragElastic = 0.45,
}: TabSwitcherProps<T>) {
  const generatedLayoutId = useId();
  const activePillLayoutId = layoutId ?? generatedLayoutId;

  const activeIndex = useMemo(
    () => options.findIndex((option) => option.value === value),
    [options, value],
  );

  const findNextEnabledIndex = (startIndex: number, direction: 1 | -1) => {
    let index = startIndex + direction;

    while (index >= 0 && index < options.length) {
      if (!options[index].disabled) {
        return index;
      }
      index += direction;
    }

    return -1;
  };

  const handleTabDragEnd = (_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    if (activeIndex < 0) return;

    const offsetX = info.offset.x;
    if (Math.abs(offsetX) < swipeThreshold) return;

    const direction: 1 | -1 = offsetX < 0 ? 1 : -1;
    const nextIndex = findNextEnabledIndex(activeIndex, direction);
    if (nextIndex >= 0) {
      onValueChange(options[nextIndex].value);
    }
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-xl border border-modal-surface-border/55 bg-sidebar-container-bg p-1',
        className,
      )}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        const canDrag = enableSwipe && isActive && !option.disabled;

        const content = (
          <motion.div
            key={option.value}
            role="button"
            tabIndex={option.disabled ? -1 : 0}
            aria-pressed={isActive}
            aria-disabled={option.disabled}
            onClick={() => {
              if (!option.disabled) {
                onValueChange(option.value);
              }
            }}
            onKeyDown={(event) => {
              if (option.disabled) return;
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onValueChange(option.value);
              }
            }}
            {...(canDrag
              ? {
                  drag: 'x' as const,
                  dragConstraints: { left: 0, right: 0 },
                  dragElastic,
                  dragMomentum: false,
                  onDragEnd: handleTabDragEnd,
                }
              : {})}
            className={cn(
              'relative z-10 rounded-lg px-3 py-1 text-sm font-medium transition-colors duration-100',
              'select-none touch-none',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-ring',
              tabClassName,
              isActive
                ? cn(
                    'text-modal-surface-foreground',
                    enableSwipe && 'cursor-grab active:cursor-grabbing',
                    activeTabClassName,
                  )
                : cn(
                    'text-modal-surface-foreground/60 hover:text-modal-surface-foreground/86',
                    inactiveTabClassName,
                  ),
              option.disabled && 'cursor-not-allowed opacity-45',
            )}
          >
            {isActive ? (
              <motion.span
                layoutId={activePillLayoutId}
                transition={{ type: 'spring', stiffness: 540, damping: 36, mass: 0.55 }}
                className="absolute inset-0 -z-10 rounded-lg border border-modal-surface-border/70 bg-sidebar-item-hover-bg/75"
              />
            ) : null}
            {option.label}
          </motion.div>
        );

        if (option.tooltip) {
          return (
            <Tooltip key={option.value}>
              <TooltipTrigger asChild>
                <div className="inline-flex">{content}</div>
              </TooltipTrigger>
              <TooltipContent side="top" align="center" className="z-50">
                {option.tooltip}
              </TooltipContent>
            </Tooltip>
          );
        }

        return content;
      })}
    </div>
  );
}
