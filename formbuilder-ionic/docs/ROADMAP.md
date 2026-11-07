# Roadmap

Audit of the Ionic port against the legacy formbuilder, and the phases that
close the gap. The legacy app under `js/`, `css/` and `public/` is the reference
and is never edited (see `PORTING.md`); the project-definition JSON contract is
frozen.

## Tooling decision

Use Vite for both development and production builds. Bundle Ionic Core and all
other npm dependencies from their pinned packages; do not use CDN script or
stylesheet URLs. Vite owns aliases for the Ionic source and frozen legacy
modules, HTML `?raw` imports, Sass processing and the production output. Its dev
server must retain the side-by-side legacy/project routes and local project
save endpoint documented in `PORTING.md`. Do not maintain a separate esbuild
build/watch script.

### Vite and modern JavaScript migration plan

Done: Vite owns the dev server and the production build (`vite.config.js`,
`base: /epicollect5-formbuilder/ionic/`, `target: es2020`). Ionic Core,
Ionicons, jQuery, jQuery UI and the other npm dependencies are bundled from
their pinned packages — no CDN scripts, no copied vendor JS. Icon SVGs are the
exception: ion-icon loads them by URL at runtime, so the pinned SVGs are
served from `node_modules` in dev and copied to `dist/vendor/ionicons/svg` by
the production build. The `@`
alias and the frozen `js/app_modules/**` aliases (including the Ajv validator
override) live in `scripts/resolve-aliases.mjs` and are shared with Vitest.
The comparison workflow is preserved (port 5183, `/ionic/`, `/public/` and
`/project/` routes, the local save endpoint), and `src/**` uses ES6+
(`const` / `let`, arrow callbacks, template literals, object shorthand,
spread). The legacy `js/**`, `css/**` and `public/**` trees are untouched.

Remaining verification is the browser pass: component registration and icons,
comparison routes, project load/save, and both test suites.

## Where the port stands

Ported today:

- Project load (plain JSON and gzip/base64), project name and logo.
- Back / exit navigation, form tabs, form switching, add form.
- Tool palette (click to add and drag to drop).
- Question list: add, reorder, delete, select.
- Basic properties: question text, required toggle, title toggle.
- Readme editor (Tiptap, replacing Summernote), 1000-char cap.
- Possible answers: add, rename, remove, reorder.
- Import validation schema half (`services/import-form-validation.js`, Ajv).
- Branches and groups: enter / exit editing, container sortables, nesting rules
  (no branch-in-branch, group-in-group or branch-in-group), child counts,
  breadcrumbs, per-level refs and branch-scoped titles / uniqueness label.
- Jumps: rows, the single-answer "always" variant, destinations limited to the
  active list, the jump icon and jump validity in the Jumps tab badge.
- Validation (`models/validation.js`, `services/validation.js`): question text
  and readme length, answers, numeric bounds and initial answer, default vs
  regex, branch / group children and jump destinations, with the row badge, the
  Properties / Jumps tab badges and the Validate button.
- Question copy: duplicate at the end of the active list with new refs and
  answer refs, remapped default and jumps that stay inside the copy.
- Undo: ten snapshots of the project definition at the legacy push points, a
  500ms throttled push for typing, and a data-only restore.
- Parent validity badges that reflect branch / group child validation.
- Save / export / import: cleaning on a deep copy, the `base64(gzip(JSON))`
  POST, the plain-JSON form envelope, and an import that validates against the
  schema and rewrites refs structurally, reports the whole-project runtime
  validity after the swap and refuses files above 5 MB.
- Form management: add (five-form cap and name prompt), rename (duplicate
  checked), delete the last child form and delete all questions.
- Chrome feedback: `ion-toast` notifications at the top of the page, the
  legacy `.wait-overlay` busy overlay during save and import, `ion-tooltip` on
  the question actions, and the title info as an auto-height modal.
- Form tab validity icons, the `beforeunload` guard for unsaved changes, an
  auto-height `ion-modal` confirmation before deleting a question, and the
  project-level limits enforced when saving.
- Print form: the preview is built from the definition into
  `.print-preview-wrapper` and printed with `window.print()`; the ported copy of
  the legacy `_print.scss` hides the builder on paper (`theme/_print.scss`).

## Gap vs legacy

### Chrome and shell actions

- The form-name prompt, the CSV import options and the question-delete
  confirmation already use `ion-modal` (auto-height via `--height: auto`).
- Form delete and delete-all execute immediately with a toast, matching the
  legacy callbacks (`delete-form-click-callback.js`,
  `delete-all-questions-click-callback.js`), which show no confirmation modal.
  The `FORM_DELETE_CONFIRM` / `DELETE_ALL_CONFIRM` strings exist in both
  message tables but have no callers; adding confirmations would be new
  behaviour, not parity.

### Properties panel

- Advanced fields per type: `default`, `regex`, `verify` (double entry),
  `min` / `max`, integer / **decimal** radio, `datetime_format` +
  `set_to_current_datetime`, initial-answer select, `searchsingle` /
  **searchmultiple** radio. The regex presets were dropped in phase 8.
- Uniqueness control (`none` / `form` / `hierarchy`, plus the branch variant).
- Title rules: `PARAMETERS.TITLES_MAX = 3`; the title help is a modal, the
  regex help icons remain docs links.
- Per-type gating: required only on `REQUIRED_ALLOWED_TYPES`, no required/title
  on media / branch / group / readme.
- Text caps: 255 for question and header, 1000 for readme.

### Branches and groups

Ported: `branch[]` / `group[]` child arrays, enter and exit editing, the container
sortables, a nested group inside a branch, breadcrumbs, child counts, the nesting
rules, refs with one more `_` segment per level, the branch-scoped titles,
uniqueness and jumps (`form` means the branch there, as in the legacy builder),
and parent validity badges that reflect the children.

### Jumps

Ported: rows with When (`NO_ANSWER_GIVEN` / `IS` / `IS_NOT` / `ALL`), Answer and
destination, the single-answer "always" variant, the one-jump-per-answer limit,
the row jump icon, destinations limited to the active list (a branch can only
jump inside itself) and jump validity in the Jumps tab badge. A stored answer
ref that no longer matches a possible answer is kept in the data and rendered
as "Unavailable answer" instead of silently falling back to the first answer.

Remaining:

- Highlighting the offending jump row itself (the row already shows its
  field-level error message; there is no row-level red outline yet).

### Possible answers

Ported: add / rename / remove / reorder, default (initial answer) selection,
CSV import (column picker, headers toggle, replace / append) and export,
pagination at 100 per page, ordering A-Z / Z-A / shuffle, delete all, duplicate
`answer_ref` detection, the 300 / 1000 answer limits, the 250-char cap and
`<` / `>` sanitisation on every write. CSV and form imports refuse files above
5 MB.

- The CSV panel is rendered through `openModal` (auto-height) rather than
  inline in the answers card.

### Validation

Ported (`models/validation.js` + `services/validation.js`): question text and
readme length, possible answers, integer / decimal min, max and initial answer,
default vs regex, branch / group children (recursive, so a nested group
invalidates its branch), jump destinations and conditions, `areFormInputsValid`
/ `areAllInputsValid`, the per-row validity badge and the Properties / Advanced
/ Jumps tab badges. Each error carries the tab it belongs to, and a child's
broken jump lights the container's Jumps badge as well.

The caps (300 inputs per form, 3 titles per list, 5 search questions per
project) are enforced on save through `models/project-limits.js` — keeping the
save gate is a recorded decision, since the real API would reject an over-cap
project anyway. The import checks only the
imported form's own input and title totals, like legacy — a project-level
search-cap overflow raises a warning after the import instead of blocking it,
so an over-cap project can exist in the builder but cannot be saved.

### Modals, menus, toasts

- Info help: the title explanation links to the docs; the regex help icon was
  removed with its placeholder link. The regex presets (`only_letters`,
  `only_digits`, `limit_length_20`) were dropped.
- Toasts are `ion-toast` at the top of the page (`ui/toast.js`, via the
  `services/notifications.js` service), the busy overlay is the legacy
  `.wait-overlay` sheet (`ui/loading.js`), and the question action buttons use
  `ion-tooltip`.
- The question-delete warning, the form-name prompt, the CSV import options and
  the info panels use auto-height `ion-modal` through `ui/modal.js`.

## Static markup porting rule

Port existing Bootstrap panels to Ionic cards one-to-one. Preserve the panel's
content, order, labels, fields, ids, data attributes and legacy hook classes;
translate the outer structure to Ionic's card elements:

| Bootstrap panel role | Ionic element |
|---|---|
| `.panel` | `ion-card` |
| `.panel-heading` | `ion-card-header` |
| `.panel-title` | `ion-card-title` |
| `.panel-body` | `ion-card-content` |

Reuse the existing property fragments and their static field markup. Do not
rebuild those fields as custom JavaScript-created markup. Where a legacy
selector requires a literal `div.panel` or `div.panel-body`, keep that hook
inside the Ionic card shell and style it through the Ionic theme. Keep Bootstrap
CSS out of the Ionic page. Add custom markup only for behavior with no existing
markup or Ionic equivalent.

Keep fixed page structure in HTML templates under `src/views/**` or in the
static page shell. Do not use JavaScript DOM helpers to create fixed cards,
headings, labels, buttons, fields, toolbars or empty states. JavaScript should
bind behavior and update values in those templates; generating repeated rows
from project data (questions, answers, forms) is appropriate. Keep the static
container and each dynamic collection's empty-state markup in the view.

## Phases

Phases 1–8 are ported, including the phase-8 `ion-modal` conversions (form-name
prompt, CSV import options, question-delete confirmation, title info). The
modals are auto-height (`--height: auto`). Risks carried by the port are tracked
in `docs/risks.md`.

1. **Properties panel, full.** Port each existing Bootstrap panel to the
   equivalent Ionic card shell and reuse its property fragments in HTML views.
   Keep fixed fields and controls in those views; use JavaScript for their data
   and events. Advanced tab per type, uniqueness, title cap and
   gating, text caps, decimal / searchmultiple switches. Pure presentation over
   the existing contract, so no new models.
2. **Branches and groups.** Nesting model and refs (4 / 5 segments), enter and
   exit editing, branch / group sortables, nesting rules, breadcrumbs.
3. **Jumps.** Jump model, destination rules (form- and branch-scoped), the
   Jumps tab, the row icon.
4. **Validation and question actions.** Port `actions/validation.js`, wire the
   Validate button and the error badges; port copy / duplicate question.
5. **Possible answers completion.** Default select, ordering, delete all,
   pagination, CSV import / export, limits and per-answer validation.
6. **Undo.** Ported: ten-state deep snapshot with the same push points, a
   throttled push for typing and a data-only restore (selection resets, the
   form index is kept). Save / export can now push state.
7. **Save, export, import and form management.** Ported: save pipeline (deep
   copy, `replaceWordChars`, jump rebuild, `base64(gzip)` POST), export envelope
   and filename, import flow on the existing Ajv validator with a structural
   ref remap, form rename / delete and the 5-form cap, and delete all
   questions.
8. **Chrome polish.** Ported: toasts, busy overlay, tooltips, the
   question-delete confirmation, form tab validity icons,
   `beforeunload`, the save-time project caps and print as PDF. The form-name
   prompt and CSV import options use auto-height `ion-modal`; the title help
   links to the docs.

## Limits (from the legacy contract)

Runtime values are defined in `src/config/parameters.js` as `PARAMETERS`,
matching the mobile app convention. The project schema keeps its own literal
constraints so it remains standalone; keep those declarations in sync with
`PARAMETERS` without changing the project-definition contract.

| Limit | `PARAMETERS` key | Value |
|---|---|---:|
| Questions per form | `INPUTS_MAX_ALLOWED` | 300 |
| Possible answers (radio, checkbox, dropdown) | `MAX_ANSWERS` | 300 |
| Possible answers (searchsingle, searchmultiple) | `MAX_SEARCH_ANSWERS` | 1000 |
| Possible answers per page | `ANSWERS_PER_PAGE` | 100 |
| Possible answer length | `MAX_ANSWER_LENGTH` | 250 |
| Titles per form / branch | `TITLES_MAX` | 3 |
| Search questions per project | `SEARCH_INPUTS_MAX` | 5 |
| Forms per project | `MAX_FORMS` | 5 |
| Form name length | `FORM_NAME_MAX_LENGTH` | 50 |
| Question / header length | `QUESTION_MAX_LENGTH` | 255 |
| Readme length | `README_MAX_LENGTH` | 1000 |
| Regex length | `REGEX_MAX_LENGTH` | 50 |
| Min / max value length | `MIN_MAX_LENGTH` | 50 |
| Question preview length | `QUESTION_PREVIEW_LENGTH` | 50 |
| Undo states | `MAX_UNDO_STATES` | 10 |
| Undo typing throttle | `UNDO_THROTTLE_MS` | 500 ms |

## Browser support

The build target is `es2020` (Vite, no legacy plugin), the theme uses
`::part()` and flex/grid, and the only runtime APIs outside that baseline are
the Compression Streams — covered by the lazy ponyfill wherever
`TransformStream` exists — and the `color-mix()` tints, which have static
fallbacks. The effective support statement is:

- Chrome / Edge 80+ (July 2020)
- Firefox 103+ (June 2022)
- Safari / iOS Safari 14.1+ (April 2021)
- Android: evergreen Chromium

Everything that auto-updates today is above this floor. Below it the builder
still boots, but saving and loading fail with explicit errors; there is no IE
support and no legacy plugin.

## Constraints and risks

- **Contract frozen.** Keep exact field shapes and the 3 / 4 / 5-segment ref
  format; never serialize `dom` (`serializeProject` already strips it).
- **Do not reproduce legacy defects** (`docs/legacy-known-defects.md`): the
  `validation.js` possible-answer parenthesis bug, `getInputsTotal` not counting
  nested-group children, branch jumps validated against the array instead of the
  input, and the branch owner's leftover `group[]`.
- **Single source for runtime limits.** `config/parameters.js` owns the
  `PARAMETERS` values. Domain modules may re-export aliases, while validation,
  controls, imports and messages consume the shared values. The standalone JSON
  schema has parallel literal constraints that must remain aligned.
- **Two save formats.** Save is `base64(gzip(JSON))`; export and import are
  plain JSON. They must stay distinct.
- **State model.** Save and undo assume a deep clone that survives a re-render;
  the in-place `session` model is the likely divergence point.
- **Audit records.** Measurements and declined candidates live in
  `docs/performance-audit.md`; remaining jQuery call sites are inventoried in
  `docs/jquery-usage.md`. Re-measure before reopening a declined optimisation.
