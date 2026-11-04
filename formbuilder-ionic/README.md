# formbuilder-ionic

Isolated Ionic UI prototype for the Epicollect5 formbuilder.

It runs next to the legacy entry point, against the **same project definition and
session**, so the two UIs can be compared side by side. The legacy entry point is
untouched and remains the baseline.

```
formbuilder-ionic/
  src/
    components/   DOM adapters (icons, modals, tabs, menus, help)
    pages/        boot composition
    services/     Ionic runtime and legacy-UI installation
    models/       constants and lookup tables
    views/        Ionic shell view fragments (containers, partials)
    theme/        SCSS theme (Ionic tokens + legacy class bridge)
  scripts/        esbuild/sass build and local comparison server
  tests/          Vitest + jsdom
  dist/           generated output (ignored by git)
```

## Run

```bash
cd formbuilder-ionic
npm install
npm run dev
# http://localhost:5183/epicollect5-formbuilder/
```

`npm run dev` builds `dist/` and serves three mounts from one origin:

| URL | Content |
|---|---|
| `/epicollect5-formbuilder/` | comparison landing page |
| `/epicollect5-formbuilder/ionic/` | Ionic prototype |
| `/epicollect5-formbuilder/public/` | legacy baseline |
| `/epicollect5-formbuilder/project/` | shared project definition |

The legacy app derives `../project/project.json` from its page URL, and the Ionic
page sits at the same depth, so both entries read the identical project file. In
a Laravel deployment both entries are served under the project slug and share
the session for the same reason: no configuration differs between them.

`npm run build` produces a static `dist/` only; it does not start a server.

## How parity is preserved

The prototype does **not** fork the formbuilder. It consumes the frozen legacy
modules through esbuild aliases (`config`, `actions`, `factory`, `helpers`,
`inputs`, `loaders`, `template`, `ui-handlers`). Rendering, validation, jumps,
possible answers, undo, save, import and export therefore run the same code as
the baseline. The prototype replaces the presentation layer:

| Legacy presentation | Ionic prototype |
|---|---|
| Bootstrap CSS | `theme/` built on Ionic tokens; no Bootstrap stylesheet |
| Bootstrap JS modal / tab / dropdown / tooltip | `components/legacy-*` backed by `ion-modal`, ARIA tabs, accessible menus and labels |
| Font Awesome glyphs | `<ion-icon>` children injected in place, Font Awesome classes preserved for handlers |
| Bootstrap grid | CSS grid/flex desktop editor layout |
| `public/views/**` | `src/views/**` containers and partials; input property views are reused from the legacy tree because they are placeholder-only shells |

Input property views (`public/views/properties/**`) are copied at build time
instead of duplicated: they contain no Bootstrap JavaScript, only placeholders
and hooks consumed by the legacy template layer, and are styled by the Ionic
theme. Containers and partials that carried Bootstrap components are re-authored
under `src/views/`.

## Import validation

Form imports are validated against `schemas/project.schema.json` with Ajv
(`ajv/dist/2020` plus `ajv-formats`) in
`src/services/import-form-validation.js`. The build aliases the legacy
`helpers/import-form-validation` specifier to that module, so the prototype uses
the schema-driven checks while the legacy entry point keeps its original
validator untouched.

The schema validates structure, types and per-type constraints. The rules JSON
Schema cannot express stay in the module: ref prefixes, jump destinations and
answer-ref uniqueness, numeric `min`/`max` ordering, and conditional jumps
matching a possible answer.

## Tests

```bash
cd formbuilder-ionic && npm test
```

The legacy Mocha suite still gates shared behaviour:

```bash
npm test   # repository root
```

## Known prototype limits

- The project is a prototype: save still posts to the same endpoint as the
  legacy entry point, and save/export keep the legacy JSON contract unchanged.
- Summernote remains the readme editor vendor; the Ionic build loads the vendor
  bundle and the compatibility plugins it expects, without Bootstrap CSS.
- Print/PDF and CSV flows are inherited from the legacy modules and use the
  browser primitives they already used.
