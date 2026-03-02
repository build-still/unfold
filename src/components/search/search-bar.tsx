import React, { useEffect, useState, useRef } from 'react';
import { useEditorState, type Editor } from '@tiptap/react';
import type { Node } from '@tiptap/pm/model';
import { TextSelection } from '@tiptap/pm/state';
import { KEYBOARD_SHORTCUTS, getShortcutDisplay } from '@/config/keyboard-shortcuts';
import { cn } from '@/lib/utils';
import { useEditorContext } from '@/contexts/EditorContext';
import { SearchInputRow } from '@/features/search/components/search-input-row';
import { SearchReplaceRow } from '@/features/search/components/search-replace-row';
import { useAppEvent, APP_EVENTS, type AppEventPayloads } from '@/lib/app-events';

/** Get the word at the given position in the document (for pre-filling find with word under cursor). */
function getWordAtPosition(doc: Node, pos: number): string {
  let start = pos;
  let end = pos;
  let found = false;
  doc.nodesBetween(pos, pos + 1, (node, from) => {
    if (found) return false;
    if (node.isText && node.text != null) {
      const text = node.text;
      const offset = pos - from;
      let s = offset;
      while (s > 0 && /\w/.test(text[s - 1] ?? '')) s--;
      start = from + s;
      let e = offset;
      while (e < text.length && /\w/.test(text[e] ?? '')) e++;
      end = from + e;
      found = true;
      return false;
    }
  });
  return !found ? '' : doc.textBetween(start, end);
}

interface SearchResultRange {
  from: number;
  to: number;
}

interface SearchStorageState {
  results?: SearchResultRange[];
  resultIndex?: number;
}

function getSearchStorage(editor: Editor | null | undefined): SearchStorageState {
  if (!editor) {
    return {};
  }

  return (editor.storage as { searchAndReplace?: SearchStorageState }).searchAndReplace ?? {};
}

export const SearchBar = React.forwardRef<HTMLDivElement>(function SearchBar(
  _props,
  ref
) {
  const shortcut = getShortcutDisplay(KEYBOARD_SHORTCUTS.FIND_IN_PAGE);
  const { pageEditorRef } = useEditorContext();
  const editor = pageEditorRef.current;

  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const shouldFocusClosestOnOpenRef = useRef(false);
  const openCursorPosRef = useRef<number | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const searchState = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx?.editor) return { matchesCount: 0, activeIndex: -1 };
      const storage = getSearchStorage(ctx.editor);
      return {
        matchesCount: storage?.results?.length || 0,
        activeIndex: storage?.resultIndex ?? -1,
      };
    },
  });
  const matchesCount = searchState?.matchesCount ?? 0;
  const activeIndex = searchState?.activeIndex ?? -1;
  
  const hasMatches = matchesCount > 0;
  const activeDisplay = hasMatches && activeIndex >= 0 ? activeIndex + 1 : 0;

  const searchInputEvent = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
  };

  const replaceInputEvent = (event: React.ChangeEvent<HTMLInputElement>) => {
    setReplaceText(event.target.value);
  };

  const closeDialog = () => {
    shouldFocusClosestOnOpenRef.current = false;
    setSearchText('');
    setReplaceText('');
    setIsOpen(false);
    if (showReplace) {
      setShowReplace(false);
    }
    if (editor) {
      editor.commands.setSearchTerm('');
    }
  };

  const focusActiveResult = () => {
    const editorToUse = pageEditorRef.current ?? editor;
    if (!editorToUse) return;

    const storage = getSearchStorage(editorToUse);
    const results = storage?.results ?? [];
    const resultIndex = storage?.resultIndex ?? -1;
    const position = results[resultIndex];

    if (!position) return;

    const { state, view } = editorToUse;
    const selection = TextSelection.create(state.doc, position.from, position.to);
    const tr = state.tr.setSelection(selection).scrollIntoView();
    view.dispatch(tr);
    if (view.dom.isConnected && !view.hasFocus()) {
      const { node } = view.domAtPos(position.from);
      const el = (node.nodeType === 3 ? node.parentNode : node) as HTMLElement | null; 
      if (el?.scrollIntoView) {
        el.scrollIntoView({ block: 'nearest', behavior: 'instant' });
      }
    }
  };

  const focusClosestResultToCursor = () => {
    const editorRef = pageEditorRef.current;
    if (!editorRef) return;
    const storage = getSearchStorage(editorRef);
    const results = storage?.results ?? [];
    if (!results.length) return;
    const cursorPos = openCursorPosRef.current ?? editorRef.state.selection.from;
    let closestIndex = 0;
    let closestDistance = Math.abs(results[0].from - cursorPos);
    for (let i = 1; i < results.length; i++) {
      const distance = Math.abs(results[i].from - cursorPos);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = i;
      }
    }
    editorRef.commands.setResultIndex(closestIndex);
    editorRef.commands.selectCurrentItem();
    focusActiveResult();
  };

  const next = () => {
    if (!editor) return;
    shouldFocusClosestOnOpenRef.current = false;
    editor.commands.nextSearchResult();
    focusActiveResult();
  };

  const previous = () => {
    if (!editor) return;
    shouldFocusClosestOnOpenRef.current = false;
    editor.commands.previousSearchResult();
    focusActiveResult();
  };

  const replace = () => {
    if (!editor) return;
    editor.commands.setReplaceTerm(replaceText);
    editor.commands.replace();
    focusActiveResult();
  };

  const replaceAll = () => {
    if (!editor) return;
    editor.commands.setReplaceTerm(replaceText);
    editor.commands.replaceAll();
  };

  const toggleCaseSensitive = () => {
    setCaseSensitive(!caseSensitive);
  };

  const toggleReplace = () => {
    setShowReplace(!showReplace);
    if (!showReplace) {
      setTimeout(() => replaceInputRef.current?.focus(), 50);
    }
  };

  useEffect(() => {
    if (!editor) return;
    editor.commands.setSearchTerm(searchText);
    const skipReset = shouldFocusClosestOnOpenRef.current && searchText.trim().length > 0;
    if (!skipReset) {
      editor.commands.resetIndex();
      editor.commands.selectCurrentItem();
      focusActiveResult();
    }
    const willFocusClosest = shouldFocusClosestOnOpenRef.current && searchText.trim() && matchesCount > 0;
    if (willFocusClosest) {
      focusClosestResultToCursor();
    }
  }, [searchText, editor]);

  useEffect(() => {
    if (!shouldFocusClosestOnOpenRef.current) return;
    if (!editor) return;
    if (!searchText.trim() || matchesCount === 0) return;
    focusClosestResultToCursor();
  }, [matchesCount, searchText, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.commands.setCaseSensitive(caseSensitive);
    editor.commands.resetIndex();
    editor.commands.selectCurrentItem();
    focusActiveResult();
  }, [caseSensitive, editor]);

  const handleOpenEvent = (detail: AppEventPayloads[typeof APP_EVENTS.OPEN_FIND_DIALOG]) => {
    const editorInHandler = pageEditorRef.current;
    const cursorPos = detail?.cursorPos ?? editorInHandler?.state.selection.from ?? null;
    setIsOpen(true);
    shouldFocusClosestOnOpenRef.current = true;
    openCursorPosRef.current = cursorPos;

    if (editorInHandler) {
      const selectedText = editorInHandler.state.doc.textBetween(
        editorInHandler.state.selection.from,
        editorInHandler.state.selection.to,
      );
      if (selectedText !== '') {
        setSearchText(selectedText);
      } else if (cursorPos != null) {
        const wordAtCursor = getWordAtPosition(editorInHandler.state.doc, cursorPos);
        if (wordAtCursor) {
          setSearchText(wordAtCursor);
        }
      }
    }

    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
  };

  const handleCloseEvent = () => {
    closeDialog();
  };

  // Listen for editor events
  useAppEvent(APP_EVENTS.OPEN_FIND_DIALOG, handleOpenEvent);
  useAppEvent(APP_EVENTS.CLOSE_FIND_DIALOG, handleCloseEvent);

  const handleSearchInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        previous();
      } else {
        next();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeDialog();
    } else if (e.altKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      toggleCaseSensitive();
    } else if (e.altKey && e.key.toLowerCase() === 'r') {
      e.preventDefault();
      toggleReplace();
    }
  };

  const handleReplaceInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        replaceAll();
      } else {
        replace();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowReplace(false);
    } else if (e.altKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      toggleCaseSensitive();
    } else if (e.altKey && e.key.toLowerCase() === 'r') {
      e.preventDefault();
      toggleReplace();
    }
  };

  return (
    <div
      ref={ref}
      className={cn(
        'pointer-events-none fixed right-4 z-40 transition-transform duration-200',
        'top-14',
        'print-hidden',
        isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
      )}
    >
      <div
        className={cn(
          'pointer-events-auto flex flex-col gap-1.5 rounded-lg border border-border',
          'bg-card/95 backdrop-blur-xl p-2 shadow-search',
          'min-w-[320px] w-[520px] max-w-[calc(100vw-2rem)]'
        )}
      >
        <SearchInputRow
          inputRef={inputRef}
          searchText={searchText}
          hasMatches={hasMatches}
          activeDisplay={activeDisplay}
          matchesCount={matchesCount}
          caseSensitive={caseSensitive}
          showReplace={showReplace}
          shortcut={shortcut}
          onSearchChange={searchInputEvent}
          onInputKeyDown={handleSearchInputKeyDown}
          onPrevious={previous}
          onNext={next}
          onToggleCaseSensitive={toggleCaseSensitive}
          onToggleReplace={toggleReplace}
          onClose={closeDialog}
        />

        {/* Replace Row */}
        {showReplace && (
          <SearchReplaceRow
            inputRef={replaceInputRef}
            replaceText={replaceText}
            hasMatches={hasMatches}
            onReplaceTextChange={replaceInputEvent}
            onReplaceInputKeyDown={handleReplaceInputKeyDown}
            onReplace={replace}
            onReplaceAll={replaceAll}
          />
        )}
      </div>
    </div>
  );
});
