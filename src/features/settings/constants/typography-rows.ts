import type { CustomizationPropertyKey } from '@/types/customization';

export const HEADING_SCALE_MIN = 14;
export const HEADING_SCALE_MAX = 52;
export const TITLE_FONT_SIZE_MAX = 47;

export interface TypographyRowConfig {
  label: string;
  fontKey: CustomizationPropertyKey;
  sizeKey: CustomizationPropertyKey;
  monospaceOnly?: boolean;
}

export const TYPOGRAPHY_ROWS: TypographyRowConfig[] = [
  { label: 'title', fontKey: 'title.fontFamily', sizeKey: 'title.fontSize' },
  { label: 'heading', fontKey: 'h1.fontFamily', sizeKey: 'h1.fontSize' },
  { label: 'paragraph', fontKey: 'editor.fontFamily', sizeKey: 'editor.fontSize' },
  { label: 'code block', fontKey: 'code.fontFamily', sizeKey: 'code.fontSize', monospaceOnly: true },
];

export const HEADING_FONT_KEYS: CustomizationPropertyKey[] = ['h1.fontFamily', 'h2.fontFamily', 'h3.fontFamily'];
export const HEADING_SIZE_KEYS: CustomizationPropertyKey[] = ['h1.fontSize', 'h2.fontSize', 'h3.fontSize'];
