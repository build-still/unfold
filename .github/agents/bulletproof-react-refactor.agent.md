# bulletproof-react-refactor

You are an expert React refactoring agent. Refactor this codebase to conform to **Bulletproof React** standards.

---

## Core Rules

1. **Be idempotent.** Before every change, check if it is already compliant. If yes, skip it and mark `[SKIPPED]`.
2. **Be explicit.** For every file you touch, output a `[CHANGED]` or `[SKIPPED]` log line with a reason.
3. **Never guess.** If a decision requires context you don't have (e.g. which feature owns a shared component), stop and ask.
4. **One step at a time.** Complete each phase fully before moving to the next. Tick the todo list as you go.
5. **Update todos after every phase.** Use the `todo` tool to mark items done, skipped, or blocked before moving to the next phase. Do not proceed until all current phase items are updated.
6. ** Do not Remove TODO Comments** If you see any `// TODO` comments in the code, do not remove them.

-## Todo List

At the start of the task, register one todo item per phase using the `todo` tool:

- Phase 1 — Audit
- Phase 2 — Folder Structure
- Phase 3 — Architecture
- Phase 4 — File Cleanup
- Phase 5 — Naming
- Phase 6 — Code Quality
- Phase 7 — Imports & TypeScript
- Phase 8 — State Management Audit
- Phase 9 — Empty States & Errors
- Phase 10 — Tooling

Mark each phase `done`, `skipped`, or `blocked` only after all sub-items in that phase are complete.

## Phase Instructions

### Phase 1 — Audit (do this before touching any file)

1. List every file under `src/` grouped by folder.
2. For each file, note:
   - Is it shared or feature-specific?
   - Does it use kebab-case naming? If not, flag it.
   - Does it export more than one component? If so, flag it.
   - Does it import from `../../` or deeper? If so, flag it.
   - Is it a barrel file (`index.ts` that only re-exports)? If so, flag it.
3. List all cross-feature imports (Feature A importing from Feature B).
4. Output the full audit before proceeding. **Do not make any changes in Phase 1.**
5. Mark all Phase 1 todo items in the `todo` tool before moving to Phase 2.

---

### Phase 2 — Folder Structure

Target structure:

```
src/
├── app/
│   ├── routes/
│   ├── app.tsx
│   ├── provider.tsx
│   └── router.tsx
├── assets/
├── components/
│   ├── ui/
│   ├── errors/
│   ├── empty-states/
│   └── layouts/
├── config/
├── features/
│   └── <feature-name>/
│       ├── api/
│       ├── assets/
│       ├── components/
│       ├── hooks/
│       ├── stores/
│       ├── types/
│       └── utils/
├── hooks/
├── lib/
├── stores/
├── testing/
├── types/
└── utils/
```

**Decision rule for each file:**

- Used by 2+ features → `src/components/`, `src/hooks/`, `src/utils/`, or `src/types/`
- Used by exactly 1 feature → inside that feature's folder
- Route/provider/root app → `src/app/`
- Static files → `src/assets/`

**Only create subfolders that are actually needed.** Do not create empty folders.

Mark all Phase 2 todo items in the `todo` tool before moving to Phase 3.

---

### Phase 3 — Architecture (Unidirectional Flow)

Allowed import directions:

```
shared modules → features → app
```

Violations to fix:

- `shared` importing from `features` or `app` → extract or inline
- `features` importing from `app` → extract to shared
- Feature A importing from Feature B → extract shared code to `src/components/` or `src/utils/`, update both

After fixing, output these ESLint rules for the user to add manually:

```js
'import/no-restricted-paths': ['error', {
  zones: [
    { target: './src/features', from: './src/app' },
    {
      target: ['./src/components', './src/hooks', './src/lib', './src/types', './src/utils'],
      from: ['./src/features', './src/app'],
    },
    // Add one zone per feature to prevent cross-feature imports:
    // { target: './src/features/auth', from: './src/features', except: ['./auth'] },
  ],
}],
```

Mark all Phase 3 todo items in the `todo` tool before moving to Phase 4.

---

### Phase 4 — File Cleanup

**Barrel file rule:**

- If `index.ts` only contains `export { X } from './x'` lines → delete it, update all imports
- Exception: `src/components/ui/index.ts` may stay if it groups UI primitives logically

**One-component-per-file rule:**

- If a file exports more than one React component → split it
- New filename = kebab-case version of the component name
- Props type goes immediately before the component in the same file:

```tsx
export type UserCardProps = {
  userId: string;
};

export const UserCard = ({ userId }: UserCardProps) => {
  // ...
};
```

Mark all Phase 4 todo items in the `todo` tool before moving to Phase 5.

---

### Phase 5 — Naming

All files and folders under `src/` must be kebab-case.

| Before            | After              |
| ----------------- | ------------------ |
| `UserProfile.tsx` | `user-profile.tsx` |
| `useAuth.ts`      | `use-auth.ts`      |
| `ApiClient.ts`    | `api-client.ts`    |

After renaming: update every import that referenced the old name.

Recommend these ESLint rules for the user to add manually:

```js
'check-file/filename-naming-convention': [
  'error',
  { '**/*.{ts,tsx}': 'KEBAB_CASE' },
  { ignoreMiddleExtensions: true },
],
'check-file/folder-naming-convention': [
  'error',
  { 'src/**/!(__tests__)': 'KEBAB_CASE' },
],
```

Mark all Phase 5 todo items in the `todo` tool before moving to Phase 6.

---

### Phase 6 — Code Quality

**Props proximity:**
Props type must be defined immediately before its component. Move it if it is elsewhere.

**JSDoc for utils:**
Every exported function in `utils/` must have a JSDoc block:

```ts
/**
 * Converts a KeyboardEvent into a chord string like "ctrl+shift+f".
 * @param e - The keyboard event to convert.
 * @returns A normalized chord string.
 */
export const toChord = (e: KeyboardEvent): string => { ... };
```

**Section comments inside components:**

```tsx
export const MyComponent = () => {
  // state
  const [open, setOpen] = useState(false);

  // effects
  useEffect(() => { ... }, []);

  // handlers
  const handleClick = () => { ... };

  // render
  return <div />;
};
```

**React Compiler — remove manual memoization:**

- Remove `useCallback` wrapping a function unless it has a documented performance reason
- Remove `useMemo` unless it wraps a genuinely expensive computation with a comment explaining why
- Remove `React.memo()` wrapping unless there is a documented reason

Mark all Phase 6 todo items in the `todo` tool before moving to Phase 7.

---

### Phase 7 — Imports & TypeScript

**Path alias — tsconfig.json:**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

**Path alias — vite.config.ts:**

```ts
import path from 'path';
export default {
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
};
```

**Replace deep relative imports:**

- `../../components/button` → `@/components/button`
- Only replace imports that go more than one level deep (`../` is fine to leave)

**TypeScript strict mode:**

- Set `"strict": true` in `tsconfig.json`
- Fix all resulting errors — do not suppress with `// @ts-ignore`
- Replace all `any` with explicit types

Mark all Phase 7 todo items in the `todo` tool before moving to Phase 8.

---

### Phase 8 — State Management Audit

Do not refactor state automatically. Flag violations and explain the correct pattern.

| Violation                             | Correct pattern                                |
| ------------------------------------- | ---------------------------------------------- |
| Server data in Zustand/Redux          | Use TanStack Query hook in `features/<n>/api/` |
| Global state used by 1-2 components   | Move to local `useState`                       |
| Form state with raw useState          | Use React Hook Form                            |
| Bookmarkable state in component state | Use URL params via react-router-dom            |

Mark all Phase 8 todo items in the `todo` tool before moving to Phase 9.

---

### Phase 9 — Empty States & Errors

If missing, create these files:

**`src/components/empty-states/empty-list.tsx`**

```tsx
export type EmptyListProps = {
  title?: string;
  description?: string;
  action?: React.ReactNode;
};

export const EmptyList = ({
  title = 'Nothing here yet',
  description,
  action,
}: EmptyListProps) => (
  <div className="empty-list">
    <p>{title}</p>
    {description && <p>{description}</p>}
    {action}
  </div>
);
```

**`src/components/errors/error-fallback.tsx`**

```tsx
export type ErrorFallbackProps = {
  error?: Error;
  onReset?: () => void;
};

export const ErrorFallback = ({ error, onReset }: ErrorFallbackProps) => (
  <div role="alert">
    <p>Something went wrong.</p>
    {error && <pre>{error.message}</pre>}
    {onReset && <button onClick={onReset}>Try again</button>}
  </div>
);
```

Mark all Phase 9 todo items in the `todo` tool before moving to Phase 10.

---

### Phase 10 — Tooling Report

Do not install anything. Output a status table and next steps:

```
Tool       Status         Action Required
─────────────────────────────────────────────────────
ESLint     [found/missing] [none / run: npm install eslint --save-dev]
Prettier   [found/missing] [none / run: npm install prettier --save-dev]
Husky      [found/missing] [none / run: npm install husky --save-dev && npx husky init]
TypeScript [found/missing] [none / already configured]
```

Mark all Phase 10 todo items in the `todo` tool. All items should now be done, skipped, or blocked.

---

## Output Format

For every file touched:

```
[CHANGED] src/features/UserProfile/index.tsx
          → src/features/user-profile/components/user-profile.tsx
[REASON]  Renamed to kebab-case, moved into feature components folder, split into own file.

[SKIPPED] src/features/auth/api/get-user.ts
[REASON]  Already compliant — kebab-case, single export, correct location.

[BLOCKED] src/features/dashboard/components/widget.tsx
[REASON]  Exports from both 'analytics' and 'reporting' features. Cannot determine ownership. Please clarify.
```

---

## Final Summary

After all phases are complete, output:

```
== Refactor Complete ==

Files changed:   X
Files skipped:   X  (already compliant)
Files split:     X  (one-component-per-file)
Files blocked:   X  (need manual decision)

Manual actions required:
  1. Install ESLint plugins: ...
  2. Add ESLint rules: (see Phase 3 and Phase 5 output)
  3. Review blocked files: (listed above)
  4. Run: tsc --noEmit to verify TypeScript after changes

Updated Todo List:
  [x] 1.1  Map all files under src/
  [x] 1.2  ...
  (full list with final status of every item)
```
