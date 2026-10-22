---
name: release
description: Cut a formbuilder release — bump the version, prepend changelog release notes, rebuild the bundle, tag it and attach the artifacts to the GitHub Release
---

# Release

Cut a new release. Given an optional release number, determine the version, bump it
across the version files, prepend release notes to `CHANGELOG.md`, rebuild the
bundle, then tag the release and attach the deployable artifacts to the GitHub
Release.

## Inputs

- `number` (optional): a full version (`X.Y.Z`). When omitted, the skill suggests
  the next version and asks for confirmation.

## Versioning scheme

  version = `<major>.<minor>.<patch>`   (plain semver)

- The release version is the `## X.Y.Z` heading in `CHANGELOG.md` and the matching
  git tag (`X.Y.Z`). The current latest tag is `0.0.9`.
- **The git tag and the CHANGELOG heading are authoritative — not `package.json`.**
  `package.json` and `package-lock.json` currently read `1.0.0`, which has drifted
  from the tag. Always detect the current version from the tag and the CHANGELOG,
  and warn the user about the drift instead of trusting `package.json`.
- There is no `CHANGELOG.md` yet. The first managed release creates it with a
  `# Release Notes` heading before the new `## X.Y.Z` section.
- There is no build number and no native app: this is a web app deployed as the
  `public/` tree.

## Steps

0. **Full test suite gate** (mandatory first, before any state reads or edits):
   - Run `npm test` (Mocha 2.5 + Chai + jsdom). If the change touches the Vue
     port, also run the port's Vitest suite when it exists.
   - If any test fails, **stop immediately** — do not bump versions, edit the
     changelog, commit, or tag. Report the failing files/tests and warn the user
     to fix them first; resume the release only once the suite is fully green.

1. Read current state
   - `CHANGELOG.md` -> the latest `## X.Y.Z` heading (it may not exist)
   - `git tag` -> the highest `X.Y.Z` tag (the previous release)
   - `package.json` -> `version`
   - `package-lock.json` -> both `"version"` fields (root and `packages[""]`)
   - `public/index.html` -> `#formbuilder-version` `data-version` and the
     `js/formbuilder.js?v=` query (they must be equal)
   - If the tag and the CHANGELOG heading disagree, stop and ask which is correct.

2. Determine the new version
   - If `number` is `X.Y.Z`: use it verbatim.
   - If no `number`: suggest a patch bump `<major>.<minor>.<patch+1>`; for a
     feature/minor release ask whether to bump `<minor>` instead.
   - Print the suggestion and proceed only after confirmation (or immediately
     when an explicit `number` was passed).

3. Apply edits (exact string replacement, preserve indentation)
   - `package.json`: `"version": "<new>"`
   - `package-lock.json`: `"version": "<new>"` in both version fields (root and
     `packages[""]`). npm does not sync these on a hand-edit of `package.json`,
     so bump them explicitly — never `npm install` for this (it rewrites pins
     and may churn unrelated entries).
   - Risk: `package.json` and the git tag drifting apart. This repo has already
     drifted (`1.0.0` vs tag `0.0.9`) — keep them in sync from now on.

4. Generate release notes
   - `git log --oneline <prev-tag>..HEAD` (base = previous release tag).
   - Collapse commits into concise, user-facing bullets grouped by area
     (features, fixes, build/migration, tests); drop internal/CI-only commits.
   - If `CHANGELOG.md` does not exist, create it with:
     `# Release Notes`, then the new `## <new>` section.
   - Otherwise prepend the new `## <new>` section right after the
     `# Release Notes` line.
   - Mirror the existing bullet style (`- ` / ` - `) exactly.

5. Build
   - `npm run build` — gulp default (`vendor-js → vendor-css → sass → browserify`)
     → `public/js/formbuilder.js`, `public/js/vendor-formbuilder.js`,
     `public/css/formbuilder.css`, `public/css/vendor-formbuilder.css`.
   - Never upload an artifact from a stale build. Rebuild before attaching.
   - `npm run build` rewrites four tracked files; confirm the diff contains only
     the expected bundles.

6. Bump the cache busters in `public/index.html`
   - Set both `#formbuilder-version` `data-version` and the
     `js/formbuilder.js?v=` query to the same fresh value. The existing format is
     epoch milliseconds; generate it with `node -e "console.log(Date.now())"`.
   - They must match; a mismatch makes the app bundle and the runtime views load
     different builds.

7. Report and confirm follow-up
   - Show version, changed files, the cache-buster value and the built artifacts.
   - Ask whether to commit (`chore: release <new>`), create an annotated tag
     (`<new>`, e.g. `0.1.0`), and push `master` + the tag. Do not commit, tag or
     push unless confirmed.
   - The tag must be pushed to origin before the GitHub Release can point at it.

8. Create the GitHub Release and attach the artifacts (after the tag is pushed)
   - With the user's confirmation, create the release:

     ```bash
     gh release create <tag> --title "<tag>" --generate-notes
     ```

     Or pass `--notes-file` with the new CHANGELOG section.
   - Upload the four built artifacts:

     ```bash
     gh release upload <tag> \
       public/js/formbuilder.js \
       public/js/vendor-formbuilder.js \
       public/css/formbuilder.css \
       public/css/vendor-formbuilder.css \
       --clobber
     ```

   - Verify the assets are attached:

     ```bash
     gh release view <tag> --json assets
     ```

9. Deploy to the server is a **separate, explicit** step
   - There is no deploy script. Copy the deployable tree into the EpiCollect5
     server's `public/formbuilder/` directory: `index.html`, `js/`, `css/`,
     `views/`, and the static `fonts/`/`favicons/` when they changed.
   - Bump the server's own `config('app.release')` cache-buster when the shell or
     views change, so production does not keep serving the previous release.
   - Never deploy as part of the release unless the user asks for it, and confirm
     the destination path first.

## Constraints (AGENTS.md)

- Do NOT introduce TypeScript or new patterns.
- Follow existing architecture/conventions.
- System risk check: the `package.json` version, the `package-lock.json` version,
  the git tag and the `public/index.html` cache busters must all name the same
  release. A mismatch makes the released build impossible to identify or serves
  mixed assets.
- The release artifacts MUST come from a fresh `npm run build`; a stale bundle
  ships code that does not match the tag.
- Copying to the server writes outside the repo — confirm the destination before
  doing it.
