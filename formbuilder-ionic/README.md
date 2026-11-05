# formbuilder-ionic

Ionic port of the Epicollect5 formbuilder.

It is a separate entry point and build from the legacy app. The Ionic bundle
contains **no legacy code**: it renders its own DOM, owns its own event wiring
and keeps the project-definition JSON as its only state. The legacy page keeps
running next to it, against the same project file and session, so every slice
can be compared with the baseline.

```
formbuilder-ionic/
  src/
    app.js                 entry: boot the page
    pages/                 page composition
    ui/                    native renderers (shell.js, dom.js, readme-editor.js)
    views/                 fixed Ionic markup (HTML), bundled as text
    services/              project loading, session, Ionic runtime
    models/                project-definition contract, question catalogue
    theme/                 SCSS (Ionic tokens + native builder styles)
  scripts/                 esbuild/sass build and comparison server
  tests/                   Vitest + jsdom
  docs/PORTING.md          legacy inventory and slice status
  docs/ROADMAP.md          gap vs legacy and the next phases
  dist/                    generated output (ignored by git)
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
| `/epicollect5-formbuilder/ionic/` | Ionic port |
| `/epicollect5-formbuilder/public/` | legacy baseline |
| `/epicollect5-formbuilder/project/` | shared project definition |

`npm run build` writes a static `dist/` and starts no server.

## Architecture

- **The JSON is the state.** `services/session.js` holds the loaded project
  definition plus the current form index and question ref. Actions mutate the
  object in place; renderers read it. There is no store and no derived copy.
- **The UI owns its DOM.** `ui/shell.js` builds the toolbar, form tabs, question
  list and properties panel from the definition. It does not query legacy hooks
  (`.panel`, `.main__tabs`, `.inputs-collection`) and does not depend on
  Bootstrap, jQuery or Font Awesome.
- **Services stay free of DOM.** `project-source.js` loads and decodes the
  definition (plain JSON or the gzip/base64 body the Laravel endpoint returns);
  `models/project-definition.js` is a pure read layer over the contract.
- **Legacy is a reference, not a dependency.** Behaviour is ported slice by
  slice from `js/app_modules/**`; `docs/PORTING.md` tracks what is ported and
  what is still pending. `js/app.js` is not bundled into the Ionic entry.

## Status

Ported: project loading, form switching and adding, question list
(add/reorder/delete/select), basic and advanced question editing (including
uniqueness and per-type gating), readme editor (Tiptap), possible answers
(add/rename/remove/reorder, ordering, delete all, 100-per-page pagination, CSV
import/export, 150-char cap and `<` / `>` sanitisation), branches and groups
(enter/exit, nesting rules, breadcrumbs), jumps (rows, destinations, the always
variant) and validation with question copy (row and tab badges, Validate
button, duplicate with ref and answer-ref remap, duplicate answer-ref check).

Pending: undo, save/export/import, form rename/delete, and the remaining
modals/menus/toasts (the CSV panel is inline for now). The full breakdown and
the phase order are in `docs/ROADMAP.md`.

## Tests

```bash
cd formbuilder-ionic && npm test   # native modules, shell rendering, boundary
npm test                           # repository root: legacy Mocha suite
```

The legacy suite still gates shared behaviour: the project-definition contract
must not change while the port is in progress.
