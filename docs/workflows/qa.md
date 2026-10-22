# QA Generation Workflow

Generate QA documentation from a codebase change or QA spec file.

## Inputs

- base_ref (default: master)
  Branch, tag, or commit SHA

- qa_spec_file (optional)
  docs/QA-{version}.md — `{version}` is this repo's release version (`X.Y.Z` from
  `CHANGELOG.md` and the git tags), e.g. `docs/QA-0.0.10.md`. The latest tag is
  `0.0.9`; `CHANGELOG.md` does not exist yet.

## Diff scope

git diff {{base_ref}}..HEAD

## Reconciliation logic

If QA spec exists:

- Use it as reference documentation
- Compare against git diff results
- Ensure all new changes are covered in QA output

## Responsibilities

Identify all user-impacting changes across:

- Form/input behaviour (`js/app_modules/actions/**`, `js/app_modules/inputs/**`, `js/app_modules/factory/**`)
- Runtime state and URLs (`js/app_modules/config/**`, `js/app_modules/helpers/utils.js`)
- Startup and view loading (`js/app_modules/loaders/**`, `public/index.html`, `public/views/**`)
- UI handlers and drag/drop (`js/app_modules/ui-handlers/**`)
- Templates and property panels (`js/app_modules/template/**`)
- Validation, jumps, possible answers and undo (`js/app_modules/actions/validation.js`, `actions/jumps.js`, `actions/possible-answers*.js`, `actions/undo.js`)
- Save/import/export (`js/app_modules/actions/save/**`, `ui-handlers/event-handler-callbacks/save-project-click-callback.js`, `import-form-click-callback.js`, `export-form-click-callback.js`)
- Theme / SCSS changes (`css/sass/**`, `css/paper/**`, `css/vendor/**`)
- Build and packaging changes (`gulpfile.js`, `package.json`, `package-lock.json`)
- Vue port changes (`formbuilder-vue/**`) — the port ships the same formbuilder features

## QA Generation Rules

For every meaningful change, generate at least one QA check.

Each QA check must include:

- **Test Description** — what is being tested.
- **Expected Result** — what success looks like.
- **Manual Action** — step-by-step staging instructions.

Rules:

- Must be executable in staging.
- No abstract descriptions.
- No unit/integration test instructions.
- Full coverage of changes required.
- No duplicates.
- The Baseline Regression Suite below is always emitted on top of the diff-derived checks; it is exempt from the "No duplicates" rule.

## Baseline Regression Suite (always included)

Every QA report MUST include the checks below, regardless of the diff. They are
emitted even when the change does not touch layout, navigation, or data rendering,
and they are **not** diff-derived.

Do not deduplicate them against diff-derived checks, and do not drop them when the
diff is small or unrelated. They are the standing guard for this app's shared
surfaces — the `formbuilder` singleton (`js/app_modules/config/formbuilder.js`),
`config/consts.js`, `config/extend-natives.js`, the Sass partials (especially
`css/sass/_variables.scss` and `_media-queries.scss`), and the runtime
`public/views/**` — where a change to one surface silently breaks another. The
same applies to the Vue port's equivalents under `formbuilder-vue/**`.

### B1. Add a question

- **Test Description:** Confirm every question type can be added from the tools palette to the form canvas.
- **Expected Result:** Each palette type — text, textarea, integer, date, time, radio, checkbox, dropdown, barcode, location, audio, video, photo, phone, readme, branch, group, searchsingle — is draggable onto the canvas; the input registry resolves the type; an integer question offers the decimal numeric type; a branch/group shows a header and an empty container; default properties appear in the panel; the question count increments; the undo state is pushed.
- **Manual Action:** On staging, open a project; drag each type from the tools list onto the canvas; confirm each renders its default markup and properties; delete each one; repeat for branch and group.

### B2. Reorder, nest and delete

- **Test Description:** Confirm questions can be reordered, nested and deleted with jQuery UI sortables and the changes survive a re-render.
- **Expected Result:** Dragging a question above/below another updates the project-definition order and the preview; a question can be dragged into a branch or group; a branch can hold questions and nested groups; a group can hold questions but not branches or groups; deleting a container removes its children; undo restores the previous order and nesting. The legacy app has **no redo** — undo only.
- **Manual Action:** On staging, add four questions; drag the fourth above the first; add a branch and drag two questions inside; add a group inside the branch and drag a question into it; attempt an invalid nesting; delete the group and confirm its questions are gone; press Undo and confirm the tree is restored.

### B3. Property editor

- **Test Description:** Confirm the properties panel edits the selected question and all property tabs bind to the right fields.
- **Expected Result:** Title, question text, required, uniqueness, default answer, regex, date/time format, min/max, possible answers and advanced properties apply only to the allowed input types; the title checkbox enforces the 3-title limit; an empty or invalid question shows the error state and keeps Save disabled; the ref stays consistent after save/reload; changing a type-appropriate property updates the preview.
- **Manual Action:** On staging, select a Text question; edit the question text; set it as a title; toggle required and uniqueness; enter a regex; select an Integer question and set min/max; select a Date question and change the format; open the Advanced tab and change each field; clear the question text and confirm the error state.

### B4. Possible answers

- **Test Description:** Confirm possible answers can be added, deleted, sorted and paginated, and that CSV import/export works.
- **Expected Result:** Answers can be added, edited, reordered and deleted; pagination works at 100 answers per page; the maximum is 300 answers (1000 for search types); `answer_ref` is 13 alphanumeric characters and unique; CSV import offers replace/append and a column picker; a malformed CSV is rejected with a clear message; export produces a CSV with the current answers; deleting an answer that a jump references leaves the jump dangling and the save is then rejected as an invalid jump.
- **Manual Action:** On staging, open a Radio question; add five answers; reorder them; export the CSV and confirm the rows; import the CSV in append mode; import a malformed file and confirm the error; link an answer to a jump, delete the answer and confirm the save is then rejected; add more than 100 answers and page through them.

### B5. Jumps

- **Test Description:** Confirm jump conditions, destinations, END rules and branch jumps behave as designed.
- **Expected Result:** A multiple-answer question can jump on a specific answer, `IS NOT`, `NO ANSWER GIVEN` or `ALWAYS`; the immediately following question is not offered as a destination; `End of form` is offered only when at least one question would be skipped; single-answer questions only allow `ALWAYS`; a jump to an answer that no longer exists is rejected on save; branch jumps use the branch's own input order.
- **Manual Action:** On staging, add three questions and a Radio question with three answers; add a jump on the Radio to the third question; confirm the next question is absent from the destination list; set a jump to `End of form`; remove the last question and confirm `End of form` is no longer offered; delete a linked answer and confirm save rejects the dangling jump; repeat inside a branch.

### B6. Save project

- **Test Description:** Confirm the project saves, validates, cleans runtime data and reports failures.
- **Expected Result:** Saving a valid change shows the success toast; the POST body is `base64(gzip(JSON))` with no `dom` properties and with branch `group` arrays cleared; jump objects contain only `to`/`when`/`answer_ref`; reloading the project shows the change; an invalid jump or input blocks the save and names the question; a failing request shows the server error titles and leaves the app usable; the standalone build posts to `../postdump/index.php`.
- **Manual Action:** On staging, edit a question and save; reload and confirm the change; inspect the POST body in dev tools and confirm the encoding and the absence of `dom`; create an invalid jump and confirm Save is blocked; simulate a server error and confirm the error toast; confirm the standalone local build uses the local dump endpoint.

### B7. Import project JSON

- **Test Description:** Confirm a form round-trips through the JSON import contract and invalid input is rejected.
- **Expected Result:** Export downloads `<project-slug>__<form-slug>.form.epicollect.json` with `data.type: "form"` and `data.form.type: "hierarchy"`; importing it into another form rewrites the refs to the target form and preserves questions, branches, groups, possible answers and jumps; an invalid file, an invalid input structure, an over-limit form or an invalid jump is rejected without changing the form; legacy invalid end jumps are sanitized on import; the import replaces, not appends.
- **Manual Action:** On staging, export a form with a branch, a group, a Radio question and a jump; add a second form; import the file into it; confirm the structure and jump destinations; import a corrupted JSON and a form with an invalid ref and confirm both are rejected; hand-edit a legacy `END` jump on the last input, import, and confirm it is cleared.

### B8. Theme, views and build

- **Test Description:** Confirm the SCSS pipeline, the runtime views and the cache busters stay in sync.
- **Expected Result:** Changes to `css/sass/_variables.scss`, `_mixins.scss` or `_media-queries.scss` reach `public/css/formbuilder.css`; the Bootstrap Material theme and vendor CSS reach `public/css/vendor-formbuilder.css`; every `public/views/**` fragment loads through `consts.VIEWS_PATH` with `?v=<FORMBUILDER_VERSION>`; `#formbuilder-version` `data-version` and the `js/formbuilder.js?v=` query carry the same fresh value after a release; a renamed or missing view fails visibly in the console; no stale view is served.
- **Manual Action:** On staging, change a Sass variable and rebuild; confirm the compiled CSS and the UI; open the network panel and confirm each view request carries the same `v`; confirm both cache-buster fields match; hard reload; rename a view temporarily and confirm the missing view is visible in the console, then restore it.

B1-B8 are emitted as CSV rows like any other check - apply the comma substitution rule to them too. Run the full suite in Chrome, Safari and Firefox: jQuery UI drag/drop, the Bootstrap modals and the fixed-column layout behave differently across engines. Mark a cell `N/A` only when a check genuinely does not apply to that browser.

## Output Format

### 1. QA Report (Markdown file)

Grouped by feature or area.

### 2. QA CSV file (.csv)

Columns: `Action Description` | `Expected` | `Chrome` | `Safari` | `Firefox`

> The `|` above is markdown table/list notation for readability only — it is NOT the file separator. The `.csv` file must be a standard comma-separated file (commas delimit columns), so it imports cleanly into Google Sheets.

- One row per QA check.
- Action must describe a human action in staging.
- Expected must describe observable result.
- The browser columns (`Chrome`, `Safari`, `Firefox`) are filled in during the QA process to record the outcome per browser (e.g. PASS/FAIL or any browser-specific notes).
- All three browsers are targeted. Where a check genuinely does not apply to one of them, pre-fill that cell with `N/A` at generation time.
- If a check is not applicable on a given browser, record that explicitly (e.g. N/A) instead of leaving it blank.
- Commas are used only as column separators, never inside cell text.
- Inside `Action Description` and `Expected`, replace commas with `;` to separate step lists or clauses, so they never collide with the comma column separator and the CSV imports cleanly into Google Sheets (the `|` in this doc's column list above is just markdown notation, not a separator in the file).
- Cell text must stay comma-free; no quoted/escaped fields are needed.

## Validation Rules

Before output, ensure:

- Full coverage of changes.
- No duplicates.
- All steps reproducible in staging.
- Diff fully mapped to QA checks, plus the Baseline Regression Suite.
- The Baseline Regression Suite is present in both the Markdown report and the CSV.
- No commas inside CSV cell text; commas only separate columns.
