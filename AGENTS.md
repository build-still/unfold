# agents

## architecture boundaries

- `src/components/*` is for shared, domain-agnostic UI primitives and reusable building blocks.
  - examples: atoms, molecules, organisms, templates.
  - these should not depend on feature-specific store wiring, routing flows, or editor/search domain logic.

- `src/features/*` is for domain-specific behavior and composition.
  - examples: `src/features/sidebar/*`, `src/features/search/*`.
  - feature code can use shared components, but shared components should not import from `src/features/*`.

## why `features/search` exists

- search is not only UI; it includes feature behavior (editor integration, keyboard flow, result navigation, replace actions).
- that behavior belongs in `src/features/search/*`.
- reusable visual pieces from search can be promoted into `src/components/*` when they become domain-agnostic.

## placement rule of thumb

1. reusable + domain-agnostic => `src/components/*`
2. domain behavior/orchestration => `src/features/*`
3. if reused across 2+ features and generic, promote from feature to shared components.

## file naming convention

- use kebab-case for file and directory names in `src`:
  - good: `customizability-section.tsx`, `font-picker.tsx`, `sidebar-node-row.tsx`
  - avoid: `CustomizabilitySection.tsx`, `FontPicker.tsx`
- component identifiers can still be PascalCase inside files.
- when touching a feature area, normalize file names in that area to kebab-case if practical.

## decomposition checklist

when reviewing a large file, split in this order:

1. extract pure visual primitives into `src/components/atoms/*`.
2. extract reusable interaction blocks into `src/components/molecules/*`.
3. keep data wiring, routing, store/context orchestration in `src/features/<feature>/*`.
4. if a feature component becomes generic and reused across 2+ features, promote it to shared components.

## current decomposition audit

- the shared layer is a good start, but there are additional safe decomposition targets.
- biggest remaining targets:
  - `src/components/ui/sidebar.tsx`
  - `src/components/settings/customizability-section.tsx`
  - `src/components/toolbar/toolbar.tsx`
  - editor bubble menu family under `src/components/editor/components/bubble-menu/*`

## high-priority backlog

1. `src/components/ui/sidebar.tsx`
   - extract into:
     - `sidebar-provider`
     - `sidebar-shell-desktop`
     - `sidebar-shell-mobile`
     - `sidebar-menu-primitives`
2. `src/components/settings/customizability-section.tsx`
   - extract molecules:
     - `typography-row`
     - `row-reset-button`
     - `preview-document`
     - `customization-empty-state`
   - move reducer-like state transitions into:
     - `use-customization-draft`
3. `src/components/toolbar/toolbar.tsx`
   - extract hooks:
     - `use-export-actions`
     - `use-import-actions`
     - `use-relative-edited-time`
   - extract molecule:
     - `toolbar-sidebar-toggle`
4. `src/components/breadcrumbs/breadcrumbs.tsx`
   - extract:
     - `breadcrumbs-shell`
     - `collapsed-breadcrumb-path`
     - `breadcrumb-overflow-menu`
5. `src/components/settings/controls/font-picker.tsx`
   - extract:
     - `use-system-fonts` hook
     - `dropdown-field-shell` molecule
6. `src/features/sidebar/components/space-switcher-menu.tsx`
   - extract:
     - `inline-rename-input` molecule
     - `row-icon-actions` molecule
7. `src/components/common/delete-confirmation-modal.tsx`
   - generalize into shared `confirmation-modal` molecule with title/body/actions props
   - keep `delete-confirmation-modal` as a thin preset wrapper

## editor-specific backlog (after shell/settings)

8. `src/components/editor/components/bubble-menu/bubble-menu.tsx`
   - extract atoms:
     - `format-toolbar-button`
     - `bubble-separator`
9. `src/components/editor/components/bubble-menu/color-selector.tsx`
   - extract:
     - `color-swatch-grid`
     - `color-swatch-button`
10. `src/components/editor/components/bubble-menu/node-selector.tsx`
    and `src/components/editor/components/bubble-menu/text-alignment-selector.tsx`
    - extract shared molecule:
      - `editor-bubble-dropdown`
11. `src/components/editor/extensions/helpers/command-list-view.tsx`
    - extract molecule:
      - `command-list-item`

## duplication cleanup targets

12. unify panel shell variants (`rounded-xl border ...`) across settings/import/customization into a stricter shared panel-card API.
13. unify primary outline action button + ripple variants across modal/footer/search/editor into one shared action molecule.
14. unify label + input + helper/error field patterns (create space/import url/font picker) into one shared form-field family.

## phased execution order

1. shell/settings/shared field + action molecules
2. toolbar + breadcrumbs + sidebar space menu
3. editor bubble-menu family
