import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';

interface SizeSliderChipProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}

export function SizeSliderChip({ label, value, onChange, min, max }: SizeSliderChipProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between pl-2.5">
        <span className="text-[10px] font-medium text-modal-surface-foreground/65">{label}</span>
        <span className="text-[10px] tabular-nums font-medium text-modal-surface-foreground/80">{value}px</span>
      </div>
      <div
        className={cn(
          'flex h-8 w-full items-center gap-2 rounded-none border-b border-modal-surface-border/75',
          'bg-sidebar-container-bg/90 px-2.5',
        )}
      >
        <span className="shrink-0 text-[9px] tabular-nums text-modal-surface-foreground/55">{min}</span>
        <Slider
          min={min}
          max={max}
          step={1}
          value={[value]}
          onValueChange={([next]) => onChange(next)}
          className="flex-1"
        />
        <span className="shrink-0 text-[9px] tabular-nums text-modal-surface-foreground/55">{max}</span>
      </div>
    </div>
  );
}
