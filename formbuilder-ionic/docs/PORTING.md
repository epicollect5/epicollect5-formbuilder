# Porting inventory

The legacy formbuilder under `js/`, `css/` and `public/` is the behavioural
reference. The Ionic app keeps the same project-definition JSON and its own DOM;
it does not bundle, load or query legacy presentation code.

`js/app.js` is **not** part of the Ionic build. The legacy page keeps running at
`/epicollect5-formbuilder/public/index.html` against the same project file and
session, so each slice can be compared side by side.

## Vite and comparison server

Vite is the only build and development server for this prototype. Ionic Core,
Ionicons, jQuery, jQuery UI and the other npm dependencies are imported from
their pinned packages and bundled locally; do not load Ionic from a CDN. The
Vite config owns the `@` source alias and the aliases that map frozen legacy
module IDs such as `config/*` and `helpers/*` into `js/app_modules/**`.

Use Vite's `?raw` imports for HTML fragments and its Sass pipeline for the
Ionic theme linked by `src/index.html`. Avoid separate esbuild, Sass or asset
copy scripts where Vite's configured pipeline can do the work.

The dev server must preserve the comparison workflow on port 5183:

- `/epicollect5-formbuilder/ionic/` serves the Vite app.
- `/epicollect5-formbuilder/public/` serves the legacy baseline from `public/`.
- `/epicollect5-formbuilder/project/` serves the shared project files.
- `POST /epicollect5-formbuilder/project/project.json` writes the local project
  definition used by both comparison entries.

The production build writes only `formbuilder-ionic/dist/`, with asset paths
that work under `/epicollect5-formbuilder/ionic/`. Keep the comparison-server
middleware development-only; never put generated output in the legacy app.

> **Scope rule for this branch.** Change only `formbuilder-ionic/**`. The legacy
> app (`js/**`, `css/**`, `public/**`, the root `package.json` and `gulpfile.js`)
> is frozen reference material: read it to port behaviour, never edit it. New
> dependencies (jQuery 4, jQuery UI 1.14.2, Tiptap) and every fix live in
> `formbuilder-ionic/`.

## Legacy inventory by responsibility

| Responsibility | Legacy source | Port target | Status |
|---|---|---|---|
| Project definition contract | shapes in `project/project.json`, `schemas/project.schema.json` | `src/models/project-definition.js` | ported |
| Question catalogue (types, labels, icons) | `config/consts.js`, `helpers/utils.getInputToolIcon` | `src/models/question-types.js` | ported |
| Project loading (JSON + gzip/base64) | `loaders/load-project.js`, `helpers/utils.setProjectURL` | `src/services/project-source.js` | ported |
| Current form / current question / edits | `config/formbuilder.js` singleton | `src/services/session.js` | ported |
| Shell chrome (back, exit, add form, undo, save) | `ui-handlers/event-handler-callbacks/*`, `config/init.js`, `helpers/utils.goBack` | `src/ui/shell.js`, `src/services/navigation.js`, `src/services/session.js` | ported (phase 7) |
| Shell, form switching, question list, selection | `loaders/load-containers.js`, `actions/parse/**`, `ui-handlers/*sortable*` | `src/ui/shell.js` | ported (slice 1) |
| Basic question editing (text, required, title) | `actions/parse`, `actions/validation`, `inputs/**` | `src/ui/shell.js` | ported (slice 2, minimal) |
| Drag and drop (tool to question list, question and answer reordering) | `ui-handlers/sortable.js`, `ui-handlers/possible-answers-sortable.js` | `src/ui/sortable.js` | ported (jQuery UI 1.14 on jQuery 4, vendored from node_modules) |
| Adding / reordering / deleting questions | `ui-handlers/sortable.js`, `actions/input-collection*`, `factory/input-factory.js` | `src/factory/input-factory.js`, `src/factory/refs-factory.js`, `src/services/session.js`, `src/ui/shell.js` | ported (slice 2) |
| Possible answers (add, rename, remove, sort) | `actions/possible-answers*.js`, `template/methods/getPossibleAnswers*` | `src/models/possible-answers.js`, `src/services/possible-answers.js`, `src/ui/shell.js` | ported (slice 3) |
| Possible answers CSV import/export, pagination, ordering, delete all | `actions/possible-answers.js`, `actions/possible-answers-pager.js`, `ui-handlers/event-handler-callbacks/confirm-import-possible-answers-callback.js` | `src/services/possible-answers.js`, `src/services/possible-answers-csv.js`, `src/views/possible-answers-card.html`, `src/ui/shell.js` | ported (phase 5; inline CSV panel instead of a modal) |
| Advanced properties, uniqueness, title rules | `template/methods/prepareAdvancedInputPropertiesHTML.js`, `getUniquenessHTML.js` | `src/services/properties.js`, `src/views/properties-card.html`, `src/ui/shell.js` | ported (phase 1) |
| Form management (rename / delete form, name prompt, child-form cap) | `ui-handlers/event-handler-callbacks/*form*`, `factory/form-factory.js` | `src/services/form-management.js`, `src/services/session.js`, `src/views/question-card.html`, `src/ui/shell.js` | ported (phase 7; inline panels instead of modals) |
| Branches and groups | `inputs/branch.js`, `inputs/group.js`, `ui-handlers/*branch*`, `ui-handlers/*group*` | `src/services/nesting.js`, `src/services/session.js`, `src/ui/shell.js` | ported (slice 4, phase 2) |
| Jumps | `actions/jumps.js`, `helpers/utils.getJumpAvailableDestinations` | `src/models/jumps.js`, `src/services/jumps.js`, `src/views/jump-row*.html`, `src/ui/shell.js` | ported (phase 3) |
| Validation and question copy | `actions/validation.js`, `actions/input-duplicator.js`, `ui-handlers/event-handler-callbacks/*` | `src/models/validation.js`, `src/services/validation.js`, `src/services/question-actions.js`, `src/ui/shell.js` | ported (phase 4) |
| Undo | `actions/undo.js` | `src/services/undo.js`, `src/ui/shell.js` | ported (phase 6) |
| Save / export / import | `actions/save/**`, `helpers/import-form-validation.js`, `ui-handlers/event-handler-callbacks/{save-project,export-form,import-form}-click-callback.js` | `src/services/save.js`, `src/services/form-import.js`, `src/services/import-form-validation.js`, `src/ui/shell.js` | ported (phase 7) |
| Print as PDF | `ui-handlers/event-handler-callbacks/print-as-pdf-click-callback.js`, `css/sass/_print.scss` | `src/ui/print.js`, `src/theme/_print.scss`, `src/index.html` | ported (phase 8) |
| Readme editor | Summernote rich-text field | Tiptap 3 rich-text field | ported |
| Modals, menus, tooltips | Bootstrap JS | `src/services/notifications.js`, `src/ui/toast.js`, `src/ui/loading.js`, `src/ui/modal.js`, `ion-tooltip`, `src/views/**` (title help links to the docs) | ported (phase 8: toasts, loading, tooltips and the question-delete confirmation ported) |

The finer-grained gap against the legacy feature surface, and the phase order
that closes it, are in `ROADMAP.md`.

## Shared parameters

Runtime limits live in `src/config/parameters.js` as the exported `PARAMETERS`
object, matching the naming convention used by the mobile app. This gives the
Ionic port one source for limits shared by validation, editing controls, imports
and user-facing messages. Keep type catalogues and other domain-specific rules
with their existing models; domain modules may re-export parameter aliases for
their callers, but must not define a second copy of a limit.

The standalone project JSON schema still declares literal constraints because
it must validate independently. Keep those schema constraints aligned with
`PARAMETERS`; changing them is a project-definition contract change and is out
of scope for the UI port.

## Static panel markup

Port existing panels one-to-one: `panel` to `ion-card`, `panel-heading` to
`ion-card-header`, `panel-title` to `ion-card-title`, and `panel-body` to
`ion-card-content`. Reuse the existing property fragments and static field
markup rather than recreating equivalent fields in JavaScript. Preserve legacy
classes, ids and data attributes; where selectors require literal
`div.panel` / `div.panel-body`, retain those hook elements inside the Ionic card
shell. Keep Bootstrap CSS out of the Ionic page and style the port with Ionic
tokens.

Fixed layout belongs in HTML views or the static page shell, not JavaScript DOM
builders. This includes cards, headings, labels, buttons, fields, toolbars and
empty states. JavaScript binds events, updates values and renders repeated rows
from project data such as forms, questions and answers.

## Slices

1. Boundary and project loading: own entry, own DOM, form switching, question list, selection.
2. Basic question editing, adding, reordering and deleting questions.
3. Possible answers (add, rename, remove, reorder; phase 5 added paging, CSV, ordering and delete all).
4. Branches and groups (ported).
5. Jumps, validation and question copy (ported).
6. Undo (ported).
7. Save, import, export, form management (ported).

Each slice is compared against the legacy page with the same `project/project.json`,
and the legacy Mocha suite stays the gate for shared behaviour.
