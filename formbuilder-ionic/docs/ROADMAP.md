# Roadmap

Audit of the Ionic port against the legacy formbuilder, and the phases that
close the gap. The legacy app under `js/`, `css/` and `public/` is the reference
and is never edited (see `PORTING.md`); the project-definition JSON contract is
frozen.

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
  schema and rewrites refs structurally.
- Form management: add (five-form cap and name prompt), rename (duplicate
  checked), delete the last child form and delete all questions.
- Chrome feedback: `ion-toast` notifications at the top of the page, the
  `ion-loading` busy overlay during save and import, `ion-tooltip` on the
  question actions, and docs links instead of the info modals.
- Form tab validity icons, the `beforeunload` guard for unsaved changes, an
  `ion-alert` confirmation before deleting a question, and the project-level
  limits enforced when saving.
- Print form: the preview is built from the definition into
  `.print-preview-wrapper` and printed with `window.print()`; the ported copy of
  the legacy `_print.scss` hides the builder on paper (`theme/_print.scss`).

## Gap vs legacy

### Chrome and shell actions

- The add-form, rename, delete-form and delete-all confirmations are inline
  panels for now; converting them to Ionic modals is still pending.

### Properties panel

- Advanced fields per type: `default`, `regex`, `verify` (double entry),
  `min` / `max`, integer / **decimal** radio, `datetime_format` +
  `set_to_current_datetime`, initial-answer select, `searchsingle` /
  **searchmultiple** radio. The regex presets were dropped in phase 8.
- Uniqueness control (`none` / `form` / `hierarchy`, plus the branch variant).
- Title rules: `LIMITS.titles_max = 3`; the info-title modal is a docs link.
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
jump inside itself) and jump validity in the Jumps tab badge.

Remaining:

- Marking the offending jump row itself, rather than the tab and the panel
  message.

### Possible answers

Ported: add / rename / remove / reorder, default (initial answer) selection,
CSV import (column picker, headers toggle, replace / append) and export,
pagination at 100 per page, ordering A-Z / Z-A / shuffle, delete all, duplicate
`answer_ref` detection, the 300 / 1000 answer limits, the 150-char cap and
`<` / `>` sanitisation on every write.

The CSV panel is still inline inside the answers card rather than an Ionic
modal; that conversion is pending.

### Validation

Ported (`models/validation.js` + `services/validation.js`): question text and
readme length, possible answers, integer / decimal min, max and initial answer,
default vs regex, branch / group children (recursive, so a nested group
invalidates its branch), jump destinations and conditions, `areFormInputsValid`
/ `areAllInputsValid`, the per-row validity badge and the Properties / Jumps tab
badges. Each error carries the tab it belongs to.

The project-level caps (300 inputs, 3 titles per list, 5 search questions) are
enforced on save through `services/project-limits.js` and on import through the
same counters.

### Modals, menus, toasts

- Info help (`info-title`, `info-regex`, `info-import-form`) is **not** ported
  as a modal: the help icons are external docs links (`target="_blank"`, with
  placeholder URLs until the docs pages are confirmed). The regex presets
  (`only_letters`, `only_digits`, `limit_length_20`) were dropped.
- Toasts are `ion-toast` at the top of the page (`ui/toast.js`), the busy
  overlay is `ion-loading` (`ui/loading.js`), and the question action buttons
  use `ion-tooltip`.
- The question delete warning is an `ion-alert`. Still pending: `ion-modal` for
  the CSV import options and the form rename / delete panels (those stay inline
  for now).

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

Phases 1–8 are ported. Remaining in phase 8: `ion-modal` for the CSV options and
the form rename / delete panels. Risks carried by the port are tracked in
`docs/risks.md`.

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
   questions. The name prompt and delete confirmation remain inline panels.
8. **Chrome polish.** Ported: toasts, busy overlay, tooltips, docs links, the
   question-delete `ion-alert`, form tab validity icons, `beforeunload`, the
   save-time project caps and print as PDF. Still pending: `ion-modal` for the
   CSV options and the form rename / delete panels.

## Limits (from the legacy contract)

| Limit | Value |
|---|---|
| Questions per project (`INPUTS_MAX_ALLOWED`) | 300 |
| Possible answers (radio, checkbox, dropdown) | 300 |
| Possible answers (searchsingle, searchmultiple) | 1000 |
| Possible answers per page | 100 |
| Possible answer length | 150 |
| Titles per form / branch | 3 |
| Search questions per project | 5 |
| Child forms (`MAX_NUMBER_OF_NESTED_CHILD_FORMS`) | 5 |
| Question / header length | 255 |
| Readme length | 1000 |
| Regex and min / max length | 50 |
| Undo states | 10 |

## Constraints and risks

- **Contract frozen.** Keep exact field shapes and the 3 / 4 / 5-segment ref
  format; never serialize `dom` (`serializeProject` already strips it).
- **Do not reproduce legacy defects** (`docs/legacy-known-defects.md`): the
  `validation.js` possible-answer parenthesis bug, `getInputsTotal` not counting
  nested-group children, branch jumps validated against the array instead of the
  input, and the branch owner's leftover `group[]`.
- **Single source for limits.** The answer caps live in
  `models/possible-answers.js` and `services/import-form-validation.js`; the
  project caps live in `services/project-limits.js`. Keep save and import on the
  same counters.
- **Two save formats.** Save is `base64(gzip(JSON))`; export and import are
  plain JSON. They must stay distinct.
- **State model.** Save and undo assume a deep clone that survives a re-render;
  the in-place `session` model is the likely divergence point.
