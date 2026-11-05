# Ionic port — risk register

Risks found while porting the legacy builder into `formbuilder-ionic/`, backfilled
from phases 1–5. Each entry records what can go wrong, where it lives, the
impact, and what to check when the area is touched again.

This register is a working list, not a defect log: a risk can be accepted
(legacy parity), fixed (keep the regression in mind), or open (needs a decision
or more work). Reconstructed from the code as of phase 5, so line-level detail
lives in the named functions, not in line numbers that will drift.

Updated: 2026-11-05 (phase 5 complete).

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
- **Where:** `models/nesting.js` `canContainInput`, `insertInput`,
  `services/session.js` `addInputObject`.
- **Risk:** tools and `insertInput` check the rule; duplication appends the copy
  through `addInputObject`, which does not. The active list normally cannot hold
  an illegal type, so the gap only opens for malformed project JSON.
- **Impact:** an illegal branch-in-group tree, which the mobile app may not render.
- **Status:** watch (low probability, contract-level impact).
- **Revisit when:** duplication gains other entry points, or project loading stops
  trusting the server tree.

### R-23 Generated refs are not checked for uniqueness
- **Where:** `models/refs.js`, `input-factory.js`, `question-actions.js`.
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
- **Status:** open — phase 7 must run the gate in the save pipeline.
- **Revisit when:** implementing save/export.

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
- **Risk:** rewriting the value interrupts IME composition (CJK), and the 150-char
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
- **Revisit when:** first manual export check, or when adding a download helper
  for other exports (phase 7).

## Corrected earlier note

The phase-5 report claimed validation does not cross-check that a jump's
`answer_ref` still exists. It does: `getJumpErrors` flags `JUMP_ANSWER_NOT_SELECTED`
when the ref is missing from `possible_answers`. The real gap is presentation —
the jump row shows a fallback answer (R-30, R-33).
