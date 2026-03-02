import { useEffect, useMemo, useState } from 'react';

import invoke from '@/utils/invoke';

const BUNDLED_WEB_FONTS = ['Bricolage Grotesque', 'DM Sans', 'Google Sans Code'] as const;

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
  return MONOSPACE_KEYWORDS.some((keyword) => lower.includes(keyword));
}

let cachedSystemFonts: string[] | null = null;

export function useSystemFonts(currentValue: string, monospaceOnly?: boolean) {
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
      .catch((error) => {
        console.error('Failed to fetch system fonts:', error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return useMemo(() => {
    const base = new Set<string>();

    if (monospaceOnly) {
      systemFonts.forEach((font) => {
        if (isMonospaceFont(font)) {
          base.add(font);
        }
      });
    } else {
      BUNDLED_WEB_FONTS.forEach((font) => base.add(font));
      systemFonts.forEach((font) => base.add(font));
    }

    if (currentValue) {
      base.add(currentValue);
    }

    return Array.from(base).sort((a, b) => a.localeCompare(b));
  }, [currentValue, monospaceOnly, systemFonts]);
}
