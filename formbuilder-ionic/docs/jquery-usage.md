# jQuery usage audit

Date: 2026-11-07
Scope: runtime modules under `formbuilder-ionic/src/**`. Tests, `dist/` and
`node_modules/` are covered separately below.
Out of scope by request: jQuery UI widget calls — `.draggable(...)`,
`.sortable(...)` and their `'destroy'` form.

## Result

jQuery survives in three runtime files:

| File | Role |
|---|---|
| `src/jquery.js` | imports `jquery`, publishes `window.jQuery` / `window.$` so jQuery UI can extend the global, default-exports it |
| `src/app.js` | imports `./jquery.js` then `jquery-ui/dist/jquery-ui.min.js` — the only reason either library enters the bundle |
| `src/ui/sortable.js` | the only consumer of `window.jQuery` |

No other module under `src/**` calls jQuery. The remaining mentions are prose:
`ui/shell.js` references jQuery UI in two comments, `services/save.js` mentions
`$.ajax` in a comment, and `src/index.html` plus the theme files describe jQuery
UI behaviour in comments. `editor.on(...)` in `ui/readme-editor.js` is Tiptap,
and the `append` / `closest` calls in `shell.js`, `dropdown.js`, `modal.js`,
`toast.js` and `loading.js` are native DOM.

## jQuery core calls outside the widget APIs

Every call site is inside `src/ui/sortable.js`:

| Call | Where | Why it exists |
|---|---|---|
| `window.jQuery` | `getJQuery()` | dependency check; throws with a clear message when the global is missing |
| `$(tools_selector)`, `$(list_selector)` (three call sites) | `installToolDrag`, `installQuestionSortable`, `installAnswerSortable` | wrap the tools/list so the widget can be initialised |
| `.hasClass('ui-draggable' / 'ui-sortable')` | same | detect an existing widget before re-initialising it |
| `.length` | question and answer sortable installers | bail out when the selector matches nothing |
| `$(this)` | `draggable` `helper` and `stop` callbacks | jQuery UI supplies the raw element as `this` |
| `$('<div class="…">').attr(...).css(...).append(...)` | `draggable` `helper` | build the drag preview with the tool's own attributes, size and children |
| `.attr('data-type')`, `.outerWidth()`, `.outerHeight()`, `.children()`, `.clone()` | same | read the tool, measure it, copy its content |

## What this means

- jQuery core usage is not spread through the port. It is one drag-and-drop
  adapter; the rest of the UI is native DOM.
- Most of the calls exist only to feed jQuery UI: the wrappers, the `length`
  checks, the widget-state `hasClass` checks and the callback bodies. They go
  away with the widgets.
- Two calls could be native today with no behaviour change:
  `$(this).attr('data-type')` → `this.dataset.type`, and the helper content copy
  → `cloneNode(true)`. Not worth mixing styles while the widget remains; doing it
  piecemeal would make the adapter harder to read, not smaller.
- A missing `window.jQuery` now throws from the installers instead of silently
  disabling drag and drop. The app entry publishes the global before jQuery UI
  evaluates; jsdom shell suites get it from `tests/jquery-setup.js` with no-op
  widgets, while `tests/sortable.test.js` loads the real jQuery UI build. Treat
  the import pair as load-bearing until the adapter is replaced.

## Bundle

`jquery@4.0.0` and `jquery-ui@1.14.2` are devDependencies, but Vite bundles them
into the app entry because `src/app.js` imports them. `vite.config.js` keeps them
out of the shared `vendor` chunk so jQuery UI evaluates after the global is
published. They are ship-weight, not tooling-only.

## Tests

jQuery appears in tests for two different reasons:

- `tests/jquery-setup.js` gives every jsdom suite the global and no-op
  draggable/sortable methods, so rendering the shell does not trip the loud
  dependency check.
- `tests/sortable.test.js` installs `jquery` globally and evaluates the
  `jquery-ui` dist file so the draggable/sortable adapters can be exercised.
- `tests/possible-answers.test.js`, `tests/jumps.test.js`,
  `tests/support/properties-panel.js` and `tests/legacy/**` drive the frozen
  legacy modules, which are jQuery-based by design.

Neither group is port code.

## Removing jQuery — the condition

The only removal path is replacing drag and drop. When that happens, delete
together:

- `src/jquery.js` and the two imports at the top of `src/app.js`;
- `src/ui/sortable.js`'s jQuery wrappers and the `window.jQuery` dependency check;
- the `ui-draggable` / `ui-sortable` class checks;
- both devDependencies.

A partial removal is worse than either end state: the guards make the failure
silent.
