import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { animate, type AnimationPlaybackControls } from "motion";
import type {
  CommandListProps,
} from "@/components/editor/components/slash-menu/types";
import { CommandListItem } from "./command-list-item";

type CommandListRef = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
};

const MAX_VISIBLE_ITEMS = 6;

const CommandList = forwardRef<CommandListRef, CommandListProps>(
  ({ items, command, editor }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const viewportRef = useRef<HTMLDivElement>(null);
    const scrollAnimationRef = useRef<AnimationPlaybackControls | null>(null);

    const flatItems = useMemo(() => {
      return Object.values(items)
        .flat()
        .filter((item) => !item.disable || !item.disable(editor));
    }, [editor, items]);

    const selectItem = useCallback(
      (index: number) => {
        const item = flatItems[index];
        if (!item) return;
        command(item);
      },
      [command, flatItems],
    );

    const upHandler = useCallback(() => {
      if (!flatItems.length) return;
      setSelectedIndex((prev) => (prev + flatItems.length - 1) % flatItems.length);
    }, [flatItems.length]);

    const downHandler = useCallback(() => {
      if (!flatItems.length) return;
      setSelectedIndex((prev) => (prev + 1) % flatItems.length);
    }, [flatItems.length]);

    const enterHandler = useCallback(() => {
      selectItem(selectedIndex);
    }, [selectItem, selectedIndex]);

    useImperativeHandle(
      ref,
      () => ({
        onKeyDown: ({ event }) => {
          if (event.key === "ArrowUp") {
            upHandler();
            return true;
          }
          if (event.key === "ArrowDown") {
            downHandler();
            return true;
          }
          if (event.key === "Enter") {
            enterHandler();
            return true;
          }
          return false;
        },
      }),
      [downHandler, enterHandler, upHandler],
    );

    useEffect(() => {
      setSelectedIndex(0);
    }, [flatItems]);

    useEffect(() => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      const itemElements = Array.from(
        viewport.querySelectorAll<HTMLElement>("[data-item-index]"),
      );
      if (!itemElements.length) return;

      const currentScrollTop = viewport.scrollTop;
      const firstItemTop = itemElements[0].offsetTop;
      const visibleCount = Math.min(MAX_VISIBLE_ITEMS, itemElements.length);

      let currentTopIndex = 0;
      for (let i = 0; i < itemElements.length; i += 1) {
        if (itemElements[i].offsetTop - firstItemTop <= currentScrollTop + 1) {
          currentTopIndex = i;
        } else {
          break;
        }
      }

      const currentBottomIndex = Math.min(
        itemElements.length - 1,
        currentTopIndex + visibleCount - 1,
      );

      let nextTopIndex = currentTopIndex;
      if (selectedIndex < currentTopIndex) {
        nextTopIndex = selectedIndex;
      } else if (selectedIndex > currentBottomIndex) {
        nextTopIndex = selectedIndex - visibleCount + 1;
      }

      const maxTopIndex = Math.max(0, itemElements.length - visibleCount);
      nextTopIndex = Math.max(0, Math.min(nextTopIndex, maxTopIndex));
      const nextScrollTop = Math.max(
        0,
        (itemElements[nextTopIndex]?.offsetTop ?? firstItemTop) - firstItemTop,
      );

      if (Math.abs(nextScrollTop - currentScrollTop) < 1) return;

      scrollAnimationRef.current?.stop();
      scrollAnimationRef.current = animate(currentScrollTop, nextScrollTop, {
        duration: 0.24,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (latest) => {
          viewport.scrollTop = latest;
        },
      });
    }, [selectedIndex]);

    useEffect(() => {
      return () => {
        scrollAnimationRef.current?.stop();
      };
    }, []);

    useEffect(() => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      scrollAnimationRef.current?.stop();
      viewport.scrollTop = 0;
    }, [flatItems]);

    if (!flatItems.length) return null;

    let runningIndex = -1;

    return (
      <div
        id="slash-command"
        className="max-h-slash-menu w-[300px] overflow-y-auto overscroll-contain rounded-2xl border border-sidebar-container-border/80 bg-sidebar-container-bg p-1.5 shadow-dropdown [scrollbar-width:none] [&::-webkit-scrollbar]:h-0 [&::-webkit-scrollbar]:w-0"
        ref={viewportRef}
      >
        {Object.entries(items).map(([category, categoryItems]) => {
          const visibleItems = categoryItems.filter(
            (item) => !item.disable || !item.disable(editor),
          );
          const showCategoryLabel =
            Object.keys(items).length > 1 || category.toLowerCase() !== "basic";

          if (!visibleItems.length) return null;

          return (
            <div key={category} className="mb-1.5 last:mb-0">
              {showCategoryLabel ? (
                <div className="px-2.5 py-1 text-xs font-medium capitalize tracking-tight text-foreground-muted-secondary">
                  {category}
                </div>
              ) : null}
              <div className="flex flex-col gap-0.5">
                {visibleItems.map((item) => {
                  runningIndex += 1;
                  const isSelected = runningIndex === selectedIndex;

                  return (
                    <CommandListItem
                      key={`${category}-${item.title}-${runningIndex}`}
                      category={category}
                      index={runningIndex}
                      item={item}
                      isSelected={isSelected}
                      onSelect={selectItem}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  },
);


export default CommandList;
