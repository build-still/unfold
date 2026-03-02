import * as React from 'react';

interface ColorSwatchGridProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function ColorSwatchGrid({ label, children, className }: ColorSwatchGridProps) {
  return (
    <div className={className}>
      <p className="text-xs font-medium text-editor-label mb-2">{label}</p>
      <div className="grid grid-cols-5 gap-1.5">{children}</div>
    </div>
  );
}
