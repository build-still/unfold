import { forwardRef, useImperativeHandle, useState } from 'react';

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
  const [isHovered, setIsHovered] = useState(false);
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
    <div
      ref={wrapperRef}
      className={cn('relative min-h-0 h-full overflow-hidden', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
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
              (isDragging || isHovered)
                ? 'opacity-100 pointer-events-auto'
                : 'opacity-0 pointer-events-none',
            )
            : 'opacity-0 pointer-events-none',
        )}
        onMouseDown={onTrackMouseDown}
      >
        <div
          ref={thumbRef}
          role="scrollbar"
          aria-orientation="vertical"
          className={cn(
            'absolute inset-x-0 rounded-full transition-colors duration-120',
            isDragging
              ? 'bg-scrollbar-thumb-hover'
              : 'bg-scrollbar-thumb-default hover:bg-scrollbar-thumb-hover',
          )}
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
