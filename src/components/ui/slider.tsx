import * as SliderPrimitive from '@radix-ui/react-slider';
import * as React from 'react';

import { cn } from '@/lib/utils';

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max],
  );

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        'relative flex w-full touch-none items-center select-none',
        'data-disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative h-0.75 w-full grow overflow-hidden rounded-full bg-modal-surface-border/40"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute h-full bg-highlight-vivid"
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          data-slot="slider-thumb"
          className={cn(
            'block size-3.5 shrink-0 rounded-full',
            'bg-highlight-vivid',
            'ring-2 ring-highlight-vivid/60',
            'shadow-sm transition-shadow',
            'focus-visible:outline-none focus-visible:ring-highlight-vivid/80 focus-visible:ring-offset-1',
            'hover:ring-highlight-vivid/80',
            'cursor-grab active:cursor-grabbing',
          )}
        />
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider };
