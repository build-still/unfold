import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronsUpDown } from 'lucide-react';

interface FontPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  helperText?: string;
}

const FALLBACK_FONTS = [
  'Bricolage Grotesque',
  'DM Sans',
  'Google Sans Code',
  'Inter',
  'Arial',
  'Helvetica',
  'Georgia',
  'Times New Roman',
  'Courier New',
];

function getAvailableFonts(): string[] {
  if (typeof document === 'undefined' || !('fonts' in document)) {
    return FALLBACK_FONTS;
  }

  const fontSet = document.fonts as FontFaceSet;
  const families = new Set<string>();

  fontSet.forEach((fontFace) => {
    if (fontFace.family) {
      families.add(fontFace.family.replace(/^"|"$/g, ''));
    }
  });

  FALLBACK_FONTS.forEach((font) => families.add(font));

  return Array.from(families).sort((a, b) => a.localeCompare(b));
}

const FontPicker: React.FC<FontPickerProps> = ({ label, value, onChange, error, helperText }) => {
  const availableFonts = useMemo(() => getAvailableFonts(), []);

  return (
    <div className="space-y-1.5">
      <span className="text-[10px] font-medium text-modal-surface-foreground/65">{label}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div
            role="button"
            tabIndex={0}
            className={cn(
              'flex h-8 w-full cursor-pointer items-center justify-between rounded-md border-b border-modal-surface-border/75',
              'bg-sidebar-container-bg/90 px-2.5 text-xs text-modal-surface-foreground/85',
              'transition-colors hover:bg-sidebar-item-hover-bg/25',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-ring',
              error && 'border-destructive/50 ring-destructive/20',
            )}
          >
            <span className="truncate">{value}</span>
            <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="max-h-64 w-(--radix-dropdown-menu-trigger-width) overflow-y-auto border-modal-surface-border/75 bg-sidebar-container-bg"
        >
          {availableFonts.map((font) => (
            <DropdownMenuItem
              key={font}
              onClick={() => onChange(font)}
              className={cn(
                'rounded-md text-[11px] text-modal-surface-foreground/85',
                value === font && 'bg-sidebar-item-hover-bg/70 text-modal-surface-foreground',
              )}
            >
              {font}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {helperText && !error && (
        <p className="text-[10px] text-modal-surface-foreground/60">{helperText}</p>
      )}
      {error && <p className="text-[10px] text-destructive">{error}</p>}
    </div>
  );
};

export default FontPicker;
