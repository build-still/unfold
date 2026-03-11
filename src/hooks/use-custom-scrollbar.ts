import { useCallback, useEffect, useRef, useState } from 'react';

type ScrollThumbState = {
  height: number;
  top: number;
};

const MIN_THUMB_HEIGHT = 28;
const OVERFLOW_TOLERANCE_PX = 8;

type UseCustomScrollbarResult = {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  thumbRef: React.RefObject<HTMLDivElement | null>;
  trackRef: React.RefObject<HTMLDivElement | null>;
  updateScrollbar: () => void;
  isScrollable: boolean;
  isDragging: boolean;
  thumb: ScrollThumbState;
  onThumbMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
  onTrackMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
};

export function useCustomScrollbar(): UseCustomScrollbarResult {
  const scrollRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const [thumb, setThumb] = useState<ScrollThumbState>({ height: 0, top: 0 });
  const [isScrollable, setIsScrollable] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const dragOffsetRef = useRef(0);

  const updateScrollbar = useCallback(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) {
      setIsScrollable(false);
      setThumb({ height: 0, top: 0 });
      return;
    }

    const { scrollHeight, clientHeight, scrollTop } = scrollEl;
    const overflowAmount = Math.ceil(scrollHeight - clientHeight);
    const canScroll = overflowAmount > OVERFLOW_TOLERANCE_PX;
    setIsScrollable(canScroll);

    if (!canScroll) {
      setThumb({ height: 0, top: 0 });
      return;
    }

    const thumbHeight = Math.max(MIN_THUMB_HEIGHT, (clientHeight / scrollHeight) * clientHeight);
    const maxThumbTop = Math.max(0, clientHeight - thumbHeight);
    const maxScrollTop = Math.max(1, scrollHeight - clientHeight);
    const thumbTop = (scrollTop / maxScrollTop) * maxThumbTop;

    setThumb({ height: thumbHeight, top: thumbTop });
  }, []);

  const onThumbMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const thumbRect = event.currentTarget.getBoundingClientRect();
    dragOffsetRef.current = event.clientY - thumbRect.top;
    setIsDragging(true);
  }, []);

  const onTrackMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) {
      return;
    }

    const scrollEl = scrollRef.current;
    const trackEl = trackRef.current;
    if (!scrollEl || !trackEl || !isScrollable || thumb.height <= 0) {
      return;
    }

    const trackRect = trackEl.getBoundingClientRect();
    const clickY = event.clientY - trackRect.top;
    const maxThumbTop = Math.max(1, trackRect.height - thumb.height);
    const nextThumbTop = Math.max(0, Math.min(clickY - thumb.height / 2, maxThumbTop));
    const ratio = nextThumbTop / maxThumbTop;
    const maxScrollTop = Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight);
    scrollEl.scrollTop = ratio * maxScrollTop;
    updateScrollbar();
  }, [isScrollable, thumb.height, updateScrollbar]);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) {
      return;
    }

    const onScroll = () => updateScrollbar();
    scrollEl.addEventListener('scroll', onScroll, { passive: true });

    const resizeObserver = new ResizeObserver(() => updateScrollbar());
    resizeObserver.observe(scrollEl);

    const mutationObserver = new MutationObserver(() => updateScrollbar());
    mutationObserver.observe(scrollEl, { childList: true, subtree: true, characterData: true });

    const onWindowResize = () => updateScrollbar();
    window.addEventListener('resize', onWindowResize);

    updateScrollbar();

    return () => {
      scrollEl.removeEventListener('scroll', onScroll);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', onWindowResize);
    };
  }, [updateScrollbar]);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const onMouseMove = (event: MouseEvent) => {
      const scrollEl = scrollRef.current;
      const trackEl = trackRef.current;
      if (!scrollEl || !trackEl || thumb.height <= 0) {
        return;
      }

      const trackRect = trackEl.getBoundingClientRect();
      const maxThumbTop = Math.max(1, trackRect.height - thumb.height);
      const pointerY = event.clientY - trackRect.top - dragOffsetRef.current;
      const nextThumbTop = Math.max(0, Math.min(pointerY, maxThumbTop));
      const ratio = nextThumbTop / maxThumbTop;
      const maxScrollTop = Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight);
      scrollEl.scrollTop = ratio * maxScrollTop;
      updateScrollbar();
    };

    const onMouseUp = () => setIsDragging(false);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, thumb.height, updateScrollbar]);

  return {
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
  };
}
