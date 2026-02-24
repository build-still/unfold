# Contributing to Unfold

## Ground rules

- Keep pull requests scoped to one concern.
- Avoid drive-by refactors unrelated to the change.
- Prefer explicit, maintainable code over clever shortcuts.
- Preserve existing behavior unless the PR intentionally changes it.

## Development setup

1. Install dependencies:
```bash
pnpm install
```

2. Run the web app:
```bash
pnpm dev
```

3. Run the desktop app:
```bash
pnpm dev:tauri
```

## Before opening a PR

Run local quality checks:

```bash
pnpm typecheck
pnpm build
```

Or run both with:

```bash
pnpm check
```

## Pull request expectations

- Include a clear summary of what changed and why.
- Link related issues.
- Include screenshots/recordings for UI changes.
- Update docs for architecture, behavior, or DX changes.
- Ensure required checks pass.

## Code style guidelines

- Use TypeScript strict typing; avoid `any` unless unavoidable.
- Keep reusable UI primitives in `src/components/common` or `src/components/ui`.
- Use design tokens from `src/styles/tailwind.css`; avoid hardcoded colors.
- Keep side effects in hooks/services, not in render paths.
- Add comments only when behavior is non-obvious.

## Commit guidelines

Use short, imperative commit titles. Example:

- `refactor: move workspace data flow to RTK Query`
- `fix: stabilize theme boot to prevent startup flash`
- `docs: add contributor onboarding guide`

## Reporting bugs and requesting features

Use GitHub issue templates to provide reproducible details and expected behavior.
