# Unfold

Unfold is a Tauri + React + TypeScript note-taking app focused on fast keyboard-first editing, nested pages, and rich content export.

## Tech stack

- Tauri 2 (Rust backend + desktop shell)
- React 19 + TypeScript
- TanStack Router
- Redux Toolkit + RTK Query
- TipTap editor
- Tailwind CSS v4 token system

## Prerequisites

- Node.js 20+
- pnpm 9+
- Rust toolchain (for Tauri desktop builds)
- Platform-specific Tauri prerequisites: [Tauri setup docs](https://tauri.app/start/prerequisites/)

## Quick start

```bash
pnpm install
pnpm dev
```

Run desktop app:

```bash
pnpm dev:tauri
```

## Common scripts

- `pnpm dev`: web dev server
- `pnpm dev:tauri`: Tauri desktop dev mode
- `pnpm typecheck`: TypeScript validation
- `pnpm build`: production build
- `pnpm check`: full local gate (`typecheck` + `build`)

## Project docs

- Developer guide: [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md)
- Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Contribution workflow: [CONTRIBUTING.md](CONTRIBUTING.md)
- Color and design token system: [docs/COLOR_SYSTEM.md](docs/COLOR_SYSTEM.md)
- Code of conduct: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- Security policy: [SECURITY.md](SECURITY.md)
- Changelog: [CHANGELOG.md](CHANGELOG.md)

## Quality gates

Local required checks:

- `pnpm install --frozen-lockfile`
- `pnpm typecheck`
- `pnpm build`

If repository automation is configured, pull requests should pass those checks as well.

## Contributing

Contributions are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md) for branch/PR expectations and required checks.

## License

[MIT](LICENSE)
