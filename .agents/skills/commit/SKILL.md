---
name: commit
description: Create Conventional Commits from changes, splitting by type and scope
---

Analyze all changes and create one or more Conventional Commits, grouped by type and scope. Execute the commits yourself; never leave the work as a proposal.

Steps:

1. Inspect: run `git status --short`, `git diff --cached --name-only`, and `git diff --name-only`. If nothing is staged, stage all tracked modifications with `git add -u` (untracked files stay untouched and are reported at the end).
2. Classify: read the diff of every changed file (`git diff --cached` or `git diff`) to determine its type (feat, fix, refactor, perf, docs, test, build, ci, chore, style, revert) and scope. Map directories to scopes: `js/app_modules/actions/**` -> actions, `js/app_modules/config/**` -> config, `js/app_modules/factory/**` -> factory, `js/app_modules/helpers/**` -> helpers, `js/app_modules/inputs/**` -> inputs, `js/app_modules/loaders/**` -> loaders, `js/app_modules/template/**` -> template, `js/app_modules/ui-handlers/**` -> ui-handlers, `js/test/**` -> test, `public/views/**` -> views, `css/sass/**` -> theme, `gulpfile.js`, `package.json`, `package-lock.json`, `public/js/**` and `public/css/**` -> build, `formbuilder-vue/src/components/**` -> vue-components, `formbuilder-vue/src/pages/**` -> pages, `formbuilder-vue/src/stores/**` -> stores, `formbuilder-vue/src/services/**` -> services, `formbuilder-vue/src/models/**` -> models, `formbuilder-vue/src/use/**` -> use, `formbuilder-vue/src/theme/**` -> theme, `formbuilder-vue/src/tests/**` -> test, `docs/**` -> docs, `.agents/**`, `.opencode/**`, `codegraph.json` and `AGENTS.md` -> agents. Test files take the scope of the code under test. `css/paper/**`, `js/vendor/**`, root and vendor files get no scope.
3. Decide the structure: a single commit is fine when all changes share one type and one scope, or when the change is small and cohesive (one logical change). Otherwise split by type + scope: one commit per group, never mixing types or unrelated areas in a commit. Commit order should read logically: code before its tests, docs and chore last.
4. Execute: for each group, commit only the files belonging to it with `git commit <paths> -m "<message>"`. Verify each commit succeeded before moving on; if one fails, stop and report. Leave unstaged and untracked files untouched, except for the `git add -u` in step 1.
5. Report: list the commits created with `git log --oneline -N`, and mention any untracked files that were skipped.

Message requirements:

Format: <type>(<scope>): <description> — scope is optional for docs, test and chore commits.
Allowed types: feat, fix, refactor, perf, docs, test, build, ci, chore, style, revert
Use the imperative mood (e.g. "add", "fix", "remove")
Do not capitalize the first word of the description.
Do not end the description with a period.
Maximum 75 characters total, including type and scope.
If a group includes both a fix and a feature, prefer the type that best reflects the primary purpose of that group.
Never add Co-Authored-By, Signed-off-by, or any other trailer or attribution line.
