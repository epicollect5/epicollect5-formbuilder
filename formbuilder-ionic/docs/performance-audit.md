# Performance audit — deferred findings

Date: 2026-11-07
Scope: `formbuilder-ionic/src/**`, exercised through the comparison dev server with
synthetic projects (1,000 possible answers, 1,000 jumps, 300 and 1,000-option
dropdowns).

The optimisation pass fixed only costs that could be observed. This file records
the rest: measurements that did not justify a change, candidates that were
declined, and the conditions that would reopen them. It is not a benchmark
report — timings are wall-clock around a single interaction on a desktop
browser, useful for magnitude, not for regression thresholds.

Keystroke validation and undo snapshot costs are measured separately and tracked
in `docs/risks.md` (R-41 and R-62).

## What shipped

| Change | Cost it removed |
|---|---|
| Dropdown options built on first open | 1,000 option nodes were created when the question card rendered, whether or not the dropdown was opened |
| One delegated click listener per list | One listener per option, for every list |
| Search field above `SEARCH_THRESHOLD = 50` | Long lists had no way to reach a label except scrolling |
| Jump rows paged at `JUMPS_PER_PAGE = 20` | Every jump row was built at once |
| `flex-shrink: 0` on `.dropdown__option` | Rows squeezed from 35.5 px to 16 px inside a 260 px scroll list, clipping the labels |

## Declined candidates

### D-01 Ionic infinite scroll for dropdown options

- **Idea:** replace the plain scroll list with `ion-infinite-scroll`.
- **Declined:** `ion-infinite-scroll` expects an `IonContent` scroll host; the
  dropdown list is a plain scroll container inside a popover. It also keeps every
  node it has rendered, so scrolling to the end still builds the whole list.
- **Measurement:** building all 1,000 options measured ~2.7 ms in the audit
  harness, and 1,000 is the supported cap (`MAX_SEARCH_ANSWERS`).
- **Reopen if:** the answer cap rises, or options gain per-row work such as icons
  or metadata that makes construction expensive.

### D-02 Lazy property-tab mounting

- **Idea:** mount only the active tab and build Advanced / Jumps on first
  activation.
- **Declined:** no measured cost at realistic sizes. Jump lists are realistically
  5–10 rows, which is one page under the 20-row pager, and the tab shells are
  fixed card markup rather than a function of project size.
- **Cost of doing it:** deferred tabs need re-binding on activation, and the
  current render inserts the card before binding to avoid Ionic's inert
  custom-element trap (R-02). Splitting the render adds a second place to get
  that order wrong.
- **Reopen if:** a panel's content starts scaling with project size, or first
  open feels slow on a mid-range device.

### D-03 Page-only jump rendering

- **Idea:** keep the pager, but render only the rows near the viewport.
- **Declined:** the pager already bounds jump rows to 20. Virtualising inside 20
  rows adds scroll bookkeeping with no measurable win.
- **Reopen if:** `JUMPS_PER_PAGE` grows or real projects start exceeding a page
  of jumps.

### D-04 Virtualising the 1,000-jump case

- **Measurement:** ~60–65 ms per page transition at 1,000 jumps (47 transitions
  in 4.2 s including 25 ms waits between steps).
- **Assessment:** one frame budget over, on a project shape the builder does not
  realistically see. Not worth a second rendering model.
- **Reopen if:** a real project with hundreds of jumps appears.

## Residual observations

- The 35.5 px dropdown row depends on the current font, padding and icon metrics.
  `tests/views.test.js` guards the `flex-shrink: 0` contract, not the height, so a
  theme change can reintroduce clipping without failing a test.
- The search threshold of 50 is a product decision. The audit found no
  performance cliff at that length; lowering it adds UI without removing work.
- All measurements are desktop Chromium. The target is also a mid-range mobile
  device, where Ionic custom-element overhead was not measured.
- Nested branch/group rendering was not part of the pass and remains unmeasured.
- Drag and drop has no automated coverage (R-03); the optimisation pass did not
  change that.
