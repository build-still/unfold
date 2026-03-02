import { cn } from '@/lib/utils';

interface ColorSwatchButtonProps {
  isActive: boolean;
  swatchClass: string;
  onClick: () => void;
  title: string;
  children?: React.ReactNode;
}

export function ColorSwatchButton({
  isActive,
  swatchClass,
  onClick,
  title,
  children,
}: ColorSwatchButtonProps) {
  return (
    <button
      className={cn(
        'w-8 h-8 rounded-lg border flex items-center justify-center transition-all hover:scale-105',
        swatchClass,
        isActive
          ? 'border-editor-swatch-active-border ring-2 ring-editor-swatch-active-ring'
          : 'border-editor-swatch-border hover:border-editor-swatch-border-hover',
      )}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
}
