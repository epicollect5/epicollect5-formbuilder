# Vue tree architecture (`src/vue/**`)

Reference for the Vue application inside the Ionic prototype. **The Vue tree
is the destination app**: the legacy formbuilder and the vanilla render layer
(`src/index.html` → `app.js` → `ui/shell.js` → `views/**`) are reference
material during the migration and are deleted once `formbuilder-vue/` reaches
parity (repo-wide decision in `docs/ARCHITECTURE.md`, part 3; see also
`docs/ROADMAP.md`). New UI work therefore lands as Vue components here, never
as additions to the vanilla render layer.

This page records the working rules and the shared components extracted from
the factory layer, with the reasoning behind the non-obvious ones.

## Layout

```
src/vue/
  App.vue            the ion-app shell; mounts <Modal> once at the root
  main.js            boot: IonicVue plugin, asset paths, loader removal
  components/        UI only (see the inventory below)
  stores/            Pinia stores: session state + actions
  theme/components/  per-component SCSS, mirroring components/ 1:1
```

`services/**` and `models/**` stay outside `src/vue` and are shared with the
vanilla render layer on purpose (validation, jumps, undo, save, import,
limits, the project-definition contract). Stores call them; components call
stores.

## Store conventions

- `defineStore(id, () => { ... })` returning `{ state, ...methods,
  ...computedScope }`. `state` is one `reactive()` object; plain `ref()` only
  for template refs inside components.
- Composition over inheritance: `forms-store`, `possible-answers-store`,
  `properties-store`, `jumps-store` all grab `useRootStore()` and route every
  mutation through `builder.recordChange()` (the composed-store pattern), so
  the undo push points and the save/unsaved gates stay in one place.
- Stores never build DOM. Where a flow needs UI (modals, overlays), the store
  drives a component through state (see the modal store below).

## Component inventory

Shared, reusable components — the Vue replacements of the `ui/` factories:

| Component | Replaces | Contract |
| --- | --- | --- |
| `Dropdown.vue` | `ui/dropdown.js` `createDropdown` | props `options` (`{value, label, display_only?}`), `value`, `disabled`, `placeholder`, `ariaLabel`; emits `change` with `{ value }` |
| `ContextMenu.vue` | `ui/dropdown.js` `createMenu` | props `items` (`{label, action?, disabled?}` / `{divider: true}`), `ariaLabel`, `title`, `icon`, `triggerClass`; items carry their own `action` closures |
| `Modal.vue` | `ui/modal.js` `openModal` | mounted once in `App.vue`; reads `stores/modal-store.js` |
| `BuilderNotice.vue` | hand-written `.builder__notice` markup | props `variant` (`info`/`warning`/`danger`), `tag` (`div`/`p`); hook classes and `data-role` flow through attribute fallthrough |
| `ReadmeEditor.vue` | `ui/readme-editor.js` `createReadmeEditor` | owns the toolbar markup and the Tiptap lifecycle; shares only the pure helpers (`ReadmeLength`, `sanitizeEditorHTML`) with the vanilla factory |

The per-surface components (`QuestionsList`, `QuestionRow`, `PropertiesPanel`,
`AdvancedFields`, `PossibleAnswers`, `JumpsPanel`, `JumpRow`,
`FormTabsStrip`) compose the shared ones. The three modal bodies
(`FormNameModalBody`, `DeleteQuestionModalBody`, `CsvImportModalBody`) render
inside `Modal.vue` per the modal store's `kind`.

### Dropdown / ContextMenu behaviour

- The popover is inline `ion-popover` driven by `:is-open`; the trigger
  element is addressed by a module-counter id (the factory's `dropdown_id`
  pattern). `keep-contents-mounted` keeps the (empty) popover shell in the
  DOM; the option list itself renders from first open (`state.everOpened`)
  and clears on dismiss — the vanilla `ensure_options`/`reset_options`
  lifecycle, so a closed jump Answer dropdown costs no option DOM.
- `display_only` options label the current selection (a stored answer that no
  longer exists) but are never offered as choices.
- **`onBeforeUnmount` must dismiss a presented popover.** The inline
  `@ionic/vue` overlay wrapper has no unmount dismissal, and Ionic reparents
  a presented popover to the app root — a host that unmounts while open (a
  jump row's `signature` key changes on every edit) would otherwise orphan
  the popover on screen. Both components dismiss in `onBeforeUnmount` when
  the element reports `presented`. The JumpRow remount itself is a
  rebuild-on-mutation carry-over the `formbuilder-vue` port should
  reconsider dropping (see `docs/ROADMAP.md`, Jumps → Remaining).

### Modal store (`stores/modal-store.js`)

`state = { open, title, class_name, kind, buttons }`; `openModal(config)`
replaces any open modal (one at a time, like the vanilla host), `closeModal()`
resolves. Footer buttons carry `action` closures built by the owning store and
an optional `disabled` **predicate function**, so live gates (the CSV Import
button waits for a selected column) stay reactive. Bodies are components
selected by `kind`; business logic stays in the owning store.

## DOM access rules

1. **Everything Vue renders is reached by template ref.** No
   `document.querySelector` in components. Lists pass their own element into
   store APIs (`store.beginDrag(resolveElement(listRef))`) — the store takes
   elements, not selector strings.
2. **Cross-component elements use provide/inject.** `PropertiesPanel` owns
   the `.builder__properties-body` scroller and `provide`s it as
   `propertiesScroller`; `PossibleAnswers` `inject`s it for its pager scroll
   anchor. The owning class name appears in exactly one file.
3. **Selectors are allowed only for nodes Vue does not own.** Currently that
   is the SortableJS fallback drag machinery: the `.sortable-fallback` clone
   appended to `<body>` (clamped in `clampGhost`, removed in `endDrag`) and
   the `is-sortable-dragging` body class. No template ref can address those.
4. **Hidden file inputs live in one service.** `services/file-picker.js`
   (`pickTextFile`) owns the input creation, change wiring and FileReader
   read; callers own validation messages, overlay timing (`on_validated`
   runs at the exact vanilla `showLoading()` point) and the parsed
   continuation.

## Drag stack

`vue-draggable-plus` is a binding, not an engine: the drag behaviour is
SortableJS underneath (`sortablejs` peer dependency). All three drag surfaces
(tools, questions, answers) run with `forceFallback` + `fallbackOnBody`, so
SortableJS simulates the drag with a clone it appends to `<body>` tagged
`.sortable-fallback` (its `fallbackClass` default). That is why:

- the ghost is clamped to the source list's box on `pointermove`
  (SortableJS has no containment option) — `root-store.js` `beginDrag`
  receives the list element and holds the box;
- `endDrag` removes leftover clones — Vue does not own those nodes;
- the theme restyles the ghost by the `.sortable-fallback` class and drives
  the held cursor with the body class.

Without `forceFallback` the browser's native drag would remove the need for
that glue, at the cost of the ghost styling, containment and cursor control
the fallback mode provides.

## Overlay and async timing notes

- **Every `ion-*` tag a Vue component renders must resolve to its wrapper.**
  `IonicVue.install` registers nothing; `main.js` boots the app with the
  `ION_COMPONENTS` list (`IonApp` … `IonToolbar`, plus `IonPopover` and
  `IonModal` for the shared overlays). A new ion-* tag that is missing there
  renders as a bare custom element — the Vue props/event bridge is gone, and
  the console warns `Failed to resolve component`. When introducing one, add
  it to the boot list and to the test `mountOptions`.
- `ion-popover` / `ion-modal` present from Vue with `:is-open` bindings;
  jsdom never completes the presentation animation, so component tests assert
  content through the open action (click the trigger, `nextTick`, then the
  mounted list) rather than presented state. `IonModal`/`IonPopover` must be
  registered in the test `mountOptions`.
- The wait overlay (`ui/loading.js`) and toasts still come from
  `services/notifications.js`, shared with the vanilla layer. They convert to
  components/stores when the vanilla layer is deleted; converting earlier
  would fork the implementation.
- `ui/print.js` (paper preview) and `ui/download.js` are shared
  services for the same reason.

## Testing conventions

- Vitest + `@vue/test-utils` in `tests/vue-components.test.js` and the
  `tests/vue-*.test.js` store suites. `mountOptions` registers the Ionic
  wrappers explicitly (the plugin registration is app-boot only); surfaces
  that need real hydration attach to the document.
- Behaviour parity with the vanilla render layer is the gate: the same
  service/model assertions run against both trees, and the legacy Mocha suite
  stays green throughout.
