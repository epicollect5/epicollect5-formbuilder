# AGENTS.md

## Core Rules

- Do NOT introduce TypeScript, React, Redux, a router, webpack, or a `dist/` build into the legacy app.
- Do NOT refactor unrelated code.
- Do NOT introduce new patterns unless explicitly requested.
- Follow the existing architecture and conventions in `docs/`.
- The legacy formbuilder (`js/**`, `css/**`, `public/**`) is frozen: do not restyle it, do not "modernise" it, do not convert it to Vue, and do not add a component/state framework to it.
- Do NOT change the project-definition JSON contract (field names, nesting, refs) without an explicit request; the server, the mobile app and the dataviewer consume it.

## Two Codebases

This repository holds the legacy formbuilder and, eventually, a Vue rewrite. They have different stacks, architectures and style rules. Never mix them.

### `js/`, `css/`, `public/` — legacy formbuilder (frozen style)

ES5 CommonJS bundled by Browserify, with jQuery 2.2.1 + jQuery UI 1.11.4 doing the DOM work.

- Modules use browserify-style absolute ids: `require('config/consts')`, `require('helpers/utils')`, `require('actions/validation')`. Never add relative paths (`../`, `./`) under `js/app_modules/`.
- `js/app_modules/config/formbuilder.js` is a mutable module singleton. It owns `project_definition`, cached DOM handles, undo `state`, refs (`current_form_ref`, `current_input_ref`) and the `render_action` flag. Treat it as shared runtime state, not as a store with setters.
- `project_definition` is the source of truth. On render, input objects receive a `dom` property (jQuery handles, validity flags); save and export must strip it. Do not persist `dom`.
- Views are HTML fragments in `public/views/**`, fetched at runtime through `consts.VIEWS_PATH`. A missing or renamed view fails silently at runtime — there is no compile step that catches it.
- Styling is Sass in `css/sass/` compiled to the tracked `public/css/formbuilder.css`; the vendor theme is `css/paper/` + `css/vendor/` compiled to the tracked `public/css/vendor-formbuilder.css`.
- Tests are Mocha 2.5 + Chai + jsdom (`npm test`), not a browser runner.

### `formbuilder-vue/` — Vue port (new style, greenfield)

Vue 3 + Pinia + Vite, intended to use Ionic Vue 8 and `@vue-dnd-kit/core`. **The port starts from scratch**; the existing branch content is not a reference.

- `docs/CODE-STYLE.md` applies to `formbuilder-vue/**` and nowhere else.
- Build to the mobile-app conventions: `reactive()` only, grouped `state → methods → computedScope`, no inline template logic, per-component SCSS, `@` alias imports.
- Do not copy the legacy singleton, the `dom` mutation model, or the jQuery event delegation into the port.
- The port's contract is the legacy project-definition JSON: same shapes in and out. The legacy app is the behavioural reference, not the structural one.

## Environment

- The shell may export `NODE_ENV=production`; npm then defaults to `omit=dev`, and `npm install`/`npm ci` removes Mocha, Chai, jsdom and the build toolchain. If that happens, restore with `npm ci --include=dev` before running tests or the build.
- `npm install <pkg>` re-resolves the whole tree; do not use it to "just add" a package. Prefer working inside `formbuilder-vue/` once the port has its own `package.json`.
- `npm test` is the whole legacy suite. The suite is green (155 passing); a failing test is a regression, not a known baseline.

## Build

- `npm run build` runs `gulp` (default: `vendor-js → vendor-css → sass → browserify`). It **rewrites four tracked files**:
  - `public/js/formbuilder.js` (+ ignored `.map`)
  - `public/js/vendor-formbuilder.js`
  - `public/css/formbuilder.css`
  - `public/css/vendor-formbuilder.css`
- Do NOT run `npm run build` for docs, agent-config or test-only changes. It creates a large, unrelated diff and can hide real changes in the bundle.
- `gulp watch` uses watchify and writes unminified `public/js/formbuilder.js`; `gulp debug` does the same without watch. `npm run build` uses the minified `browserify` task.
- `gulp vendor-js` concatenates `js/vendor/*.js`; it currently orders `jquery-2.1.4.min.js` first even though the file is not present in `js/vendor/` and the browser loads jQuery 2.2.1 from a CDN. Do not rely on the vendor bundle for jQuery.

## Refactoring Rules

A behaviour-preserving refactor changes structure while preserving behaviour, contracts, and trust boundaries.

* Trust existing internal contracts. Tests, established calling patterns, project-definition shapes and model invariants are evidence of intended data shapes.
* New guards, validation, fallbacks, catch blocks, or abstractions require a concrete justification — identify the specific boundary or demonstrated failure mode that requires them. The mere possibility that a value could be invalid is not sufficient.
* Unrelated hardening is outside the scope of a refactor.
* Prefer minimal diffs.

## Architecture Constraints

### Legacy app (`js/app_modules/`)

- `actions/` = behaviour: parse/render orchestration, validation, save modules, jumps, undo, possible answers.
- `config/` = the runtime singleton, constants, messages, init and native extensions.
- `factory/` = input and form constructors, prototypes and property definitions.
- `helpers/` = pure-ish helpers (URL/ref derivation, UI helpers, import validation).
- `inputs/` = one module per question type; each defines its own HTML and property panel hooks.
- `loaders/` = startup loading of the project, containers, partials and property views.
- `template/` = HTML builders for the properties panel, uniqueness, advanced properties, jumps and possible answers.
- `ui-handlers/` = jQuery UI draggable/sortable wiring and delegated event callbacks.
- `public/views/` = the HTML the loaders fetch; `public/index.html` hosts the shell and the cache buster.

Legacy conventions: 4-space indentation, single quotes, semicolons, `'use strict'`, and `/* global $, toastr */` where needed. Do not build DOM inline where the existing template/partial pattern is used.

### Vue port (`formbuilder-vue/src/`)

- `components/` = UI only.
- `pages/` = route-level components.
- `stores/` = shared reactive state.
- `services/` = API and workflow-facing code.
- `models/` = shared shapes/constants.
- `use/` = reusable Vue composition logic.
- `theme/` = per-component SCSS, mirroring `components/` 1:1.

## Vue Rules

*(applies to `formbuilder-vue/**` only)*

- Use `reactive()`, NEVER `ref()`.
- No inline logic in templates; no inline arrow functions in `@click`.
- Group structure: `state → methods → computedScope`.
- Always wrap `if`/`else`/`for`/`while` bodies in `{}`, even single statements.
- Do NOT place workflow or business logic in components.
- Import via the `@` alias only; `@/*` resolves to `formbuilder-vue/src/*`.
- Per-component SCSS: `<style src="@/theme/media/Component.scss" lang="scss">`; the theme tree mirrors the component tree.
- Never spread `state` in the returned object; return `{ state, ...methods, ...computedScope }`.
- The new port must include the `@` alias and the per-component SCSS pipeline from day one.

## Testing

### Legacy (`js/test/`, `js/test.js`)

- Run the whole suite with `npm test` (Mocha 2.5 + Chai + jsdom).
- Run a single file with:
  `VERBOSE=1 npx mocha --require ./js/test/setup-node.js js/test/<name>.test.js`
- **A new test file never runs unless it is required in `js/test.js`.** The aggregator is the only entry point; `mocha.opts` points at `js/test.js`.
- `js/test/isJumpValid.test.js` exists but is **not registered** in `js/test.js`. This is a known defect, not a pattern to copy.
- `js/test/setup-node.js` sets `NODE_PATH` to `js/app_modules` + `js/test`, builds a jsdom window, loads jQuery from `node_modules` (3.7.1) and evaluates `public/js/vendor-formbuilder.js`. The browser loads jQuery **2.2.1** from a CDN; a green suite is not proof of browser parity. Smoke-test jQuery-UI-dependent changes in a browser.
- Tests fetch fixtures with relative URLs served from `js/test/` by the XHR shim; keep fixtures beside the tests.

### Vue port (`formbuilder-vue/`)

- Use Vitest only; import from `vitest`; use `vi.fn()`/`vi.spyOn()`.
- Run with `cd formbuilder-vue && NODE_ENV=test npx vitest run <file>`; the prefix is required.

## Import Paths

- Legacy: absolute `js/app_modules`-rooted imports (`config/consts`, `helpers/utils`); never relative.
- Vue port: always `@/...`; never deep relative paths.

## Search Tools

- For file search and content grep, use the fff MCP tools — `mcp__fff__find_files` (paths), `mcp__fff__grep` (content), `mcp__fff__multi_grep` (several patterns at once) — instead of built-in grep/glob or shell `grep`/`find`/`ls`. Put the known directory or module in the first search; read more source only when the returned lines need context.
- For symbol-level questions (call paths, "how does X work", blast radius), use codegraph — `mcp__codegraph__codegraph_explore`. One call returns verbatim source grouped by file plus the call path.
- fff indexes the **git-tracked** tree and respects `.gitignore`. On `master` the Vue port has no source; once the rewrite is committed it is searchable. Read gitignored files directly.
- codegraph indexes the repository except `public/js/**`, `js/vendor/**`, `css/paper/**` and `doc/**` (see `codegraph.json`). It does not index configs, docs, stylesheets, HTML views or build files — read those directly.
- For a known file, read it; do not use search tools to open it.

## Priority Rules

- `docs/CODE-STYLE.md` overrides generic Vue best practices, for `formbuilder-vue/**` only.
- Existing legacy patterns win over external examples; do not apply Vue advice to `js/**`.
- `docs/ARCHITECTURE.md` is the source of truth for design; `docs/legacy-known-defects.md` lists behaviour not to reproduce.

## System Risks Check (MANDATORY for new features)

Applies to: **new features, new data flows, new persistence/state, and new external integrations.**
Does **not** apply mechanically to behaviour-preserving refactors — see Refactoring Rules above.

For work in scope, do NOT assume correctness. Identify how the new behaviour can break.

You MUST:

* List ways data can become stale or inconsistent.
* Check what happens when underlying data changes or is removed.
* Consider failures: network, partial execution, concurrency.
* Identify anything cached/stored and when it becomes invalid.
* Consider side effects on other parts of the system.

List at least three concrete risks specific to the new behaviour.
If none, justify why for each point.

Assume this runs at scale and causes inconsistencies after months in production.

## Git

Commit messages follow Conventional Commits:

- Format: `<type>(<scope>): <description>` — scope is optional for docs, test and chore commits
- Allowed types: feat, fix, refactor, perf, docs, test, build, ci, chore, style, revert
- Use imperative mood (e.g. "add", "fix", "remove")
- Do not capitalize the first word of the description
- Do not end the description with a period
- Maximum 75 characters total, including type and scope
- If the change includes both a fix and a feature, prefer the type that best reflects the primary purpose

## Source of Truth

- Architecture → `docs/ARCHITECTURE.md`
- Code style (Vue port) → `docs/CODE-STYLE.md`
- Known legacy defects → `docs/legacy-known-defects.md`
- Commit and review rules → `.github/commit-rules.md`, `.github/review-guidelines.md`
- Custom agent commands → `.agents/skills/*/SKILL.md` (canonical; wrappers in `.opencode/commands/`)
