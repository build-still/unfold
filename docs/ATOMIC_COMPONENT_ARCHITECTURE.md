# atomic component architecture

this document defines where React components should live and when they should be promoted into shared layers.

## folder strategy

- shared atomic primitives:
  - `src/components/atoms/*`
  - `src/components/molecules/*`
  - `src/components/organisms/*`
  - `src/components/templates/*`
- feature-specific UI and orchestration:
  - `src/features/<feature>/components/*`
  - `src/features/<feature>/hooks/*`
  - `src/features/<feature>/containers/*`

## ownership rules

- atoms:
  - smallest presentational units.
  - no data fetching, no domain orchestration.
  - no direct store or context dependency.
- molecules:
  - composition of atoms for one focused interaction block.
  - may keep local UI state (toggle, open/closed), but no domain side effects.
- organisms:
  - bigger sections composed from molecules and atoms.
  - accept behavior through props.
- templates:
  - page-level layout skeletons and section placement.
  - no business logic.
- feature containers:
  - domain behavior, store/context wiring, routing, side effects.

## promotion checklist (feature -> shared)

promote only when all are true:

1. used in at least 2 feature areas, or expected to be reused soon.
2. behavior is domain-agnostic.
3. API can be expressed with generic props.
4. moving it will not force store/context dependencies into shared layers.

if any check fails, keep it in `src/features/<feature>`.

## naming conventions

- atoms: noun-like primitive names (`selectable-row`, `icon-action-button`).
- molecules: interaction block names (`choice-row`, `footer-action-bar`).
- feature components: domain names (`space-switcher-menu`, `create-space-modal`).

## import boundaries

- feature code can import shared atomic components.
- shared atomic components must not import from `src/features/*`.
- avoid cross-feature imports; move common code to shared layers first.
