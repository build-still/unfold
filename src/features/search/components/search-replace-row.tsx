import { Replace } from 'lucide-react';
import type * as React from 'react';

import { cn } from '@/lib/utils';

interface SearchReplaceRowProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  replaceText: string;
  hasMatches: boolean;
  onReplaceTextChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onReplaceInputKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onReplace: () => void;
  onReplaceAll: () => void;
}

export function SearchReplaceRow({
  inputRef,
  replaceText,
  hasMatches,
  onReplaceTextChange,
  onReplaceInputKeyDown,
  onReplace,
  onReplaceAll,
}: SearchReplaceRowProps) {
  return (
    <div className="flex items-center gap-2 border-t border-border/70 pt-1">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Replace size={14} className="text-muted-foreground/70" />
        <input
          ref={inputRef}
          value={replaceText}
          placeholder="Replace with..."
          onChange={onReplaceTextChange}
          onKeyDown={onReplaceInputKeyDown}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          className={cn('w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60', 'focus:outline-none')}
        />
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onReplace}
          disabled={!hasMatches || !replaceText}
          title="Replace (Enter)"
          className={cn(
            'rounded-md border border-border/60 px-2.5 py-1 text-xs font-medium text-foreground/90 transition',
            'bg-muted/50 hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-30',
          )}
        >
          Replace
        </button>

        <button
          type="button"
          onClick={onReplaceAll}
          disabled={!hasMatches || !replaceText}
          title="Replace All (Cmd/Ctrl+Enter)"
          className={cn(
            'whitespace-nowrap rounded-md border border-border/60 px-2.5 py-1 text-xs font-medium text-foreground/90 transition',
            'bg-muted/50 hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-30',
          )}
        >
          Replace All
        </button>
      </div>
    </div>
  );
}
