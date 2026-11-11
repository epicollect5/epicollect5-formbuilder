# Performance audit — schema maximum

Date: 2026-11-11
Scope: `formbuilder-ionic/src/**` (Vue port), exercised in the browser through the
comparison dev server with a project built to every documented limit.
Companion to `performance-audit.md` (the 2026-11-07 deferred findings) and to
risk-register entries R-41 (keystroke validation) and R-62 (undo snapshots),
which this audit re-measures at maximum scale.

This is a measurement report, not a regression suite: timings are wall-clock
around a single interaction, on one desktop machine, in the Vite **dev** build.
They are useful for magnitude and for ranking work, not as thresholds.

## Fixture

Built from `PARAMETERS` (`src/config/parameters.js`), at every cap:

| Dimension | Cap | Fixture |
|---|---|---|
| Forms | `MAX_FORMS` 5 | 5 |
| Questions per form | `INPUTS_MAX_ALLOWED` 300 | 300 (1,500 total) |
| Question text | `QUESTION_MAX_LENGTH` 255 | 255 chars each (382,500 chars) |
| Answers per multiple-choice question | `MAX_ANSWERS` 300 | 300 |
| Answers per search question | `MAX_SEARCH_ANSWERS` 1,000 | 1,000, on 5 questions (`SEARCH_INPUTS_MAX` 5) |
| Answer text | `MAX_ANSWER_LENGTH` 250 | 250 chars each (113,375,000 chars) |
| Titles | `TITLES_MAX` 3 | 1 per form |

Totals: **453,500 answers**, `project.json` **127.5 MB** (133,731,437 bytes).
The real `project/project.json` was backed up, replaced for the run and restored
afterwards; the generator and measurement scripts were temporary and are not in
the tree.

## Findings

### F-01 Boot cost is dominated by the undo baseline, not the fetch

| Metric | Value |
|---|---|
| `project.json` fetch | 347 ms for 127.5 MB (dev server, **uncompressed**: encoded = transfer) |
| First question rows painted | 2,338 ms after navigation |
| DOM content loaded | 148 ms |
| Heap after boot | **630 MB** |
| DOM | 2,279 nodes, 300 `.builder__question` |

The parsed project is roughly 240 MB of live objects; the rest is the baseline
undo snapshot taken during boot (`ensureUndoBaseline` → `store(capture())`,
`src/services/undo.js`). Boot therefore already pays the per-state cost
described in F-02, once, before the user has edited anything. **Re-measured
after S-01/S-02:** 526 MB at boot on the 130.1 MB fixture, because the baseline
is now one stored string rather than a parsed clone.

### F-02 Every undo push costs a full clone plus a retained full copy of it

`capture()` deep-cloned the definition and `store()` stringified the clone
**again** for a dedupe key kept for the lifetime of the slot
(`src/services/undo.js`, before S-01). Measured per push (one
`toggleRequired` on a single question):

| | push 1 | push 2 | push 3 |
|---|---|---|---|
| Main-thread block | 1,854 ms | 1,160 ms | 2,186 ms |
| Heap after | 1,050 MB | 1,610 MB | — |
| Heap growth | +386 MB | +392 MB | — |

Two independent costs per state — a parsed clone and a ~127 MB key string — and
the `keys` array is only ever compared with its own last element, so nine of the
ten keys (or four of five) exist only to be shifted out later.

`MAX_UNDO_STATES` was lowered from 10 to 5 during this audit, so the history
ceiling goes from ~3.9 GB to ~1.95 GB at maximum scale. That is survivable on a
desktop and still wrong: a browser tab dies around 4 GB, and the editor should
not approach that from five ordinary edits.The defect is the per-state cost, not the count.

**Re-measured 2026-11-11, after S-01/S-02** (fixture rebuilt at 130.1 MB; same
1,500 questions and 453,500 answers): a push costs **+132–133 MB** and 1.2–2.2 s,
and only **3 states** are retained before `MAX_UNDO_BYTES` evicts the oldest —
the heap plateaus near 1.0 GB and drops by 133 MB on each eviction, instead of
climbing ~390 MB per edit. Push *time* did not improve in this run (1.15–2.19 s
against 1.16–2.19 s before): one `JSON.stringify` over the reactive proxy graph
still dominated, which was the next lever (F-10.4). **S-09/O-10 closed it**:
serializing `toRaw(project_definition)` took pushes to **71–123 ms** with the
same +121–131 MB per state and the same 3 retained states. S-01 was a memory
change; S-09 was the latency one.

### F-03 A typing burst ends in a multi-second freeze

Twenty keystrokes measure **4–18 ms each** with the heap flat, then the 500 ms
throttled push lands: a requested 900 ms wait took **3,663 ms** — roughly 2.7 s
of blocked main thread — and grew the heap by **391 MB**.

So per-keystroke typing is fine; the pause after typing is the stall. This
matches R-41's mitigation (validation off the keystroke path) and shows the
remaining typing cost is entirely F-02's snapshot.

### F-04 Whole-project validity is recomputed behind three computeds

`rowValidity` (`src/vue/stores/root-store.js:507-516`) validates one 300-question
form in **162 ms**. It is the same code path `areFormInputsValid` uses, so a
full-project pass is about 5 x 162 ms ≈ **0.8 s**. Three computeds can request
that pass and any project mutation invalidates all of them:

- `saveEnabled` and `saveTitle` each call `areAllInputsValid` over the whole
  project (`src/vue/stores/root-store.js:451-458`), read on every render by
  `src/vue/App.vue:87-88`;
- `formTabs` calls `areFormInputsValid` per form
  (`src/vue/stores/root-store.js:463-470`), read by
  `src/vue/components/FormTabsStrip.vue:52`;
- `rowValidity` itself had **no consumer** anywhere in the port — 162 ms of dead
  computed, deleted in S-04.

Caveat: every one of these checks short-circuits at the first invalid form or
input, so the measured cost depends on where the first error is. 162 ms is the
worst case (everything valid) and the one that matters for a project being typed
into normally. **Closed by S-03:** the three computeds now share one per-form
validity pass (`src/vue/stores/root-store.js`), so a revision costs one pass, not
three.

### F-05 Row validation is O(answers) per row, so a render is O(n²)

`src/vue/components/QuestionRow.vue:60-62` gives every row a `valid` computed
that calls `isInputValid(props.input, props.inputs)`. For a multiple-choice row
that walks all 300 answers and builds a `Set` of refs, so a 300-row render does
**90,000 answer checks**; `getJumpAvailableDestinations` additionally allocates
an array of all following inputs on every call, which makes the allocation
profile O(n²) per render.

Consequence: switching forms costs **545–586 ms** (first call is 0.3 ms when the
form is already active). Selecting a question costs **39–76 ms** (median ~54 ms).

S-07 removed the proxy-trap part of the read cost: a warm read pass over a
300 x 300 form measures 49–68 ms with answers proxied and **45–49 ms** with them
raw, in Node through the real validation helpers (no forced GC, no DOM). The
browser-level F-05 re-measure and the jump-destination allocation shape remain
open.

### F-06 No DOM leak across form switches

DOM nodes: 2,281 before, 2,281 after ten switches, 2,281 after twenty; rows stay
at 300. Switching forms is not leaking elements.

### F-07 Heap grows ~32 MB per form switch with a flat DOM (unconfirmed)

| Interval | Heap |
|---|---|
| After 10 switches | 1,621 → 1,943 MB (+322 MB) |
| Next 10 switches | 1,209 → 1,528 MB (+319 MB) |

Flat DOM with a steady per-switch increase is the shape of a leak, but it was
**not confirmed**: `agent-browser` exposes no forced GC, so this may be
uncollected garbage. Candidates, in order: per-target reactive proxy creation for
newly touched subtrees (90,000 answers per newly visited form), the
`possible_answers_pages` map, and Ionic component instances. A heap-snapshot diff
is the way to settle it (A-02). S-07 removed the first candidate: answer objects
are no longer proxified at all, so the switch growth, if it survives, comes from
the other two.

### F-08 Answer paging is healthy; the initial-answer select is not

A 1,000-answer search question opens in **51 ms**, renders 100 rows, and pages in
**49 ms** across 10 pages — `ANSWERS_PER_PAGE` does its job.

The advanced tab's initial-answer `ion-select` does not: it renders
`option in defaultChoiceOptions` (`src/vue/components/AdvancedFields.vue:142-144`
over `src/vue/stores/possible-answers-store.js:372-380`), i.e. **1,001
`ion-select-option` elements** for one question — 82 ms and +1,025 DOM nodes. **Closed by S-05:** the select now
lists one `ANSWERS_PER_PAGE` page plus the current default, 101 nodes and 28 ms
at the same fixture, paging in 41 ms.

### F-09 The save path at maximum scale is unmeasured

`performSave()` rejected the fixture in 17 ms (`Project error! The project is
invalid`) because earlier edits in the session had left form 0 invalid, and the
guard short-circuits on the first bad input. So `cleanProject` (a full deep
copy), `JSON.stringify`, gzip/base64 and the 127 MB POST in
`src/services/save.js` were never exercised at this size. By inspection they are
three more whole-project passes; they need their own measurement (A-01) before
anyone claims the editor is safe at the cap.

### F-10 Pinia/Vue shape issues behind the numbers

1. Whole-project computeds with no coarse memoisation: three of them traverse all
   453,500 answers and every edit invalidates each.
2. The same input's validity is recomputed independently up to six times per
   interaction (`QuestionRow.valid`, `rowValidity`, `formTabs`, `saveTitle`,
   `saveEnabled`, plus `propertyTabErrors` / `basicErrorMessage` for the
   selection).
3. The most expensive computed (`rowValidity`) is the only one with no consumer.
4. `session` is a `reactive({ project_definition })` singleton
   (`src/services/session.js`), so every hot read goes through proxies over
   453,500 objects — `getCurrentInput()` is a `.find()` over 300 rows, and part
   of F-05's 162 ms is proxy-trap overhead rather than validation logic.
5. Undo keeps full-document snapshots in module state and restores by cloning
   again (`undo()` measures 125 ms), so the expensive representation is also the
   canonical one.

## Optimisation tracker

Everything done, dismissed or still open, so the same ground is not re-covered.
"Measured" means this audit or the 2026-11-07 pass timed it; "accounted" means
the cost follows from the data structure and was not timed separately.

### Done

| Ref | Optimisation | Effect | Where |
|---|---|---|---|
| O-01 | Dropdown options built on first open | 1,000 option nodes were created when a card rendered, whether or not the dropdown was opened | dropdown renderer, 2026-11-07 |
| O-02 | One delegated click listener per list | one listener per option, for every list | dropdown renderer, 2026-11-07 |
| O-03 | Search field above `SEARCH_THRESHOLD = 50` | long lists reachable without scrolling; no cliff found at that length | `src/ui/dropdown.js:7`, 2026-11-07 |
| O-04 | Jump rows paged at `JUMPS_PER_PAGE = 20` | every jump row was built at once | `src/vue/stores/jumps-store.js:46`, `src/ui/jumps.js:22`, 2026-11-07 |
| O-05 | Answers paged at `ANSWERS_PER_PAGE = 100` | a 1,000-answer question renders 100 rows and pages in 49 ms (F-08) | `src/models/possible-answers.js:65-72` |
| O-06 | Typing coalesced by `UNDO_THROTTLE_MS = 500` | a burst of keystrokes is one undo step; keystrokes measure 4–18 ms (F-03) | `src/services/undo.js` |
| O-07 | `MAX_UNDO_STATES` 10 → 5 | history ceiling ~3.9 GB → ~1.95 GB at the fixture; a stop-gap, superseded by O-08 | `src/config/parameters.js:28`, 2026-11-11 |
| O-08 | Snapshots stored as serialized strings, dedupe by text + form index, `MAX_UNDO_BYTES` ceiling (S-01/S-02) | one `JSON.stringify` per push and one `JSON.parse` per undo, with no clone and no retained key; measured **+132–133 MB** per state and 3 retained states at the fixture, against ~390 MB before (A-05) | `src/services/undo.js`, 2026-11-11, uncommitted |
| O-09 | `flex-shrink: 0` on the dropdown option row | layout: rows no longer squeezed from 35.5 px to 16 px inside a 260 px list | dropdown option styles, 2026-11-07 |
| O-10 | `capture()` serializes `toRaw(project_definition)` instead of the reactive proxy (S-09) | pushes went from 1.15–2.19 s to **71–123 ms** on the 130.1 MB fixture, with the same +121–131 MB per state, the same 3 retained states and the same bytes | `src/services/undo.js`, 2026-11-11, uncommitted |
| O-11 | Deleted the unused `rowValidity` computed and its `isInputValid` import (S-04) | nothing consumed it; 162 ms of dead validation per read is no longer reachable | `src/vue/stores/root-store.js`, 2026-11-11, uncommitted |
| O-12 | The initial-answer select pages `ANSWERS_PER_PAGE` at a time, follows the current default and keeps it listed (S-05) | advanced tab on a 1,000-answer question: 1,001 → **101** `ion-select-option` nodes and 82 → **28 ms**; page change 41 ms over 10 pages | `src/vue/stores/possible-answers-store.js`, `src/vue/components/AdvancedFields.vue`, 2026-11-11, uncommitted |
| O-13 | One shared per-form validity computed feeds `saveEnabled`, `saveTitle` and `formTabs` (S-03) | three whole-project passes per revision became one (F-04); the three gates agree by construction; asserted by call count through a wrapped `areFormInputsValid` | `src/vue/stores/root-store.js`, `tests/vue-form-validity-store.test.js`, 2026-11-11, uncommitted |
| O-14 | Answer objects never join the reactive graph: `createAnswer` marks raw, ingestion marks raw (`setProject` covers load and undo restore, form import and duplication mark their parsed answers), rename replaces the answer wholesale (S-07) | warm validation read pass over a 300 x 300 form: 49–68 ms proxied → **45–49 ms** raw in Node; no per-answer proxies created or retained (F-07's first candidate); serialized definition byte-identical (the `__v_skip` flag is non-enumerable); browser F-05/F-07 re-measure still needs the A-07 harness | `src/models/possible-answers.js`, `src/services/possible-answers.js`, `src/services/session.js`, `src/services/form-import.js`, `src/services/question-actions.js`, 2026-11-11, uncommitted |

O-01 to O-04, O-06 and O-09 come from the 2026-11-07 pass; their original
reasoning and measurements are in `performance-audit.md`.

### Dismissed

| Ref | Idea | Why not |
|---|---|---|
| P-01 | Derived snapshot diffs | needs both states and then a 453,500-node comparison, so it is slower than the clone it replaces; see below |
| P-02 | Recorded inverse patches | needs a mutation funnel the port lacks (56 assignment sites across 18 files); one missed site corrupts undo silently; index-based patches break on answer reorder and form deletion; a command layer is the prerequisite |
| P-03 | Snapshots in `localStorage` | ~5 MB origin quota against a 127.5 MB state; synchronous main-thread writes; the port shares the origin with the legacy app and the project routes |
| P-04 | Snapshots in `IndexedDB` | makes `undo()` asynchronous for every caller and is disk-bound at 127 MB per edit |
| P-05 | Hashed dedupe key (the S-01 variant) | hashing 133 M characters costs an estimated 200–300 ms per push, against an O(1) length check or a single memcmp for the exact comparison, and saves no memory because the string already is the state |
| P-06 | `structuredClone` instead of JSON for the clone | measured 275 ms vs 180 ms at 25 MB (2026-11-07, R-62) |
| P-07 | `ion-infinite-scroll` for dropdown options | expects an `IonContent` scroll host, and keeps every node it has rendered, so it does not bound the list |
| P-08 | Lazy property-tab mounting | no measured cost at realistic sizes; deferred tabs re-open the insert-before-bind ordering Ionic requires (R-02) |
| P-09 | Page-only jump rendering, or virtualising the 1,000-jump case | the pager already bounds to 20 rows; ~60–65 ms per page at 1,000 jumps, a shape the builder does not see |
| P-10 | Virtualising the questions list (S-08) | deferred, not dismissed: 545–586 ms per switch is a tolerance problem and the row cap is 300; revisit once S-01..S-05 land and A-04 shows real projects near the cap |
| P-11 | gzip the snapshots, or "minify" the JSON | already minified: `JSON.stringify` emits no whitespace. Deflating 130.1 MB costs 501 ms and still needs the same 1.2 s stringify per push, so it makes the slow path slower. Dedupe would need a hash or one retained plain state, `CompressionStream` is async (the push is synchronous at every call site), and undo adds gunzip (91 ms) + parse (243 ms). Revisit only if history depth grows well past 5 or projects far exceed the caps |

P-11 numbers: the fixture compresses 130.1 MB → 3.0 MB (43.6x), which is
inflated by 100 repeated answer texts; a realistic sample of unique 250-char
natural-language answers compresses 9.6 MB → 1.4 MB (7.1x). gzip 501 ms,
gunzip 91 ms and `JSON.parse` 243 ms, measured in Node on the same machine.

### Open

S-08 in the table below, and A-01 to A-04, A-06 to A-08 in "To be assessed";
A-05, S-03, S-04, S-05, S-07 and S-09 closed on 2026-11-11, and S-01, S-02 and
S-06 with them (O-08). Nothing else is
known to be pending.

## Recommended steps

Ordered by value per unit of effort. Sizes are rough: **S** ≈ under a day,
**M** ≈ a day or two, **L** ≈ multi-day / architectural.

| ID | Step | Why | Size | Acceptance |
|---|---|---|---|---|
| S-08 | Virtualise the questions list | Not justified at the 300-row cap (F-05: 545–586 ms is a tolerance problem, not a crash) | L | only if A-04 shows real projects near the cap |

Do **not** start S-08 before S-01..S-05: the snapshot model is what turns "slow"
into "crashes at the documented limits", and virtualisation does not touch it.

**S-01, S-02 and S-06 landed on 2026-11-11** (`src/services/undo.js`): a state is the
serialized definition, `undo` re-parses it, and the dedupe compares the
serialized definition (plus the recorded form index) directly instead of
keeping a key per state. No hash is
kept: hashing 133 M characters costs far more than the comparison it would
replace, which is O(1) when the lengths differ and a single memcmp when they
match, and exact comparison cannot collide (recorded as P-05). History is
trimmed to `MAX_UNDO_BYTES` (1 GiB, accounted at two bytes per character) as
well as to `MAX_UNDO_STATES`; at this fixture that keeps 3 states, not
5 x 390 MB. A-05 re-measured it: +132 MB per state and 3 retained states.

**S-03 landed on 2026-11-11** (`src/vue/stores/root-store.js`, uncommitted): a
`formValidity` computed maps each form to `areFormInputsValid(form)` in one
pass and an internal `projectValid` aggregates it; `saveEnabled`, `saveTitle`
and `formTabs` read those two instead of each re-running a whole-project pass.
One pass per revision feeds all three consumers, and they agree by
construction rather than by re-running — Vue's computed memoisation is the
revision counter, with no mutation-site to forget (the risk that made the
explicit-counter variant resemble P-02). `tests/vue-form-validity-store.test.js`
asserts the sharing by counting calls through a wrapped `areFormInputsValid`.

**S-07 landed on 2026-11-11** (uncommitted): answer objects never join the
reactive graph. `createAnswer` marks answers raw; every point where parsed
answers enter the session marks them (`setProject`, which covers the project
load and every undo restore, form import, question duplication); and
`renamePossibleAnswer` replaces the answer wholesale instead of writing a
property, because a raw object's property write would bypass reactivity — the
array mutation is what the panel observes. Only `renamePossibleAnswer` mutated
an answer object in place, so the funnel is complete by inspection. The
serialized definition is unchanged: the `__v_skip` flag markRaw defines is
non-enumerable. Node measurement of the isolated read path (real validation
helpers over a 300 x 300 form): warm passes 49–68 ms with answers proxied,
45–49 ms raw; the first pass showed no proxy-creation cliff in isolation. The
browser-level F-05/F-07 re-measure still waits on A-07's repeatable harness,
and F-05's O(n²) jump-destination allocations are untouched by this step.

### Why not store snapshots as diffs (P-01, P-02)

Considered and deferred, for the record:

- A **derived** diff needs both states and then a 453,500-node comparison, so it
  is slower than the clone it replaces and saves little;
- a **recorded** (inverse-patch) diff needs a mutation funnel the port does not
  have: 56 direct field assignments across 18 files in `src/`, plus array
  mutations in the `properties` and `jumps` stores, all of which would have to
  emit `{ path, before }`. A missed site corrupts undo silently;
- index-based patches break under answer reorder and form deletion, so patches
  would have to be ref-keyed;
- the prerequisite is a command layer (`applyChange(path, value)`), which is
  worth doing when deep history or collaborative undo is actually required —
  S-01 delivers most of the memory win for a fraction of that risk.

Storage was also considered: `localStorage` cannot hold this (≈5 MB origin
quota against a 127.5 MB snapshot, synchronous writes on the main thread, shared
across the port / legacy / project routes on one origin). `IndexedDB` would make
undo asynchronous and is disk-bound at these sizes.

## To be assessed

| ID | Question | Suggested method |
|---|---|---|
| A-01 | What does saving cost at the cap? (`cleanProject`, `JSON.stringify`, gzip+base64, 127 MB POST) | Benchmark against a *valid* max fixture; record peak heap and total time |
| A-02 | Is F-07 a real leak or uncollected garbage? | Heap snapshot before/after 20 switches, compare retained sizes by constructor (proxies, `IonInput`, answer objects) |
| A-03 | What is the mobile profile? All numbers here are desktop Chromium | Repeat F-01, F-03, F-05 on a mid-range Android device via remote debugging |
| A-04 | Where is the practical size cliff? | Rerun the fixture at ~10, 25 and 50 MB and derive a per-MB model for heap and snapshot cost |
| A-05 | How many states survive the byte ceiling, and where does the tab die? | **Measured 2026-11-11** on the rebuilt fixture (130.1 MB, 6 pushes): 3 states retained, 2 undo steps, heap plateaued at ~1.0 GB and dropped by 133 MB at each eviction, no OOM. Undo 73 ms and 185 ms; boot 526 MB. Taken before S-09; post-S-09 pushes are 71–123 ms (O-10). |
| A-06 | How much does first-error short-circuiting hide? | Measure `areAllInputsValid` with the first input invalid vs all valid; record both |
| A-07 | Do the numbers regress? | Keep a small repeatable harness (generator + eval script) outside the tracked tree, or a size-bounded fixture under `tests/` |
| A-08 | Does the legacy app behave differently at the cap? | Same fixture against `/epicollect5-formbuilder/public/` for a parity baseline |

## Method notes and limits

- Dev build (unminified), local uncompressed transfer, one machine, one run per
  measurement.
- The fixture was rebuilt for A-05 from the live project template, so it is
  130.1 MB rather than 127.5 MB: same 1,500 questions and 453,500 answers,
  slightly larger because the template carries fields the first generator
  omitted. Compare per-state costs, not absolute file sizes.
- `performance.memory.usedJSHeapSize` is quantised and no GC was forced, so heap
  deltas include garbage awaiting collection; treat single readings as
  indicative and repeated deltas as signal.
- Measured through the component API (`useRootStore()` actions) rather than
  real pointer input, so pointer handling and Ionic's own event cost are not
  included in F-03/F-05.
- The fixture was mutated during the run (required toggles, question edits),
  which is why F-09 could not complete: validation short-circuits and rejected
  the project before serialization.
