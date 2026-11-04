# Porting inventory

The legacy formbuilder under `js/`, `css/` and `public/` is the behavioural
reference. The Ionic app keeps the same project-definition JSON and its own DOM;
it does not bundle, load or query legacy presentation code.

`js/app.js` is **not** part of the Ionic build. The legacy page keeps running at
`/epicollect5-formbuilder/public/index.html` against the same project file and
session, so each slice can be compared side by side.

## Legacy inventory by responsibility

| Responsibility | Legacy source | Port target | Status |
|---|---|---|---|
| Project definition contract | shapes in `project/project.json`, `schemas/project.schema.json` | `src/models/project-definition.js` | ported |
| Question catalogue (types, labels, icons) | `config/consts.js`, `helpers/utils.getInputToolIcon` | `src/models/question-types.js` | ported |
| Project loading (JSON + gzip/base64) | `loaders/load-project.js`, `helpers/utils.setProjectURL` | `src/services/project-source.js` | ported |
| Current form / current question / edits | `config/formbuilder.js` singleton | `src/services/session.js` | ported |
| Shell chrome (back, exit, add form, undo, save) | `ui-handlers/event-handler-callbacks/*`, `config/init.js`, `helpers/utils.goBack` | `src/ui/shell.js`, `src/services/navigation.js`, `src/services/session.js` | ported (undo, save and form naming disabled until their slice) |
| Shell, form switching, question list, selection | `loaders/load-containers.js`, `actions/parse/**`, `ui-handlers/*sortable*` | `src/ui/shell.js` | ported (slice 1) |
| Basic question editing (text, required, title) | `actions/parse`, `actions/validation`, `inputs/**` | `src/ui/shell.js` | ported (slice 2, minimal) |
| Drag and drop (tool to question list, question and answer reordering) | `ui-handlers/sortable.js`, `ui-handlers/possible-answers-sortable.js` | `src/ui/sortable.js` | ported (jQuery UI, as legacy) |
| Adding / reordering / deleting questions | `ui-handlers/sortable.js`, `actions/input-collection*`, `factory/input-factory.js` | `src/models/input-factory.js`, `src/models/refs.js`, `src/services/session.js`, `src/ui/shell.js` | ported (slice 2) |
| Possible answers (add, rename, remove, sort) | `actions/possible-answers*.js`, `template/methods/getPossibleAnswers*` | `src/models/possible-answers.js`, `src/services/possible-answers.js`, `src/ui/shell.js` | ported (slice 3) |
| Possible answers CSV import and pagination | `actions/possible-answers.js`, `possible-answers-pager.js` | — | pending |
| Branches and groups | `inputs/branch.js`, `inputs/group.js`, `ui-handlers/*branch*`, `ui-handlers/*group*` | — | pending |
| Jumps | `actions/jumps.js`, `helpers/utils.getJumpAvailableDestinations` | — | pending |
| Validation and question copy | `actions/validation.js`, `ui-handlers/event-handler-callbacks/*` | — | pending (buttons present, disabled) |
| Undo | `actions/undo.js` | — | pending |
| Save / export / import | `actions/save/**`, `helpers/import-form-validation.js` | `src/services/import-form-validation.js` (schema half only) | pending |
| Readme editor | summernote vendor bundle | — | pending |
| Modals, menus, tooltips | Bootstrap JS | Ionic components per slice | pending |

## Slices

1. Boundary and project loading: own entry, own DOM, form switching, question list, selection.
2. Basic question editing, adding, reordering and deleting questions.
3. Possible answers (add, rename, remove, reorder).
4. Branches and groups.
5. Validation.
6. Undo.
7. Save, import, export.

Each slice is compared against the legacy page with the same `project/project.json`,
and the legacy Mocha suite stays the gate for shared behaviour.
