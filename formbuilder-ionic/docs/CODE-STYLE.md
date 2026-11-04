# AI Rules — Epicollect5 Formbuilder (Ionic prototype)

These rules define the required coding style for the **Ionic prototype only**.

> **Scope: `formbuilder-ionic/**`.**
> The legacy jQuery application under `js/**`, `css/**` and `public/**` keeps its
> existing conventions and is **not** restyled or refactored.
> Nothing in this file applies to `formbuilder-vue/**` either; that port has
> `docs/CODE-STYLE.md`.

This file adapts the mobile app's Vue conventions to **vanilla JavaScript + Ionic
Core custom elements**. Vue-only rules are removed and replaced with the vanilla
equivalents called out below.

## Why This Style Exists

The Ionic prototype is a UI-layer prototype over the legacy formbuilder. It must
be predictable to read next to the legacy app and hard to confuse with the Vue
port. Consistency over "modern framework" patterns.

## Stack

- Ionic Core 8 web components + Ionicons, loaded from the pinned packages.
- Vanilla ES modules, bundled by esbuild. No Vue, no React, no TypeScript.
- jQuery 2.2.1 + jQuery UI 1.11.4 remain the drag-and-drop engine, exactly as in
  the legacy app.
- The legacy `js/app_modules/**` code is the behavioural source of truth and is
  consumed unmodified through aliases.

## Architecture

```
src/
  components/   UI adapters: DOM behaviour only (icons, modals, tabs, menus, help)
  pages/        entry-level composition, boot order only
  services/     runtime wiring, Ionic setup, legacy UI installation
  models/       shared constants and lookup tables (no DOM, no side effects)
  theme/        SCSS, mirroring components/ 1:1 plus shared layout/control partials
```

Rules:

- **Components** may touch the DOM and jQuery. They must not load projects, save,
  validate or implement formbuilder workflow logic.
- **Services** wire things together and own integration points. No workflow
  business logic either: validation, undo, save and jumps stay in the legacy
  modules.
- **Models** are pure data/constants. No DOM access, no jQuery, no side effects.
- **Pages** only decide boot order. No UI markup and no event handlers.
- The **legacy project-definition JSON remains the single source of truth**. DOM
  interactions update that object through the legacy modules; rendering,
  validation, undo and save/export read the same object.
- **Do not introduce a store or a state-management library.** The prototype adds
  presentation only.

### Vanilla equivalents of the Vue rules

| Vue rule | Vanilla equivalent here |
|---|---|
| `reactive()` state | Plain module-level objects owned by the legacy singleton (`config/formbuilder`) or local constants. Never a new reactive store. |
| `state → methods → computedScope` | `constants → functions → pure derivations` inside each module: exported constants first, then functions that change state, then functions that only return values. |
| no inline template logic | Markup lives in view files or explicit template functions. Event handlers contain no markup strings. |
| no inline arrow functions in templates | Bind handlers by delegated selector or a named function; never an anonymous inline handler in markup. |
| per-component SCSS | One partial per component under `theme/components/`, named after the component file. |
| `@` alias imports | Use `@/...` only; never `../` between `src/` modules. Cross-tree imports use the `legacy/` alias. |

## Module Rules

- ES modules (`import` / `export`), `'use strict'` semantics, single quotes,
  semicolons.
- Two-space indentation.
- `const` by default, `let` only when reassignment is required. Never `var`.
- Always wrap `if`/`else`/`for`/`while` bodies in `{}`, even single statements.
- No trailing commas.
- Prefer small named functions over anonymous callbacks; export only what the
  page or another component needs.
- Do not add comments that restate the code. Comment only non-obvious legacy
  coupling (why a hook must keep its class, for example).

## DOM Rules

- **Preserve legacy IDs, classes and data hooks** in views. The legacy modules
  query them directly and a missing hook fails silently at runtime.
- Ionic custom elements are used where their values are not driven by legacy
  jQuery code. Controls that legacy code reads/writes with `.val()`, `.prop()`,
  `.attr()` or `.find('input')` stay native elements styled with Ionic tokens.
- Every dynamically generated Font Awesome `<i>` is upgraded in place to an
  `<ion-icon>` child. Never remove the Font Awesome class names: validation and
  delegated handlers use them as state.
- Bootstrap JavaScript is not loaded. `components/legacy-*` provide the
  replacement behaviour on top of Ionic `ion-modal`, ARIA tabs, accessible menus
  and accessible labels.

## Theme Rules

- Ionic tokens first (`--ion-color-*`, `--ion-background-color`, spacing scale),
  custom properties second, hard-coded values last.
- Per-component partials live in `theme/components/` and mirror `components/`.
- Shared surfaces (panels, controls, tabs) live in `theme/` root partials.
- No stylesheet may be imported by a JavaScript module; `index.html` owns links.
- Do not copy Bootstrap CSS. Classes kept for legacy hooks are styled by the
  prototype theme with Ionic tokens.

## Testing

- Vitest only, jsdom environment.
- Import from `vitest`; use `vi.fn()` / `vi.spyOn()`.
- Run with `cd formbuilder-ionic && npx vitest run <file>`.
- Tests must not require a real browser or network: stub `ion-modal` where the
  Ionic overlay lifecycle is needed.
- The legacy Mocha suite (`npm test` at the repository root) remains the parity
  gate for shared behaviour and must stay green.

## Anti-Patterns (STRICT)

- Do not add Vue, React, a router, webpack, TypeScript or a `dist/` build inside
  `public/`.
- Do not modify `js/app_modules/**` to make the Ionic UI fit. Adapt the UI layer.
- Do not load Bootstrap CSS or JavaScript in the Ionic entry point.
- Do not introduce a state store.
- Do not port or restyle the legacy app.
