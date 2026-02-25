import React, { useMemo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import invoke from '@/utils/invoke';
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
  monospaceOnly?: boolean;
}

/**
 * Keywords used to identify monospace fonts from the system font list.
 * Applied as substring matches against the lowercase font family name.
 */
const MONOSPACE_KEYWORDS = [
  'mono',
  'code',
  'console',
  'courier',
  'menlo',
  'consolas',
  'hack',
  'inconsolata',
] as const;

function isMonospaceFont(fontName: string): boolean {
  const lower = fontName.toLowerCase();
  return MONOSPACE_KEYWORDS.some((kw) => lower.includes(kw));
}

let cachedSystemFonts: string[] | null = null;

const FontPicker: React.FC<FontPickerProps> = ({ label, value, onChange, error, helperText, monospaceOnly }) => {
  const [systemFonts, setSystemFonts] = useState<string[]>(cachedSystemFonts || []);

  useEffect(() => {
    if (cachedSystemFonts) return;

    let isMounted = true;
    invoke('get_system_fonts', {})
      .then((fonts) => {
        if (isMounted) {
          cachedSystemFonts = fonts;
          setSystemFonts(fonts);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch system fonts:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const availableFonts = useMemo(() => {
    const base = new Set<string>();

    if (monospaceOnly) {
      systemFonts.forEach((font) => {
        if (isMonospaceFont(font)) base.add(font);
      });
    } else {
      systemFonts.forEach((font) => base.add(font));
    }

    // Always include the current value
    if (value) base.add(value);
    
    return Array.from(base).sort((a, b) => a.localeCompare(b));
  }, [monospaceOnly, value, systemFonts]);

  return (
    <div className="space-y-1.5">
      <span className="pl-2.5 text-[10px] font-medium text-modal-surface-foreground/65">{label}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div
            role="button"
            tabIndex={0}
            className={cn(
              'flex h-8 w-full cursor-pointer items-center justify-between rounded-none border-b border-modal-surface-border/75',
              'bg-sidebar-container-bg/90 px-2.5 text-xs text-modal-surface-foreground/85',
              'transition-colors hover:bg-sidebar-item-hover-bg/25',
              'focus-visible:outline-none',
              error && 'border-destructive/50',
            )}
          >
            <span className="truncate">{value}</span>
            <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="bottom"
          sideOffset={6}
          avoidCollisions={false}
          align="start"
          className="w-34 max-h-40 overflow-y-auto gap-.5 rounded-xl border border-sidebar-container-border/80 bg-sidebar-container-bg shadow-dropdown dropdown-darker-scroll"
        >
          {availableFonts.map((font) => (
            <DropdownMenuItem
              key={font}
              onClick={() => onChange(font)}
              className={cn(
                'rounded-lg text-[11px] text-modal-surface-foreground/85 hover:bg-hover-bg-strong data-highlighted:bg-hover-bg-strong data-highlighted:text-foreground data-highlighted:shadow-menu-item',
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
