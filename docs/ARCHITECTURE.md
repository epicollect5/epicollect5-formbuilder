# Epicollect5 Formbuilder — Architecture

Source of truth for the system's design. Read it before changing anything;
cross-check any candidate finding against it.

This repository holds the **legacy formbuilder** and, eventually, a **Vue port**.
They are independent: different stacks, different architectures, different style
rules. Never mix them.

| | Legacy formbuilder | Vue port |
|---|---|---|
| Path | `js/`, `css/`, `public/` | `formbuilder-vue/` |
| Stack | ES5 CommonJS, Browserify, jQuery 2.2.1, jQuery UI 1.11.4 | Vue 3, Pinia, Vite, Ionic Vue 8, `@vue-dnd-kit/core` (intended) |
| UI | Bootstrap 3 markup + Font Awesome | Port-owned components + SCSS theme |
| Tests | Mocha 2.5 + Chai + jsdom | Vitest (target) |
| Style rules | frozen, see `AGENTS.md` | `docs/CODE-STYLE.md` |
| Status | in production | greenfield — no source on `master` |

---

# Part 1 — Legacy formbuilder (`js/`, `css/`, `public/`)

A single-page formbuilder for Epicollect5 projects. The server renders
`public/index.html`; everything after that is jQuery and DOM manipulation.

## Entry point and boot order

`public/index.html` loads, in order:

1. jQuery **2.2.1** from a CDN
2. Bootstrap 3.3.6 JavaScript from a CDN
3. `js/vendor-formbuilder.js` (concatenated vendor globals: CircularJSON, Flatted,
   FileSaver, PapaParse, pako, toastr, summernote, jQuery UI, numeric input)
4. `js/formbuilder.js?v=<cache buster>` (the Browserify bundle)

`js/app.js` is the only application entry:

```js
$.when(load_project()).then(function () {
    $.when(load_components(), extend_natives()).then(init);
});
```

- `loaders/load-project.js` reads `#formbuilder-version` from the page, calls
  `utils.setProjectURL()`, fetches the project definition and stores it on the
  `formbuilder` singleton.
- `loaders/load-components.js` fetches the four containers, the partials and the
  per-input-type property views, injects the first form ref into the first tab,
  and calls `formbuilder.setup(ref, partials, views)`.
- `config/extend-natives.js` adds `Array.prototype.move`, `String.prototype.trunc`,
  `startsWith` and an `indexOf` fallback.
- `config/init.js` binds every UI handler, sets the project name and logo, renders
  the project, pushes the initial undo state and reveals the UI.

## Runtime singleton

`js/app_modules/config/formbuilder.js` is a mutable module singleton. There is no
store and no event bus; every module imports the same object.

It holds:

- `project_definition` — the project JSON currently being edited
- `current_form_ref`, `current_form_index`, `current_input_ref`
- branch/group editing flags and the active branch/group refs
- `state` — the undo stack (deep copies of the project definition)
- `dom` — cached jQuery handles (`input_properties`, `inputs_collection`,
  `forms_tabs`, `save_project_btn`, partials, property views, …)
- `render_action` — `do` / `undo` / `validate`; guards undo-state pushes
- `possible_answers` — pagination and sortable bookkeeping

`formbuilder.setup()` fills `dom` once the containers are loaded. Selectors are
cached with ref-scoped ids (`#<form-ref>-inputs-collection`, …); after a form is
created or removed, `form_factory.updateFormbuilderDomReferences(form_ref)` must
point them at the new markup.

## Project definition

The shape is the Epicollect5 API JSON:API form:

```json
{
  "data": {
    "type": "project",
    "project": {
      "ref": "…",
      "name": "…",
      "small_description": "…",
      "access": "…",
      "slug": "…",
      "status": "…",
      "visibility": "…",
      "logo_url": "…",
      "forms": [
        {
          "ref": "…",
          "name": "…",
          "slug": "…",
          "type": "hierarchy",
          "inputs": [
            {
              "ref": "…",
              "type": "text",
              "question": "…",
              "is_title": true,
              "is_required": false,
              "uniqueness": "none",
              "regex": "",
              "default": "",
              "verify": false,
              "max": "",
              "min": "",
              "datetime_format": "",
              "set_to_current_datetime": false,
              "possible_answers": [],
              "jumps": [],
              "branch": [],
              "group": []
            }
          ]
        }
      ]
    }
  }
}
```

A project object has exactly `name`, `small_description`, `access`, `slug`,
`ref`, `status`, `visibility`, `logo_url`, `forms`; `js/test.js` asserts that
key set. A form object has exactly `name`, `slug`, `type`, `ref`, `inputs`. An
input object carries the properties of its type; the import validator compares
the key set against the valid structure (`utils.hasSameProps`), so an unexpected
key is a validation failure.

Refs are built by appending `_<uniqid>` at each level:

- form ref = project ref + `_` + uniqid
- input ref = form ref + `_` + uniqid
- branch/group ref = owner input ref + `_` + uniqid

`utils.generateUniqID()` is a PHP-style uniqid; refs are opaque. Do not parse
them beyond the documented `getBranchOwnerInputRef` / `getGroupOwnerInputRef`
helpers.

On render, each input object receives a `dom` property: jQuery handles, the
rendered element, validity flags. **`dom` is runtime-only.** Save and export
delete it (`doCleaningBeforeSaving`, `export_form_click_callback`).

## Input model

- `factory/input-factory.js` maps a type string to a constructor.
- `factory/input-prototype.js` and `input-multiple-answers-prototype.js` provide
  the shared behaviour; `input-properties.js` holds the property panel metadata.
- `inputs/<type>.js` defines each question type's markup, default properties and
  property-panel hooks. There are 18 modules: text, textarea, integer, date, time,
  radio, checkbox, dropdown, barcode, location, audio, video, photo, phone,
  readme, branch, group, search.
- The palette in `public/views/containers/inputs-tools.html` offers 19 types:
  the 18 above plus `searchsingle`; `search.js` implements both `searchsingle`
  and `searchmultiple`, and `integer.js` implements both `integer` and
  `decimal` (the numeric type is a property of the input, not a separate
  module).
- Branches and groups are recursive containers. A branch can contain inputs and
  nested groups; a group can contain inputs but not branches or groups. The
  import validator enforces those nesting rules.

## Rendering

`actions/parse/` is the render orchestrator:

- `renderProject(project_definition)` creates forms, tab buttons and tab panels.
- `renderChildForms` renders additional forms.
- `renderInputs` turns input objects into factory instances and markup.
- `getBranchInputsHTML` / `getGroupInputsHTML` render nested containers.
- `initFormbuilder` rebinds DOM references, validation and handlers after an
  undo or a form switch.

`template/` builds the HTML strings for the properties panel: basic properties,
uniqueness, advanced properties, possible answers and their pager, the jump tab
and the jump list, and the input tool markup. The form tab button and tab
content markup lives in `helpers/ui.js`, which also owns the small UI state
changes (validation icons, save/undo buttons, title warnings, search-tool
visibility).

Views are runtime assets in `public/views/`:

- `containers/` — navbar, inputs tools, inputs collection, input properties
- `partials/` — tabs, property sections, possible answers, jumps, modals
- `properties/` — one property panel per input type

They are fetched with `$.get(path + file + '?v=' + FORMBUILDER_VERSION)`. A
missing view is a runtime error, not a build error.

## Editing UI

- jQuery UI `draggable` copies an input tool into the collection; `sortable`
  reorders inputs and updates the project definition.
- Branch, group and nested-group sortables are separate handlers because their
  containers are nested.
- The properties panel is delegated: click, change, focus, keyup and title
  checkbox handlers are attached to the panel and dispatch by DOM class.
- Forms are tabs; adding/removing a form re-renders the tab list and the tab
  content and then refreshes the cached DOM handles.

## Validation

`actions/validation.js` is the single validation entry point.

- `performValidation(input, showToast)` validates one input and writes
  `dom.is_valid` plus the error state in the UI.
- `areAllInputsValid(project_definition)` and `areFormInputsValid(index)` gate the
  save/export buttons and the form-tab icons.
- `validateBranchInputs` / `validateGroupInputs` recurse into nested containers.
- `validateBeforeSaving(form_ref, inputs)` re-runs the import-grade rules before
  the save POST.
- `isJumpValid`, `isPossibleAnswerValid`, `isMinMaxValueValid`,
  `isInitialAnswerValid` are the individual rules.

Limits come from `config/consts.js`: 300 inputs per form, 100 form-name chars,
50 form/input-name chars, 255 question chars, 1000 readme chars, 3 titles per
form/branch, 300 possible answers (1000 for search inputs), 5 search inputs per
project, 10 undo states.

## Jumps

Jumps are forward-only and live on each input's `jumps` array:

```json
{ "to": "<input-ref>", "when": "ALL|IS|IS_NOT|NO_ANSWER_GIVEN", "answer_ref": "…" }
```

- `utils.getJumpAvailableDestinations(input, inputs)` excludes the immediately
  following question (it would be a no-op) and offers `END` only when at least
  one question would actually be skipped.
- `getJumpAvailableDestinationsAsKeys` is the same set as a lookup object, used
  by save/import validation.
- Multiple-answer inputs require an `answer_ref` except for `ALL` and
  `NO_ANSWER_GIVEN`; single-answer inputs only allow `ALL`.
- Jumps are not allowed on inputs inside a group; the import validator rejects
  them.
- `sanitizeLegacyInvalidEndJumps` clears jumps on the last input and on the last
  branch input during import, because older exports could contain a jump to
  `END` that no longer skips anything.
- `doCleaningBeforeSaving` normalizes each jump to exactly
  `{ to, when, answer_ref }` and nulls `answer_ref` for `ALL` /
  `NO_ANSWER_GIVEN`.

## Possible answers

Multiple-answer inputs own a `possible_answers` array of
`{ answer, answer_ref }`.

- `actions/possible-answers.js` and `possible-answers-pager.js` handle add,
  delete, reorder and pagination (100 per page). The maximum is 300 answers per
  input, 1000 for the two search types.
- Possible answers can be imported from CSV (`PapaParse`) and exported to CSV
  (`FileSaver`); the CSV import modal offers replace/append and a column picker.
- `answer_ref` is 13 alphanumeric characters (`^[a-zA-Z0-9]{13}$`) and must be
  unique within the input.
- Deleting an answer leaves any jump that referenced it dangling — the
  "confirm before dropping the jump" check is still a TODO in
  `removePossibleAnswer`. A dangling `answer_ref` then fails
  `areJumpsValid` at save/import time.

## Undo

`actions/undo.js` keeps at most `LIMITS.max_states` (10) deep copies.

- `pushState()` serializes the project definition with Flatted, plus the active
  refs/tab, and is skipped while `render_action === 'undo'`.
- `execute()` pops the stack, re-renders the whole project, restores the active
  context and rebinds the UI.
- The initial state is pushed by `init` after the first render.

## Save pipeline

`ui-handlers/event-handler-callbacks/save-project-click-callback.js`:

1. Validate the currently selected input.
2. Deep-copy `formbuilder.project_definition` with Flatted.
3. `save.doCleaningBeforeSaving(forms)` — strips `dom`, replaces Word smart
   characters in questions, clears the legacy `group` array on branch inputs,
   normalizes jumps and validates jump destinations.
4. `validation.validateBeforeSaving(form.ref, form.inputs)` for every form.
5. POST the result to `consts.PROJECT_URL` as
   `base64(gzip(JSON.stringify(project_definition)))`.
6. On success, hide the overlay and show the saved toast; on failure, show the
   server error titles.

There is no save queue and no retry. The local standalone build posts to
`../postdump/index.php`; the Laravel build posts to
`api/internal/formbuilder/<project-slug>`.

## Import and export

### Export a form

`export_form_click_callback` deep-copies the project, validates the selected
form, strips `dom`, wraps the form as:

```json
{ "data": { "id": "<form-ref>", "type": "form", "form": { … } } }
```

and downloads `<project-slug>__<form-slug>.form.epicollect.json` with FileSaver.

### Import a form

`import_form_click_callback`:

1. Requires a `.json` file and parses it.
2. `helpers/import-form-validation.js` validates the wrapper
   (`data.type === 'form'`, `data.form.type === 'hierarchy'`), the input tree,
   refs, possible answers, jumps and limits.
3. Clears legacy invalid end jumps.
4. Rewrites the imported form ref to the current form ref in the serialized JSON
   (a global string replace), then re-parses.
5. Renders the inputs through the normal parse/factory path and replaces the
   current form's inputs.
6. Re-runs validation, toggles the save/export/print buttons and pushes undo
   state.

The import replaces the current form's inputs; it does not append them.

## URL and configuration

`helpers/utils.js` derives the environment from `window.location`:

- **Standalone local build** (`localhost` + path containing
  `epicollect5-formbuilder`): `PROJECT_URL = ../project/project.json`, views stay
  at `views/`.
- **Laravel**: the project slug is the second-to-last path segment; the domain is
  the path with the last three segments removed; `PROJECT_URL =
  <domain>/api/internal/formbuilder/<slug>`. `VIEWS_PATH` is always rewritten to
  an absolute path — `/views/` at the root, `/<subpath>/views/` when the app is
  mounted under a subpath.
- **Logo**: `api/internal/media/<slug>?type=photo&name=logo.jpg&format=project_mobile_logo&v=<project-definition-version>`.

`consts.VIEWS_PATH` is mutated at runtime; every loader reads it at call time.
`public/index.html` carries two cache-buster fields that must be bumped together:

- `<meta id="formbuilder-version" data-version="…">` — read by `load_project`
  and appended to every view request
- `<script src="js/formbuilder.js?v=…">` — busts the app bundle

## Styling

Sass, compiled by gulp — **no JS file imports a stylesheet**.

- `css/sass/*.scss` → `public/css/formbuilder.css` (minified)
- `css/paper/bootstrap-material.scss` → `css/vendor/bootstrap-material.css`
- `css/vendor/*.css` (Bootstrap Material, Font Awesome, Summernote, toastr) →
  `public/css/vendor-formbuilder.css` (minified)

The shared partials `_variables.scss`, `_mixins.scss` and `_media-queries.scss`
are used by every other partial; changing one silently changes every component.

## Build

```bash
npm run build     # gulp default: vendor-js → vendor-css → sass → browserify
gulp watch        # watchify, unminified public/js/formbuilder.js
gulp debug        # unminified bundle, no watchify
```

`gulpfile.js`:

| Task | Reads | Writes |
|---|---|---|
| `vendor-js` | `js/vendor/*.js` | `public/js/vendor-formbuilder.js` |
| `vendor-css` | `css/paper/bootstrap-material.scss`, `css/vendor/*.css` | `css/vendor/bootstrap-material.css`, `public/css/vendor-formbuilder.css` |
| `sass` | `css/sass/*.scss` | `public/css/formbuilder.css` |
| `browserify` | `js/app.js` + the `js/app_modules` tree | `public/js/formbuilder.js` (+ ignored `.map`) |

Browserify is configured with `paths: ['./node_modules', './js/app_modules']`
and `debug: true`; the production task adds `uglify`, `stripDebug` and a
`//Build number:` header.

All four output files are **tracked**. `npm run build` therefore rewrites tracked
artifacts; do not run it for docs-only work.

## Tests

Mocha 2.5 + Chai + jsdom, run in Node:

```bash
npm test
# mocha --require ./js/test/setup-node.js --reporter dot js/test.js

VERBOSE=1 npx mocha --require ./js/test/setup-node.js js/test/<name>.test.js
```

`js/test/setup-node.js`:

- sets `NODE_PATH` to `js/app_modules` + `js/test` so Browserify-style absolute
  requires work in Node
- builds a jsdom window and exposes `window`, `document`, `$`, `jQuery`, …
- loads jQuery **3.7.1** from `node_modules` (the browser uses 2.2.1)
- evaluates `public/js/vendor-formbuilder.js` in the window, then loads
  CircularJSON, Flatted and Papa in the Node realm so object prototypes match
- replaces `jQuery.ajax` with a file-system reader rooted at `js/test/`
- buffers `console.log` unless `VERBOSE=1`

`js/test.js` is the aggregator: every test file must be `require`d there or it
never runs. The suite is green (155 passing). Known defects, including the
unregistered `isJumpValid.test.js`, are listed in
`docs/legacy-known-defects.md`.

---

# Part 2 — Vue port (`formbuilder-vue/`) — target

A Vue 3 rewrite of the same formbuilder. **Greenfield: there is no port source on
`master`.** The existing `formbuilder-vue` branch content is disposable and is not
a reference.

## Status

- The port will be written from scratch under `formbuilder-vue/`.
- `docs/CODE-STYLE.md` is the target style and applies only there.
- The legacy app remains the behavioural reference for the project-definition
  contract; it is not a structural template.
- CodeGraph indexes the repository except `public/js/**`, `js/vendor/**`,
  `css/paper/**` and `doc/**` (`codegraph.json`); port source is picked up once
  committed.

## Stack

| Concern | Choice |
|---|---|
| Framework | Vue 3 |
| Build | Vite |
| State | Pinia |
| UI | Ionic Vue 8 |
| Drag and drop | `@vue-dnd-kit/core` |
| Tests | Vitest |

## Layout

Mirror the mobile app's actual `src/` layout:

```
formbuilder-vue/src/
  components/    reusable UI components
  pages/         route-level components
  stores/        Pinia stores
  services/      project load/save/import/export and other workflows
  models/        project-definition shapes, constants, factories
  use/           reusable Vue composition logic
  theme/         per-component SCSS, mirroring components/ 1:1
```

`@` resolves to `formbuilder-vue/src`.

## Contract

The port must accept and produce the same project-definition JSON as the legacy
app:

- same `data.project.forms[].inputs[]` shape and field names
- same ref composition rules
- same jump semantics (forward-only, `END` only when it skips something)
- same possible-answer limits and `answer_ref` format
- same import/export wrapper (`data.form`) and file names

Parity is defined by the legacy behaviour, not by the legacy code structure. If
the legacy code contains a defect, do not port the defect; see
`docs/legacy-known-defects.md`.

## Style

`docs/CODE-STYLE.md` — Vue port only. The legacy app is not restyled.

---

# Build, release and deploy

## Legacy

```bash
npm test          # mocha --opts js/test/mocha.opts
npm run build     # gulp default
gulp watch        # watchify dev bundle
```

Deployable tree: `public/index.html`, `public/js/`, `public/css/`,
`public/views/`, plus the static `public/fonts/` and `public/favicons/`.

## Vue port

`formbuilder-vue/` will have its own `package.json` and Vite build output. Its
`dist/` is **not** the legacy `public/` tree; never mix them in a release.

## Release

1. `npm test` — the legacy suite must be green before any version change.
2. Determine the version (see below).
3. Bump `package.json` and both `package-lock.json` version fields.
4. Prepend the release notes to `CHANGELOG.md`.
5. `npm run build` — rebuild the four tracked artifacts.
6. Bump both cache-buster fields in `public/index.html` to the same fresh value.
7. Commit (`chore: release <version>`), tag `X.Y.Z`, push the tag, and attach the
   built artifacts to the GitHub Release.
8. Deploy is a **separate, explicit** step: copy the deployable tree into the
   EpiCollect5 server's `public/formbuilder/` directory. There is no deploy
   script. Bump the server's own `config('app.release')` cache-buster when the
   shell or views change, so production does not keep serving the previous
   release.

## Versions

The release version is plain semver `X.Y.Z`.

- The latest git tag is **`0.0.9`**.
- `package.json` and `package-lock.json` currently read **`1.0.0`**; they have
  drifted from the tag. The tag is authoritative.
- There is **no `CHANGELOG.md`** yet. The first release bootstraps it with a
  `# Release Notes` heading.
- There are no GitHub Releases yet.

> **The git tag and the CHANGELOG heading are authoritative — not
> `package.json`.** Keep all three in sync from the first managed release onward.
