import React from 'react';
import { cn } from '@/lib/utils';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { DropdownFieldShell } from '@/components/molecules/dropdown-field-shell';
import { useSystemFonts } from '@/features/settings/hooks/use-system-fonts';

interface FontPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  helperText?: string;
  monospaceOnly?: boolean;
}

const FontPicker: React.FC<FontPickerProps> = ({ label, value, onChange, error, helperText, monospaceOnly }) => {
  const availableFonts = useSystemFonts(value, monospaceOnly);

  return (
    <DropdownFieldShell
      label={label}
      displayValue={value}
      error={error}
      helperText={helperText}
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
    </DropdownFieldShell>
  );
};

export default FontPicker;
