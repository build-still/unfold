import type { CustomizationPropertyKey } from '@/types/customization';

interface TypographyPreviewDocumentProps {
  getValue: (key: CustomizationPropertyKey) => string | number | undefined;
}

export function TypographyPreviewDocument({ getValue }: TypographyPreviewDocumentProps) {
  const titleFont = String(getValue('title.fontFamily'));
  const titleSize = Number(getValue('title.fontSize'));
  const h1Font = String(getValue('h1.fontFamily'));
  const h1Size = Number(getValue('h1.fontSize'));
  const h2Size = Number(getValue('h2.fontSize'));
  const h3Size = Number(getValue('h3.fontSize'));
  const paragraphFont = String(getValue('editor.fontFamily'));
  const paragraphSize = Number(getValue('editor.fontSize'));
  const codeFont = String(getValue('code.fontFamily'));
  const codeSize = Number(getValue('code.fontSize'));

  return (
    <div className="space-y-1">
      <p style={{ fontFamily: titleFont, fontSize: titleSize }} className="leading-tight text-foreground/90 font-bold">
        document title
      </p>
      <div className="pt-2 space-y-0.5">
        <p style={{ fontFamily: h1Font, fontSize: h1Size }} className="leading-snug text-foreground/87 font-semibold">heading 1</p>
        <p style={{ fontFamily: h1Font, fontSize: h2Size }} className="leading-snug text-foreground/83 font-semibold">heading 2</p>
        <p style={{ fontFamily: h1Font, fontSize: h3Size }} className="leading-snug text-foreground/80 font-semibold">heading 3</p>
      </div>
      <p style={{ fontFamily: paragraphFont, fontSize: paragraphSize }} className="leading-relaxed text-foreground/70 pt-1">
        the quick brown fox jumps over the lazy dog. a calmer window for your thoughts.
      </p>
      <pre
        style={{ fontFamily: codeFont, fontSize: codeSize }}
        className="leading-relaxed text-editor-code-block-text bg-code-block-bg border border-editor-code-block-border rounded-md px-2.5 py-1.5 mt-1 overflow-x-auto whitespace-pre"
      >{`const thought = 'unfold it';
console.log(thought);`}</pre>
    </div>
  );
}
