# Release Notes

## 0.1.0
- Tests: the suite now runs in Node (Mocha, Chai and jsdom) instead of the browserified bundle
- Jumps: the answer select is locked for the "always" and "no answer given" conditions, which do not use an answer
- Jumps: the condition and answer selects keep their current selection when the properties panel is re-rendered
- Import: replaced `$.isArray` with `Array.isArray` in the import validation and the import callback
- Import: `slugify` now handles an empty or missing form name instead of throwing
- Build: removed the license CSV exports
- Build: bumped the build version and refreshed the file manifest
- Agents: added CodeGraph indexing, the Command Code permission settings and the eight agent skills
- Docs: added the agent rules, the architecture document, the coding style for the Vue port and the commit and review guidelines
## 0.0.9
- Import: the failure toast now reports the specific validation error
- Cache: the project definition version was added to the project logo URL, so an updated logo is no longer served stale
- Docs: documented the gulp commands in the README
## 0.0.8
- Jumps: restricted the "End of form" destination to jumps that skip at least one question
- Import: sanitized legacy invalid end jumps when importing a form
- Import: the sanitization now clears every jump of the last form and branch input, not only the end jumps
- Save: cleared the stale `group` array of branch inputs before saving
- Export: an exported form is now named `<project-slug>__<form-slug>.form.epicollect.json`
- Tests: added the related tests
## 0.0.7
- Delete: a warning is shown before deleting a question when the project already has entries
- Added the favicons and the web app manifest
- Docs: added the forking section to the README
## 0.0.6
- Jumps: renamed the jumps tab to "Jumps (IF - ELSE)", to match the jump semantics
## 0.0.5
- Copy: fixed copying a nested group inside a branch, the copy was appended to the wrong place
- Copy: fixed the current input reference after copying a question while editing a branch
- Exposed `CircularJSON` on `window`, so the export, print as PDF and copy paths can reach it
- Fixed a sortable destroy error when leaving a group
- Fixed the branch index passed to the group inputs template
- Tests: added the related tests
## 0.0.4
- Fixed the detection of duplicated `answer_ref` values in the possible answers of a question
- Tests: added the related tests
## 0.0.3
- Fixed the import validation of the multiple answer types, the first entry of the type list was never matched
## 0.0.2
- First release of the jQuery and jQuery UI formbuilder
- Possible answers: an `answer_ref` must be unique within a question, validated when saving
