import { forwardRef, useImperativeHandle } from 'react';

import { useCustomScrollbar } from '@/hooks/use-custom-scrollbar';
import { cn } from '@/lib/utils';

type ScrollableContainerProps = {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  contentId?: string;
};

export const ScrollableContainer = forwardRef<HTMLDivElement, ScrollableContainerProps>(function ScrollableContainer(
  { children, className, contentClassName, contentId },
  ref,
) {
  const {
    scrollRef,
    wrapperRef,
    thumbRef,
    trackRef,
    updateScrollbar,
    isScrollable,
    isDragging,
    thumb,
    onThumbMouseDown,
    onTrackMouseDown,
  } = useCustomScrollbar();

  useImperativeHandle(ref, () => scrollRef.current as HTMLDivElement, [scrollRef]);

  return (
    <div ref={wrapperRef} className={cn('group/scrollable relative min-h-0 h-full overflow-hidden', className)}>
      <div
        ref={scrollRef}
        id={contentId}
        className={cn(
          'h-full min-h-0 overflow-y-scroll overflow-x-hidden sidebar-native-scroll-hidden',
          contentClassName,
        )}
        onScroll={updateScrollbar}
      >
        {children}
      </div>

      <div
        ref={trackRef}
        className={cn(
          'absolute right-1 top-1 bottom-1 z-20 w-2 transition-opacity duration-150',
          isScrollable
            ? cn(
              isDragging ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none group-hover/scrollable:opacity-100 group-hover/scrollable:pointer-events-auto',
            )
            : 'opacity-0 pointer-events-none',
        )}
        onMouseDown={onTrackMouseDown}
      >
        <div
          ref={thumbRef}
          role="scrollbar"
          aria-orientation="vertical"
          className="absolute inset-x-0 rounded-full bg-sidebar-border/80 hover:bg-sidebar-foreground/80"
          style={{
            height: `${thumb.height}px`,
            transform: `translateY(${thumb.top}px)`,
          }}
          onMouseDown={onThumbMouseDown}
        />
      </div>
    </div>
  );
});
