import { CaseSensitive, ChevronDown, ChevronUp, Replace, Search as SearchIcon, X } from 'lucide-react';
import type * as React from 'react';

import { cn } from '@/lib/utils';

interface SearchInputRowProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  searchText: string;
  hasMatches: boolean;
  activeDisplay: number;
  matchesCount: number;
  caseSensitive: boolean;
  showReplace: boolean;
  shortcut: string;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onInputKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggleCaseSensitive: () => void;
  onToggleReplace: () => void;
  onClose: () => void;
}

export function SearchInputRow({
  inputRef,
  searchText,
  hasMatches,
  activeDisplay,
  matchesCount,
  caseSensitive,
  showReplace,
  shortcut,
  onSearchChange,
  onInputKeyDown,
  onPrevious,
  onNext,
  onToggleCaseSensitive,
  onToggleReplace,
  onClose,
}: SearchInputRowProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <SearchIcon size={14} className="text-muted-foreground/70" />
        <input
          ref={inputRef}
          value={searchText}
          placeholder="Find in page..."
          onChange={onSearchChange}
          onKeyDown={onInputKeyDown}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          className={cn('w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60', 'focus:outline-none')}
        />
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
        <span className="min-w-[46px] text-center font-medium tabular-nums text-foreground/85">
          {searchText.trim() ? (hasMatches ? `${activeDisplay}/${matchesCount}` : 'No results') : ''}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!hasMatches}
          title="Previous match (Shift+Enter)"
          className={cn(
            'inline-flex size-7 items-center justify-center rounded-md border border-border/60 transition',
            'bg-muted/50 hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-30',
          )}
          aria-label="Previous match"
        >
          <ChevronUp size={14} />
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!hasMatches}
          title="Next match (Enter)"
          className={cn(
            'inline-flex size-7 items-center justify-center rounded-md border border-border/60 transition',
            'bg-muted/50 hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-30',
          )}
          aria-label="Next match"
        >
          <ChevronDown size={14} />
        </button>

        <button
          type="button"
          onClick={onToggleCaseSensitive}
          title="Match case (Alt+C)"
          className={cn(
            'inline-flex size-7 items-center justify-center rounded-md border border-border/60 transition',
            caseSensitive
              ? 'border-highlight-vivid/50 bg-highlight-vivid/20 text-highlight-vivid'
              : 'bg-muted/50 text-muted-foreground/70 hover:bg-muted/80',
          )}
          aria-label="Toggle case sensitive"
        >
          <CaseSensitive size={14} />
        </button>

        <button
          type="button"
          onClick={onToggleReplace}
          title="Replace (Alt+R)"
          className={cn(
            'inline-flex size-7 items-center justify-center rounded-md border border-border/60 transition',
            showReplace
              ? 'border-highlight-vivid/50 bg-highlight-vivid/20 text-highlight-vivid'
              : 'bg-muted/50 text-muted-foreground/70 hover:bg-muted/80',
          )}
          aria-label="Toggle replace"
        >
          <Replace size={14} />
        </button>

        <button
          type="button"
          onClick={onClose}
          title={`Close (${shortcut})`}
          className={cn(
            'inline-flex size-7 items-center justify-center rounded-md text-muted-foreground/70 transition',
            'hover:bg-muted/60 hover:text-foreground',
          )}
          aria-label="Close search"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
