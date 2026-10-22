# Code Review Workflow

This is a review-only task.

## Inputs

- **git diff** against base branch (primary source of truth).
- **Full file context** when needed to understand surrounding code.
- **Code comments** — read the comments in every changed file before raising any candidate finding. Comments may state invariants or design decisions (e.g. why `dom` is stripped before saving, why branch `group` arrays are cleared). Do not raise a finding that a comment in the changed code explicitly addresses.
- **`docs/ARCHITECTURE.md`** — read the whole file before raising any candidate finding. It is the source of truth for system design. Cross-check any candidate against the whole document before raising it; if it matches, drop it.
- **`docs/known-review-false-positives.md`** — read the whole file before raising any candidate finding. It lists findings that look like defects but are by design. If a candidate matches an entry (or is the same defect on a different path), drop it.
- **`docs/legacy-known-defects.md`** — read the whole file. A finding that describes one of those defects is already known; do not re-report it unless the change claims to fix it and does not.

## Responsibilities

- Analyze only changed code.
- Determine the base branch automatically (`master`, `main`, `dev`, or upstream tracking branch).
- Determine what the change is intended to do.
- Detect regressions or unintended behaviour changes.
- Assume the author intentionally implemented the feature.
- Prioritize correctness over style.

## Review Mode

- Do not modify files.
- Do not propose large refactors.
- Do not enter planning mode.
- Do not generate implementation steps unless necessary to explain a bug.

## Focus Areas

Review changes for:

- **Runtime singleton and refs**: `config/formbuilder.js` holds `project_definition`, `current_form_ref`, `current_form_index`, `current_input_ref`, the branch/group editing flags and `render_action`. A change that resets the wrong ref, or that reads a stale cached DOM handle after a form is added/removed, breaks selection, validation and save.
- **Project-definition shape**: `data.project.forms[].inputs[]` is the contract shared with the server, mobile app and dataviewer. Renaming or removing a field, or changing the nesting of branches/groups, is a breaking change. `dom` must never be persisted.
- **Save pipeline**: `doCleaningBeforeSaving` strips `dom`, replaces Word smart characters, clears legacy `group` arrays on branch inputs and normalizes jumps. Removing any of those steps leaks runtime state into the POST or reintroduces legacy data. The POST body is `base64(gzip(JSON))`; a change to the encoding must be matched on the server.
- **Import/export**: the import wrapper is `{ data: { id, type: 'form', form } }`; `data.type` must be `form` and `data.form.type` must be `hierarchy`. The import rewrites the imported form ref to the current form ref by global string replacement — a ref that is a prefix of another can be corrupted. The import replaces the current form's inputs; it does not append.
- **Jumps**: destinations are forward-only; the immediately following question is not a valid destination; `END` is only valid when at least one question would be skipped. `answer_ref` must be `null` for `ALL` / `NO_ANSWER_GIVEN`. Branch jumps use the branch's own input list.
- **Validation gates**: `areAllInputsValid`, `areFormInputsValid`, `validateBeforeSaving` and `performValidation` drive the save/export buttons and tab icons. A rule that stops running leaves the button enabled and the UI green.
- **Possible answers**: pagination (100 per page), the 300-answer maximum (1000 for the two search types), CSV import/export, duplicate `answer_ref`s, and deletion of an answer that a jump still references. `answer_ref` is 13 alphanumeric characters (`^[a-zA-Z0-9]{13}$`).
- **Undo**: `state` is a deep copy (Flatted), capped at 10. `pushState` is skipped while `render_action === 'undo'`; a change that pushes during undo corrupts the stack. Re-rendering must rebind `dom` and event handlers.
- **Views and cache busting**: `public/views/**` files are fetched at runtime through `consts.VIEWS_PATH`; a renamed/missing file is a silent runtime failure. `public/index.html` has two cache-buster fields (`#formbuilder-version` `data-version` and the `js/formbuilder.js?v=` query) that must move together.
- **Build and packaging**: Browserify resolves `config/...` and `helpers/...` through `paths: ['./node_modules', './js/app_modules']`. Adding a relative import or a new top-level directory without updating `paths` breaks the bundle. `npm run build` rewrites four tracked artifacts.
- **jQuery behaviour**: the browser loads jQuery 2.2.1; the test suite loads 3.7.1. A change that relies on a 3.x-only API can pass the suite and fail in production. jQuery UI drag/sort/droppable changes need a browser smoke test.
- **API compatibility**: `PROJECT_URL` points at `api/internal/formbuilder/<slug>` in production and `../project/project.json` in the standalone build. A change to URL parsing moves every request and view fetch.
- **Security**: user-controlled HTML reaches `readme` questions, possible answers and imported forms. Check `stripTags`, `decodeHtml`, `innerHTML` and the `eval`-based Safari polyfill; check the gzip/base64 save body and any secret/token exposure.
- **Missing tests**: features or fixes that should have corresponding automated tests. A new test file that is not required in `js/test.js` never runs.

## Vue port parity

When the change touches `formbuilder-vue/`, also check:

- The port and the legacy app must not drift on the same project-definition contract: input shapes, refs, jump semantics, possible-answer limits and the import/export wrapper.
- `docs/CODE-STYLE.md` applies to `formbuilder-vue/**` only. Never report the legacy app for not following it.
- The port's own test suite is Vitest (`cd formbuilder-vue && NODE_ENV=test npx vitest run <file>`); the legacy suite is Mocha (`npm test`). Do not suggest running one against the other.
- The port is greenfield: a finding about missing port code is not a regression unless the change claims to add that code.

## Explicitly Ignore

Do NOT comment on:

- Formatting or whitespace.
- Naming conventions.
- Style-only feedback.
- Unrelated refactoring suggestions.
- The legacy app's age or style — it is frozen and is not being restyled.
- Defensive validation added during a refactor where the original code already trusted the contract and no concrete boundary or failure mode is identified.

## Output Format

### Per-Issue Format

For every finding:

- **Number**: Each finding MUST be numbered sequentially starting at 1 (1, 2, 3, ...), in report order. Numbers must be unique, never skipped or reused, and are the identifier used to reference the finding anywhere else in the review (e.g., "see #3").
- **Severity**: Critical | High | Medium | Low
- **File**: `path/to/file.js:line`
- **Explanation**: What is wrong and why it matters.
- **Suggested fix**: Concrete code change or approach.

### Final Sections

After the individual findings, include:

#### Overall Risk Score

Rate the changeset 1-10 (1 = trivial/safe, 10 = high risk of breakage). Justify briefly.

#### Suggested Manual QA Areas

List specific user flows or scenarios to manually test in staging, tied to the changed code.

#### Missing Tests

List test files and cases that should be written to cover the changed logic — Mocha under `js/test/` for the legacy app, Vitest under `formbuilder-vue/` for the port.

#### Uncertainties

Explain where the review may lack context (e.g., unknown business rules, external dependencies, unclear requirements).
