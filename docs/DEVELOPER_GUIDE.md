# Developer Guide

This guide explains how Unfold is organized and how to extend it safely.

## 1. Architecture at a glance

Unfold has four main layers:

1. UI layer (React components)
2. App state layer (Redux Toolkit + RTK Query)
3. Client services layer (Tauri store + SQLite access)
4. Desktop host layer (Tauri Rust commands)

UI components should stay focused on rendering and event handling. Data fetching and persistence should flow through RTK Query endpoints in `src/store/api/app-api.ts`.

## 2. Directory structure

```text
src/
  components/
    common/            # Reusable app-level components
    editor/            # TipTap editor UI, extensions, styles
    sidebar/           # Sidebar tree and space controls
    toolbar/           # Top toolbar and settings modal
    ui/                # Shared low-level UI primitives
  contexts/            # Backward-compatibility wrappers around store hooks
  hooks/               # Feature hooks and interaction hooks
  layout/              # Top-level page layout shells
  router.tsx           # Route tree (TanStack Router)
  services/            # Persistence adapters (db, settings store)
  store/
    api/               # RTK Query APIs
    hooks/             # Store-aware hooks
    slices/            # Local UI state slices
    selectors.ts       # Derived selectors
  styles/
    tailwind.css       # Tailwind imports + tokens + global style system
  utils/               # Pure utilities and export helpers
  workers/             # Web workers (PDF rendering)
```

## 3. State management conventions

### Source of truth

- Remote/persisted app data: RTK Query (`appApi`)
- View/UI state: Redux slices (for example `ui-slice.ts`)

### Do

- Add new data operations to `appApi` endpoints.
- Use `updateQueryData` for optimistic updates when useful.
- Keep selectors stable and narrow to reduce rerenders.

### Avoid

- New feature state in React Context.
- Direct persistence calls from random components.

## 4. Routing conventions

Routes are defined in `src/router.tsx` using TanStack Router.

- Keep route components lightweight.
- Put logic in hooks/store selectors.
- For new pages, add a route and keep layout composition in `layout/`.

## 5. Editor extension conventions

Editor implementation lives under `src/components/editor`.

- Extensions: `src/components/editor/extensions`
- Node views and editor UI: `src/components/editor/components`
- Editor tokens/classes: `src/components/editor/styles`

When adding an extension:

1. Define extension in `extensions/`
2. Register it in `page-editor.tsx` (or specific editor)
3. Add styles via tokens in `src/styles/tailwind.css` and use semantic classes
4. Validate keyboard interactions and selection behavior

## 6. Styling system rules

Global style system is in `src/styles/tailwind.css`.

- Keep `src/App.css` for app-level resets only.
- Add or reuse CSS variables for new colors/spacing.
- Prefer semantic token names (purpose-based, not color-based).
- Avoid hardcoded colors in components.

See `docs/COLOR_SYSTEM.md` for token guidance.

## 7. Performance guidelines

- Use narrow selectors for list/tree items.
- Memoize expensive derived values with `useMemo` when needed.
- Keep render functions pure; move side effects into hooks.
- Prefer optimistic cache updates over full refetch when safe.

## 8. Adding a new feature (recommended flow)

1. Define user behavior and route impact.
2. Add/update RTK Query endpoint(s).
3. Add selectors or store hooks.
4. Build or update reusable UI primitives first.
5. Integrate feature into page components.
6. Update docs if architecture or conventions changed.
7. Run checks:

```bash
pnpm check
```

## 9. Quality gates

Current required checks:

- TypeScript typecheck (`pnpm typecheck`)
- Production build (`pnpm build`)

All pull requests should pass both checks locally and in any configured repository automation.

## 10. Legacy compatibility note

`src/contexts/*` currently provide compatibility wrappers so existing component imports continue to work while state remains store-backed. New work should prefer direct store hooks over new context patterns.
