# Known legacy defects — do not reproduce in `formbuilder-vue/`

The legacy formbuilder (`js/`) is being rewritten in Vue (`formbuilder-vue/`). The
Mocha suite in `js/test/` characterises parts of the legacy behaviour so the
rewrite has a specification to work from.

**That makes the tests a porting contract.** A test that asserts a buggy value as
the *expected* result is a mechanism for faithfully porting the bug. The rule the
legacy suite follows is therefore:

> **No test asserts a known defect as expected behaviour.** The reachable,
> non-defective paths are asserted; the defect itself is listed below and left
> untested.

A green legacy suite is **not** evidence that these are fixed. They are still
there in `js/`.

This document is the artefact the Vue work reads. Each entry gives the file, the
mechanism, and what the Vue implementation must do instead.

## How the entries are tagged

The three tags carry different obligations, so they are not interchangeable:

| Tag | Meaning | Obligation in `formbuilder-vue/` |
|---|---|---|
| **[not portable]** | Dead code, or a path that never runs. | Nothing — the code will not exist in Vue. Listed so nobody "fixes" it in `js/`. |
| **[re-implemented]** | A path Vue writes from scratch anyway. | Any new guard or state change must be justified by **Vue's own** failure mode (see the Refactoring Rules in `AGENTS.md`), not inherited from legacy. |
| **[live]** | Behaviour a faithful port would copy verbatim. | Must **not** be reproduced. This is the list that matters. |

---

## 1. [live] The jump validation test never runs

**`js/test/isJumpValid.test.js`**, **`js/test.js`**

The file exists and its cases pass when run directly:

```bash
VERBOSE=1 npx mocha --require ./js/test/setup-node.js js/test/isJumpValid.test.js
```

But `js/test.js` does not require it, and `js/test/mocha.opts` points mocha at
`js/test.js`. `npm test` therefore never executes it. The rule it covers,
`actions/validation.isJumpValid`, still runs in the app and is exercised
indirectly by save/import validation.

**In Vue:** cover jump validity directly in Vitest. Do not treat the legacy
coverage number as proof that jump validation is specified.

---

## 2. [live] The input total ignores groups nested inside branches

**`js/app_modules/helpers/utils.js` — `getInputsTotal`**

```js
if (input.type === consts.GROUP_TYPE) {
    total += input.group.length;
}
if (input.type === consts.BRANCH_TYPE) {
    total += input.branch.length;

    //todo count nested group inputs!
    //todo
}
```

Top-level groups are counted, and branch inputs are counted, but a group nested
inside a branch is not. `import_form_validation` uses this total against
`INPUTS_MAX_ALLOWED` (300), so an imported form can exceed the limit by the size
of its nested groups.

**In Vue:** count the whole input tree recursively; a branch's nested groups are
inputs too.

---

## 3. [live] The project loader assumes every error body is base64-gzip

**`js/app_modules/loaders/load-project.js`**

```js
error: function (error) {
    console.log(error);
    formbuilder.project_definition = JSON.parse(
        pako.ungzip(window.atob(error.responseText), { 'to': 'string' })
    );
}
```

The error callback assumes the server sent a base64-gzipped project definition.
A 404, a login redirect, an HTML error page or an empty body makes `atob` or
`ungzip` throw inside the error handler, so `project_definition` is never
assigned. `config/init.js` then reads
`formbuilder.project_definition.data.project.name` on an empty object and throws
a `TypeError` before the loader is hidden — the app stops on the loading screen
with no message and no error path.

**In Vue:** treat a non-2xx response as an error. Do not parse it as project
data, and surface a retryable failure state.

---

## 4. [re-implemented] The `ngrok` host check is numeric, not a comparison

**`js/app_modules/helpers/utils.js` — `setProjectURL`**

```js
if (parts[0].indexOf('localhost') !== -1 || parts[0].indexOf('ngrok')) {
```

`indexOf` returns `-1` when there is no match, and `-1` is truthy. The second
operand is therefore true for almost every host, and the `else` branch is
effectively dead. In practice both branches converge on `buildLaravelPath()` for
a normal server host, so the visible behaviour is unchanged; the latent bug is
that an `ngrok` host whose path contains `epicollect5-formbuilder` is sent down
the Laravel path instead of the standalone path.

**In Vue:** base the environment decision on explicit parsed values (hostname,
path segments, a build flag), not on truthiness of `indexOf`.

---

## 5. [not portable] `JSONPolyfill.parse` uses `eval`

**`js/app_modules/helpers/utils.js`**

```js
JSONPolyfill: {
    parse: function (sJSON) {
        return eval('(' + sJSON + ')');
    },
```

`config/init.js` installs it as `window.CircularJSON` when `utils.isSafari` is
true, so on **every** Safari browser the polyfill replaces the vendored
`CircularJSON` used by export, print-as-PDF and the input duplicator. The
comment says the trigger is a Safari 9 `JSON.stringify` bug, but the condition
matches all Safari versions. It is not a parse path to port.

**In Vue:** use `JSON.parse`; never `eval` a server response.
