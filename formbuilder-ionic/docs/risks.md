# Ionic port — risk register

Risks found while porting the legacy builder into `formbuilder-ionic/`, backfilled
from phases 1–8. Each entry records what can go wrong, where it lives, the
impact, and what to check when the area is touched again.

This register is a working list, not a defect log: a risk can be accepted
(legacy parity), fixed (keep the regression in mind), or open (needs a decision
or more work). Reconstructed from the code as of phase 8, so line-level detail
lives in the named functions, not in line numbers that will drift.

Updated: 2026-11-05 (phase 8 component replacement).

Status legend: **open** — not addressed; **watch** — accepted or fixed but easy
to regress; **fixed** — the concrete case found during the port is handled.

## Cross-cutting

### R-01 Two implementations of the same behaviour can drift
- **Where:** `js/app_modules/**` (legacy, frozen) and `formbuilder-ionic/src/**`.
- **Risk:** the port was written from the legacy behaviour, not shared with it.
  A rule fixed or changed on one side silently diverges on the other, and the
  legacy Mocha suite only gates legacy code.
- **Impact:** the same project JSON behaves differently in the two builders.
- **Status:** open.
- **Revisit when:** a validation, jump or answer rule changes; add a parity
  case to the Ionic tests rather than a comment.

### R-02 Ionic custom elements created from `<template>` clones drop property writes
- **Where:** `src/ui/dom.js` `createView`, `src/ui/shell.js` `renderProperties`.
- **Risk:** a cloned `ion-*` node is an inert `HTMLElement` until it is inserted.
  Writing `checked`, `value`, `options` before insertion is lost. This is how the
  title checkbox lost its state in phase 1.
- **Impact:** controls render with stale or default values while the model holds
  the right one.
- **Status:** fixed (the card is inserted into `#properties` before the panels
  bind), watch: any new panel that builds a view and sets props first.
- **Revisit when:** adding a new card or moving the render order.

### R-03 Drag and drop has no automated coverage
- **Where:** `src/ui/sortable.js` (jQuery UI 1.14 on jQuery 4), `install*Sortable`.
- **Risk:** jsdom cannot exercise jQuery UI drag/drop, and the legacy page loads
  jQuery 2.2.1 while this port bundles jQuery 4.
- **Impact:** a sortable regression passes the suite and only shows in a browser.
- **Status:** watch.
- **Revisit when:** touching sortable options, placeholder, or the drop resolver;
  smoke-test question, answer and branch sorting in a real browser.

### R-04 Re-rendering the properties panel competes with typing and scrolling
- **Where:** `renderProperties`, `bindTitleToggle`, `refreshCurrentProperties`.
- **Risk:** a full re-render while the caret is in a field loses focus, the scroll
  position and IME composition. The phase-1 title toggle caused a scroll jump
  precisely because it re-rendered.
- **Impact:** text editing feels broken; users lose their place mid-question.
- **Status:** fixed for the title toggle (`bindTitleToggle` only updates state),
  watch everywhere else.
- **Revisit when:** an edit needs to update other parts of the panel — prefer the
  targeted `refresh*` helpers over `renderProperties`.

## Phase 1 — properties panel

### R-10 Shared property fragments can break the legacy runtime silently
- **Where:** `public/views/properties/**` reused verbatim at build time;
  `src/views/properties-card.html`.
- **Risk:** legacy selectors depend on `div.panel` / `div.panel-body` and hook
  classes. Renaming or restructuring a fragment fails at runtime, with no
  compile step to catch it.
- **Impact:** a property panel stops binding in one or both apps.
- **Status:** watch.
- **Revisit when:** editing anything under `public/views/`; load the legacy page
  and the Ionic page before closing the change.

### R-11 The advanced panel removes fields from cloned markup
- **Where:** `buildAdvancedPanel` — `field.remove()` for every type-gated field.
- **Risk:** field availability now depends on starting from a fresh clone. Any
  future caching or reuse of the pane leaves the removed fields gone for the
  next question type.
- **Impact:** a field disappears for a type that should show it.
- **Status:** watch (works because the pane is cloned per render).
- **Revisit when:** caching panels or switching tabs without a re-render.

### R-12 Title-limit refusal is explained by a label, not a message
- **Where:** `bindTitleToggle` — a refused fourth title resets `toggle.checked`.
- **Risk:** the only feedback is the label computed before the click. If that
  label is ever changed or hidden, the checkbox silently refuses input.
- **Impact:** the user thinks the checkbox is broken.
- **Status:** watch.
- **Revisit when:** restyling the title row or adding inline help.

### R-13 The 42px question-row height is hard-coded
- **Where:** `src/theme/_builder.scss` `.builder__question`.
- **Risk:** the value was measured against the current font and icon set. A
  longer label, a different zoom or a new trailing icon can clip or misalign rows.
- **Impact:** clipped question text and a jittery sortable.
- **Status:** watch.
- **Revisit when:** changing row content, fonts or icon size.

## Phase 2 — branches and groups

### R-20 The editing stack stores refs and is not reconciled on delete
- **Where:** `src/services/session.js` — `editing`, `getEditingTrail`,
  `removeInput`.
- **Risk:** deleting a container while it (or an ancestor) is being edited leaves
  a ref that no longer resolves; `getEditingTrail` stops at the missing entry and
  the UI silently falls back to an outer list.
- **Impact:** breadcrumb and list change under the user without an explanation.
- **Status:** open (delete inside a branch/group is not exposed yet in the port,
  so the path is currently unreachable from the UI).
- **Revisit when:** wiring delete/duplicate for nested containers.

### R-21 Selection only resolves inside the active list
- **Where:** `getCurrentInput`, `selectInput`, `enterInput` / `exitEditing`.
- **Risk:** `current_input_ref` is meaningful only while its container is the
  active list. Any flow that leaves the list without clearing the ref empties the
  properties panel with no error.
- **Impact:** "select a question to edit it" while a question is still highlighted.
- **Status:** watch.
- **Revisit when:** adding navigation (undo, import, form switching) that can
  change the active list.

### R-22 Nesting rules are enforced at creation, not on every append
- **Where:** `services/nesting.js` `canContainInput`, `insertInput`,
  `services/session.js` `addInputObject`.
- **Risk:** tools and `insertInput` check the rule; duplication appends the copy
  through `addInputObject`, which does not. The active list normally cannot hold
  an illegal type, so the gap only opens for malformed project JSON.
- **Impact:** an illegal branch-in-group tree, which the mobile app may not render.
- **Status:** watch (low probability, contract-level impact).
- **Revisit when:** duplication gains other entry points, or project loading stops
  trusting the server tree.

### R-23 Generated refs are not checked for uniqueness
- **Where:** `factory/refs-factory.js`, `factory/input-factory.js`, `question-actions.js`.
- **Risk:** refs use a 13-character random suffix per parent; uniqueness is
  assumed, not verified, while the import validator does enforce it.
- **Impact:** a collision would merge two questions in lookups and jumps.
- **Status:** watch (collision probability is negligible; the asymmetry with
  import validation is the real smell).
- **Revisit when:** ref generation changes.

## Phase 3 — jumps

### R-30 Missing jump answers are silently retargeted, not flagged
- **Where:** `services/jumps.js` `normalizeJump`.
- **Risk:** when the saved `answer_ref` is not in `possible_answers`, the jump is
  rewritten to the first answer on any update (or on render of the row, which
  preselects the first option).
- **Impact:** the panel shows a jump the data does not contain; the retarget
  happens without the user choosing it.
- **Status:** open (legacy behaviour, but the port makes it visible in a select).
- **Revisit when:** touching jump normalisation or answer deletion/import.

### R-31 Jump destinations are a function of current order
- **Where:** `getJumpAvailableDestinations` (`list.slice(index + 2)`),
  `services/validation.js` `getJumpErrors`.
- **Risk:** reordering or deleting questions invalidates stored destinations.
  Validation recomputes, but a row rendered before the re-render can still show a
  stale destination label.
- **Impact:** users save a jump to a question that moved out of range (caught as
  invalid once the panel re-renders).
- **Status:** watch.
- **Revisit when:** changing the order flows or the save gate.

### R-32 A broken nested jump lights the Properties tab, not Jumps
- **Where:** `services/validation.js` `getInputErrors` — child errors are folded
  into `INVALID_BRANCH_INPUTS` / `INVALID_GROUP_INPUTS` on the Properties tab.
- **Risk:** the Jumps badge on the branch/group stays clean while a child's jump
  is invalid.
- **Impact:** the user opens Jumps and finds nothing wrong; the bad row is one
  level down.
- **Status:** open.
- **Revisit when:** improving tab badges or row-level jump errors.

### R-33 Deleting or importing answers leaves jumps pointing at old refs
- **Where:** `services/possible-answers.js` `removePossibleAnswer`,
  `deleteAllAnswers`; `possible-answers-csv.js` `importAnswers`.
- **Risk:** jumps keep their `answer_ref`. Validation catches it
  (`JUMP_ANSWER_NOT_SELECTED` for `IS` / `IS_NOT`), but the jump row renders the
  first answer as selected while the stored ref is dangling.
- **Impact:** the question is invalid, yet the panel looks like a valid jump
  exists until the user touches the dropdown.
- **Status:** open (validation catches it; presentation hides it).
- **Revisit when:** revisiting R-30, or when save starts blocking invalid input.

## Phase 4 — validation and question copy

### R-40 Validation is UI-time only; there is no save gate yet
- **Where:** `services/validation.js`, `bindPropertyActions` (Copy gate).
- **Risk:** nothing but Copy consumes validity. A question can stay invalid while
  the user continues, and any future export path that forgets to call
  `areAllInputsValid` ships invalid JSON.
- **Impact:** invalid projects exported or saved.
- **Status:** fixed — `saveProject` runs `areAllInputsValid` and the project
  limits before encoding; Copy still gates on validity.
- **Revisit when:** adding another write path (export validates the one form it
  writes).

### R-41 Validity is recomputed on every keystroke, recursively
- **Where:** `refreshCurrentProperties`, `updateCurrentQuestionStatus`,
  `isInputValid` (recurses into branch/group children).
- **Risk:** each keystroke revalidates the question and, for containers, its whole
  subtree. With 300 questions and deep nesting this is repeated work; nothing
  caches it.
- **Impact:** typing lag in large forms (not measured yet).
- **Status:** open, low priority.
- **Revisit when:** a large project feels slow; measure before changing.

### R-42 A copy can be born invalid
- **Where:** `services/question-actions.js` — root jumps are dropped and child
  jumps remapped, but a child's `END` jump inside a copied branch survives.
- **Risk:** `END` is only valid where a question would be skipped in the target
  list; inside a branch it may not be. Copies also keep any other state that was
  valid in the old position.
- **Impact:** copying can create an invalid question the user did not edit.
- **Status:** open, low probability.
- **Revisit when:** copy semantics change or the save gate lands.

### R-43 Row badges refresh only on a full render
- **Where:** `renderQuestions` vs `refreshCurrentProperties`.
- **Risk:** only the selected row's title/status is updated live; other rows keep
  their badges until a render. Edits that invalidate a *different* question (none
  today, since answers and jumps are local) would show a stale badge.
- **Impact:** a stale badge on a sibling row.
- **Status:** watch.
- **Revisit when:** introducing cross-question edits (e.g. shared titles,
  project-wide search types).

## Phase 5 — possible answers

### R-50 CSV replace clears the default and leaves jumps dangling
- **Where:** `importAnswers` (`input.default = null`, new answer refs).
- **Risk:** every stored jump answer ref stops existing after a replace import.
  Validation reports the question invalid, but the jump UI shows a fallback
  answer (R-30/R-33), so the data and the panel disagree.
- **Impact:** answers imported successfully, question silently invalid.
- **Status:** open.
- **Revisit when:** revisiting jump normalisation or adding an import warning.

### R-51 CSV parsing is synchronous and unbounded
- **Where:** `parseCsv` + `FileReader.readAsText` in `openAnswersCsv`.
- **Risk:** the whole file is loaded and parsed on the main thread before the
  300/1000 answer cap applies. A large or pathological file (quoted multi-line
  cells) freezes the tab.
- **Impact:** unresponsive tab; possible memory spike.
- **Status:** open.
- **Revisit when:** users report large imports, or a file-size guard is added.

### R-52 Sanitising on every keystroke can fight the input method
- **Where:** `buildAnswerRow` — `sanitizeAnswer` runs in `ionInput` and rewrites
  `field.value` when it differs.
- **Risk:** rewriting the value interrupts IME composition (CJK), and the 250-char
  cap silently truncates pasted text with no feedback.
- **Impact:** dropped characters while composing; surprising truncation.
- **Status:** open.
- **Revisit when:** localisation work, or if users report lost input.

### R-53 Paging refuses to move without pointing at the offending answer
- **Where:** `installAnswersPager` + `canLeaveAnswersPage`.
- **Risk:** an empty answer on the current page blocks paging and shows a note,
  but the empty row is not selected or scrolled to; on a 100-row page it can be
  off-screen.
- **Impact:** the pager looks broken.
- **Status:** open.
- **Revisit when:** polishing answers UX.

### R-54 Page state maps are never pruned
- **Where:** `answer_pages`, `answer_notices` in `src/ui/shell.js`, keyed by
  `input.ref`.
- **Risk:** deleting questions or forms leaves entries behind for the lifetime of
  the tab. Values are clamped, so the effect is memory growth, not a wrong page.
- **Impact:** negligible for one session, unbounded over long editing sessions.
- **Status:** watch.
- **Revisit when:** undo/import start replacing whole project definitions.

### R-55 Drag sorting is page-local while the menu ordering is list-wide
- **Where:** `reorderAnswerPage` (sortable) vs `orderPossibleAnswers` (menu).
- **Risk:** with more than 100 answers, dragging reorders only the visible page,
  while A-Z / shuffle sort the whole list. Legacy had the same split, but the UI
  does not say so.
- **Impact:** users expect a drag to move an answer across pages.
- **Status:** watch (parity), document if it confuses.
- **Revisit when:** revisiting pagination UX.

### R-56 Append imports can duplicate values
- **Where:** `importAnswers` — no de-duplication, matching legacy.
- **Risk:** importing the same CSV twice doubles the answers; duplicate values are
  legitimate for some questions, so this cannot be fixed by value alone.
- **Impact:** duplicate choices in the mobile app.
- **Status:** watch (parity).
- **Revisit when:** revisiting import UX.

### R-57 The add-answer button disables at the limit with no explanation
- **Where:** `buildPossibleAnswers` — `add_button.disabled = at_limit`.
- **Risk:** at 300 (or 1000 for search types) the button simply stops working;
  there is no message and no count.
- **Impact:** users think the app is stuck.
- **Status:** open.
- **Revisit when:** polishing answers UX.

### R-58 CSV export is covered by unit tests but not by a browser download
- **Where:** `installAnswersMenu` `export` + `downloadCsv` (Blob + anchor).
- **Risk:** the Blob/anchor download path is not exercised end to end; a browser
  or CSP change could block it while tests stay green.
- **Impact:** export silently does nothing.
- **Status:** open.
- **Revisit when:** first manual export check; `downloadFile` is now shared with
  the form export.

## Phase 6 — undo

### R-60 A snapshot is data only
- **Where:** `services/undo.js` `capture` / `undo`.
- **Risk:** the project definition and the form index are restored; selection,
  branch/group editing, the active property tab, answer pages and scroll are
  not. Undo therefore drops the user out of the question they were editing.
- **Impact:** the edit is undone correctly, but the user has to reselect the
  question and the tab to continue.
- **Status:** watch (legacy also lost the selection; keeping the form index is
  already a deliberate improvement).
- **Revisit when:** restoring selection is requested, or phase 7 needs the undo
  state to carry more UI context.

### R-61 Typing undone within the throttle window is skipped
- **Where:** `pushUndoState({ throttle: true })` — the snapshot is taken when the
  500ms timer fires.
- **Risk:** pressing Undo before the timer fires clears the pending push, so the
  keystrokes that had not been captured are removed along with the previous
  action.
- **Impact:** one undo can revert more than the user expects right after typing.
- **Status:** open for the data window (matches legacy debounce); fixed for the
  UI gate — the Undo button now refreshes when the deferred snapshot lands
  (`on_change`), covered by a shell test.
- **Revisit when:** undo UX is refined; capture on blur as well as on the timer.

### R-62 Every push deep-clones the whole project
- **Where:** `capture` — `JSON.parse(JSON.stringify(project_definition))`, up to
  ten states.
- **Risk:** a 300-question project is cloned on every action (typing coalesced to
  one per pause), and undo itself clones again. Memory and CPU grow with project
  size; nothing is measured yet.
- **Impact:** lag on large projects, especially while typing across many edits.
- **Status:** open, low priority.
- **Revisit when:** large projects feel slow; measure before optimising.

### R-63 The baseline follows project identity
- **Where:** `ensureUndoBaseline` compares the `project_definition` object to the
  recorded baseline; `undo` updates the marker after `setProject`.
- **Risk:** any future flow that replaces the project object must go through
  `setProject` (which triggers a reset) or history will mix two projects. Any
  flow that mutates the current object *without* pushing leaves no undo entry.
- **Impact:** undo restores data from another project, or a change cannot be
  undone.
- **Status:** watch — form import patches the current form's inputs in place
  (the project object stays the same), so its undo entry and the baseline are
  unaffected; project load still replaces the object through `setProject`.
- **Revisit when:** a flow replaces or reloads the project object.

### R-64 Dedupe hides no-op pushes
- **Where:** `store` compares the serialized state with the top of the stack.
- **Risk:** an action that changes nothing (opening the CSV panel, exporting,
  a refused title toggle) records no undo step, which is intended. But a change
  that a handler *fails* to apply also looks like a no-op, so a broken handler
  will not be visible as a missing undo step.
- **Impact:** none on its own; it removes a signal that could have exposed a
  mutation bug.
- **Status:** watch.
- **Revisit when:** a mutation silently does nothing.

## Corrected earlier note

The phase-5 report claimed validation does not cross-check that a jump's
`answer_ref` still exists. It does: `getJumpErrors` flags `JUMP_ANSWER_NOT_SELECTED`
when the ref is missing from `possible_answers`. The real gap is presentation —
the jump row shows a fallback answer (R-30, R-33).

## Phase 7 — save, export, import, form management

### R-65 The save endpoint is derived from the page path
- **Where:** `services/save.js` `getSaveUrl` drops the last two path segments.
- **Risk:** the builder page and project slug are assumed to be the last two
  segments. A different mount depth, a trailing slash or a hash-only URL builds
  a different endpoint, and the failure surfaces as a generic save error.
- **Impact:** saving silently posts nowhere useful; the project stays unsaved.
- **Status:** watch.
- **Revisit when:** the builder route or the Laravel endpoint changes; compare
  the built URL with the legacy `config/consts.PROJECT_URL`.

### R-66 Saving needs `CompressionStream`
- **Where:** `services/save.js` `encodeProject`.
- **Risk:** the browser has to provide `CompressionStream` (Safari 16.4+).
  Otherwise the save throws before the request and only a toast explains it.
  Export and import are unaffected.
- **Impact:** older browsers cannot save at all.
- **Status:** open (accepted: no polyfill is bundled).
- **Revisit when:** the supported browser matrix changes.

### R-67 Import does not repair jumps that point at replaced inputs
- **Where:** `services/form-import.js` `prepareImportedForm`, `ui/shell.js`
  `importFormFile`.
- **Risk:** the import replaces the current form's `inputs`. Any jump in another
  question that targeted one of the removed refs becomes invalid, and imported
  refs are rewritten onto the current form ref, so a suffix that already exists
  produces duplicate refs with ambiguous jump targets.
- **Impact:** the form imports "successfully" with broken or misdirected jumps.
- **Status:** open.
- **Revisit when:** adding ref uniqueness checks or post-import jump repair;
  validate the whole project after an import, not just the imported list.

### R-68 Rename regenerates the slug
- **Where:** `services/session.js` `renameForm`, `services/save.js`
  `getFormExportFilename`.
- **Risk:** renaming rebuilds the slug from the name, so two names can slugify
  to the same value (`Form A` and `Form-A`), and the export filename or a server
  lookup keyed by slug can collide. Name uniqueness is checked; slug uniqueness
  is not.
- **Impact:** ambiguous export filenames, or a server-side lookup that returns
  the wrong form.
- **Status:** open.
- **Revisit when:** slugs are used as keys anywhere in the save/export path.

### R-69 Undo restores the project but not the selection
- **Where:** `services/undo.js`, `ui/shell.js` `performUndo`.
- **Risk:** an undo restores the previous definition while the form index and
  question ref point into the newer one. The form index is now clamped, but a
  restored question ref can still select a different question than before.
- **Impact:** the panel shows another question after undo, or an empty panel.
- **Status:** watch (form index clamped, question ref still data-driven).
- **Revisit when:** undo is touched; keep a shell case for add-form + undo.

### R-70 The form menu is `ion-popover`, the rest are inline panels
- **Where:** `src/views/question-card.html`, `ui/shell.js` `openFormRename`,
  `askFormConfirm`, `importFormFile`.
- **Risk:** the menu is an Ionic popover but rename, confirm and file picking are
  inline panels re-created on every render. A re-render (undo, save, name change)
  throws away an open confirmation, and phase 8 has to replace these panels with
  modals without losing the toast and `data-role` hooks.
- **Impact:** a confirm can disappear mid-flow; the phase-8 migration can strand
  the file input or the toast target.
- **Status:** watch.
- **Revisit when:** adding the Ionic modals; keep the `data-role` hooks stable.

### R-71 Import reads the whole file on the main thread
- **Where:** `ui/shell.js` `importFormFile` (`FileReader.readAsText`).
- **Risk:** only the `.json` extension is checked; a large or hostile file is
  parsed and schema-validated synchronously, blocking the UI. There is no size
  cap and no MIME check.
- **Impact:** a slow or frozen builder while the import runs.
- **Status:** open.
- **Revisit when:** imports become common or large exports are expected.

### R-72 An edit made during a save is marked saved
- **Where:** `ui/shell.js` `performSave`, `recordChange`.
- **Risk:** the payload is encoded when the save starts; a mutation while it is
  in flight is not in that payload, yet a successful response clears
  `unsaved_changes` and shows "Project saved!". A second save is only blocked by
  the `saving` flag.
- **Impact:** the unload guard can let an unsaved edit go after a save that
  raced it.
- **Status:** open.
- **Revisit when:** adding autosave/retries; track a save revision instead of a
  boolean.

## Phase 8 — chrome feedback, guards and limits

### R-73 The import docs link is a placeholder
- **Where:** `src/views/delete-question-modal-body.html`.
- **Risk:** the delete confirmation links to the edit-inputs docs section; if
  that anchor moves, the help link breaks.
- **Impact:** users lose the delete-questions help.
- **Status:** open.
- **Revisit when:** the docs pages are confirmed; verify the anchor.

### R-74 One toast replaces the previous one
- **Where:** `src/ui/toast.js` `showToast`, `TOAST_DURATION = 3200`.
- **Risk:** the legacy toastr stacked messages; this keeps one. A validation
  error followed immediately by another message hides the first, and the fixed
  duration ignores message length.
- **Impact:** a message can disappear before the user reads it.
- **Status:** watch.
- **Revisit when:** adding more notification points or long messages.

### R-75 The wait overlay can stay up if an action throws
- **Where:** `src/ui/loading.js`, `.wait-overlay` in `_reset.scss`.
- **Risk:** the overlay is the legacy full-viewport sheet with `cursor: wait`.
  It is shown synchronously and hidden from the action's `setTimeout`, so an
  exception between `showLoading` and `hideLoading` leaves it blocking the page.
- **Impact:** the builder looks stuck rather than busy.
- **Status:** watch (save hides in both branches, import guards its errors).
- **Revisit when:** adding another long-running action.

### R-76 Help is no longer context-preserving
- **Where:** the docs links in the properties and question cards.
- **Risk:** opening docs in a new tab keeps the builder state, but the legacy
  modal kept the help inside the page. Reloading the builder from the docs tab
  now triggers the `beforeunload` guard, so losing changes needs an explicit
  confirmation.
- **Impact:** unsaved edits can be lost while reading the help.
- **Status:** fixed (guard ported in phase 8); the pending placeholder URLs are
  R-73.
- **Revisit when:** the docs links or the guard change.

### R-77 The unload guard tracks a boolean, not a saved snapshot
- **Where:** `src/ui/shell.js` `recordChange`, `performSave`,
  `installUnloadGuard`.
- **Risk:** `unsaved_changes` is set by any recorded change and cleared only by a
  successful save. Editing a value and undoing it still warns, while a save
  clears the flag even if a throttled typing snapshot lands afterwards (the JSON
  is live, so the save itself is correct).
- **Impact:** a spurious leave prompt, never a silent data loss.
- **Status:** watch.
- **Revisit when:** undo or dirty tracking changes; compare against a saved
  snapshot instead of a flag.

### R-78 The delete confirmation closes over the question object
- **Where:** `src/ui/shell.js` `bindPropertyActions`, `src/ui/modal.js`.
- **Risk:** the confirm handler captures the input and removes it by ref. If the
  panel is re-rendered (undo, another delete) while the alert is open, the alert
  survives but the question may already be gone; the confirm then no-ops, and a
  different question can occupy the same ref only if refs are regenerated.
- **Impact:** a confirmation that does nothing, or deletes an unintended
  question after an undo.
- **Status:** watch.
- **Revisit when:** the alert is replaced with the modal flow or refs change.

### R-79 Print depends on the browser dialog and print CSS
- **Where:** `src/ui/print.js`, `src/theme/_print.scss`, `src/index.html`.
- **Risk:** jsdom can assert the generated markup and the `window.print` call,
  but the paper output depends on the browser dialog (headers/footers, page
  size) and on the rule that hides every `ion-app` sibling. Readme rich text is
  flattened to plain text and long tables can split across pages.
- **Impact:** the preview is correct in the DOM yet paginates badly on paper.
- **Status:** watch (markup tested, print output not).
- **Revisit when:** print styling or the app shell changes; check in a browser.
