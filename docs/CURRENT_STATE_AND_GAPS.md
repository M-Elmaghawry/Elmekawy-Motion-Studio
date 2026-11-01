# Current state and gaps

Latest delivery: 2026-11-01 Phase 4 and explicit legacy image editing are recorded in [PHASE_4_IMPLEMENTATION.md](PHASE_4_IMPLEMENTATION.md). This document's earlier phase-specific gaps and test results remain historical snapshots. Current code supports real video/audio, audio timelines, scene-linked manual prompts, all nine flexible scenes, three ratios, ZIP roundtrips and version restoration. Legacy V1/V2 image controls use a separate opt-in template 1.2.0 project copy. The historical inventory junction failure described below did not reproduce in the current checkout's fresh audit.

Inspection date: 2026-10-31, Asia/Riyadh. This records local verification for Phase 0/1 of `ELMEKAWY_MOTION_STUDIO_NEXT_CODEX_PLAN.md`; older review documents describe earlier snapshots and are not fresh runtime evidence.

## Baseline and protection

- Starting commit: `729af448ea08d9fb473e68be28b959dfbc820845`, initially on `main`. Work branch: `feature/studio-flexible-scenes`.
- Initial `git status --short` contained only the user's two untracked documents: `docs/ELMEKAWY_MOTION_STUDIO_FINAL_REVIEW_2026-10-31.md` and `docs/ELMEKAWY_MOTION_STUDIO_NEXT_CODEX_PLAN.md`. Both were read and preserved. No other user work was overwritten.
- Windows x64; Node `24.14.0`, npm `11.9.0`; root package `0.1.0`, TypeScript `5.9.3`, Vite `7.3.2`, Remotion packages `4.0.539`, React/React DOM `19.2.3`, Fastify `5.12.7`, Ajv `8.20.0`.
- Initial root `package.json` SHA-256: `1dbfda833205d89cadab721f2ca1cbc4c13d579501dc3230cfd9ea24a0a5dbc3`; lockfile SHA-256: `48b1d4e7825e49bc18f9e6fdc141584d2fbdcc458c7ee59c1fc80a2b23b6f42b`.
- Baseline launcher: 21,504 bytes, SHA-256 `6d70a45311a1796a5565eb7a3e724a93a53cd03e05c2a4f7f5199a770c0f5b53`. Rebuilding must be verified without delivering an unrelated binary change.
- Frozen source hash inventory: `.studio/test-runs/phase01-source-baseline.json`, covering templates, motion components and engine source before changes. These sources are outside the formatting scope.
- Preserve `elmekawy-bim-reel/`, `elmekawy-bim-reel-V2/`, `archive/2026-10-31T10-52-36-439Z-646266a9/`, existing `.studio` records, `projects/` and `shared-assets/`. All generated verification data uses new `.studio/test-runs/` directories; production project revisions and historical reports are not replaced.

The first sandboxed Git status failed because Git LFS tried to write a temporary clean-filter object inside protected `.git`. An approved Git operation successfully recorded status and created the feature branch. This was an environment permission issue, not an uncommitted source change.

## Confirmed behavior and gaps

| Area                | Verified local state                                                                                             | Consequence / next step                                                                                                             |
| ------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Launcher aliases    | Both `launcher:build` and `launcher:verify` already existed at baseline and resolved to real scripts             | The published-review mismatch is stale for this commit; retain aliases and add CLI regression checks                                |
| Launcher checks     | Real EXE preflight, hidden startup/reuse, external ownership, busy-port rejection and pipe-closure checks exist  | Add early platform/argument handling; write each report into its unique test directory                                              |
| Active dependencies | Root installation initially absent; first tests failed to resolve `@elmekawy/shared`, build could not find `tsc` | Restore from the root lockfile before application verification                                                                      |
| Browser seed        | Copies historical V2 runtime only if central browser is absent                                                   | Keep fallback; see independent pinned provisioning proposal                                                                         |
| Resources           | Fonts, media, prompt template and original V2 export also seed from V2                                           | Browser independence alone cannot establish complete fresh-clone independence                                                       |
| Legacy engine       | Two template IDs; each has frozen 1.0.0 and editable 1.1.0 implementations                                       | New template/version/schema required; never broaden legacy timing silently                                                          |
| UI                  | Direct V1/V2 imports; fixed scenes/timing/portrait format; client defaults and card branding are hard-coded      | Wizard, scene controls and branding are Phase 3; no UI refactor in this session                                                     |
| Uploads             | PNG/JPEG/WebP byte signatures and real browser decoding, max 50 MiB, immutable generated filenames               | General video/audio and FFprobe media validation remain Phase 4                                                                     |
| Audio               | V1 original MP3 at volume 0.3; V2 silent                                                                         | No general voiceover/music/beat timeline yet                                                                                        |
| Storage             | `STUDIO_DATA_ROOT` relocates project and state roots, while shared assets remain workspace-relative              | No complete portable-data export/reimport yet                                                                                       |
| Render cancellation | Baseline application test exposed cancellation being overwritten by concurrent worker startup                    | Reserve startup before awaits; recheck cancellation/closing before fork and attach lifecycle listeners without an intervening await |
| Repository data     | Git tracks 20,250 archive files, 256 `.studio` files, 86 project files and 12 shared-asset files                 | Record existing exposure; no untracking, cleanup, history rewriting or publishing in Phase 1                                        |

Prompt editing/copying is manual. No external image-generation API, MCP, browser automation or paid provider integration was added.

## Verification log

Initial commands and actual failures:

- `npm.cmd test`: failed before tests, missing root workspace package installation.
- `npm.cmd run build`: failed, `tsc` unavailable.
- `npm.cmd run verify:legacy`: failed inventory check at `elmekawy-bim-reel/.claude/skills/remotion-best-practices`, an existing Windows junction to `.agents/skills/remotion-best-practices`. Do not delete the junction, rewrite the archive, or report full inventory verification as passed.

Recovery/setup:

- `npm.cmd ci --cache .studio/test-runs/npm-cache`: succeeded, 321 packages installed. Runtime dependencies remain locked at the original versions.
- Development tooling added with exact pins; no runtime-version upgrade: ESLint `10.12.0`, `@eslint/js` `10.0.1`, Prettier `3.8.1`.
- `npm.cmd run seed` with `STUDIO_DATA_ROOT` set to a new `phase01-seed-<UUID>` test directory: succeeded; imported V1/V2 into the isolated store and copied the existing V2 browser into central `node_modules`. This is a working-fallback check, not a clean independent-browser test.

Final results:

| Exact command                     | Actual result                                                                                                                                                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm.cmd run typecheck`           | Passed; the final production build also reran the full TypeScript check                                                                                                                                                   |
| `npm.cmd run build`               | Passed after the cancellation fix; existing Vite warnings concern `use client`, runtime font URLs and bundle size                                                                                                         |
| `npm.cmd run lint`                | Passed with zero warnings in the declared JavaScript scope                                                                                                                                                                |
| `npm.cmd run format:check`        | Passed for the explicit file list                                                                                                                                                                                         |
| `npm.cmd run test:cli`            | 3/3 passed, including actual npm alias invocation from a different working directory                                                                                                                                      |
| `npm.cmd test`                    | Final run: 15/15 passed in about 59 seconds; includes real 360-frame V2 export retaining its queued revision, plus stable cancelled state in memory/on disk                                                               |
| `npm.cmd run launcher:build`      | Passed using the actual Windows C# compiler; rebuilt EXE was verified and the original binary bytes were then restored and hash-checked to avoid an unrelated binary diff                                                 |
| `npm.cmd run launcher:verify`     | 5/5 passed against both the original and freshly rebuilt EXE, with no browser/tray UI                                                                                                                                     |
| `npm.cmd run verify:render-smoke` | Passed: 24/24 exact PNG comparisons against the original bundle (6 frames × 2 templates × 2 template versions), plus two 30-frame H.264 clips verified by FFprobe and fully decoded by FFmpeg; V1 has audio, V2 is silent |
| `npm.cmd run verify:legacy`       | Failed at the existing junction inventory check; not counted as a pass                                                                                                                                                    |
| `git diff --check`                | Passed                                                                                                                                                                                                                    |

The first installed application run reproduced two linked failures: cancellation returned `bundling` instead of `cancelled`, and the following queued render timed out. The queue reservation/listener fix resolves these in the final run. Initial iterations of the new smoke helper failed due to cross-origin font serving and this bundled FFmpeg lacking the default null-output video encoder; the final helper serves the bundle from the isolated API origin and explicitly decodes with rawvideo/PCM. No application CORS policy or legacy rendering behavior was changed to make the helper pass.

Retained local evidence:

- Successful rebuilt-launcher report: `.studio/test-runs/launcher 7e3222b5-7579-4dc4-a17d-6237aa411e68 مساحة/report.json` (rebuilt EXE hash differs from the historical EXE, as expected for a new compilation).
- Successful render report: `.studio/test-runs/render-smoke-d1878b3b-edea-4b0a-9cab-8c6c08e7c02d/report.json`, with both short MP4 files and their probe JSON beside it.
- Independent protected-file audit: `.studio/test-runs/phase01-audit-report.json` and `phase01-audit-summary.json`. Of 20,244 historical manifest paths, 19,629 match SHA-256 exactly; 615 text files differ only by CRLF/LF when compared with their archived copies; zero are missing and zero have other content differences. These are existing checkout/archive differences: initial/final Git status contains no changes under the historical roots. This does not override the failing strict inventory guard or certify raw-byte identity of all originals with the archive.
- Frozen active template/component/engine source: all 51 baseline file hashes remain identical. Final Git status contains no project, shared asset, archive, historical-source or EXE changes.

Earlier historical 40/40 parity and 112/112 text-field claims in README remain historical evidence; they were not rerun here. The current smoke covers selected boundaries and both template versions, not every frame of every full legacy export. A clean Windows machine and the proposed independent browser download remain untested. npm's install audit reported existing dependency advisories; no automatic runtime upgrades or `audit fix --force` were applied.

## Changed files

Modified:

- `README.md`
- `apps/server/src/renders.ts`
- `docs/RUN_LOCAL_STUDIO.md`
- `package.json`
- `package-lock.json`
- `scripts/verify-launcher.mjs`
- `tests/studio.test.ts`

Added:

- `.prettierrc.json`
- `eslint.config.mjs`
- `tests/reliability.test.ts`
- `scripts/verify-render-smoke.mjs`
- `docs/CURRENT_STATE_AND_GAPS.md`
- `docs/BROWSER_PROVISIONING_PLAN.md`
- `docs/FLEXIBLE_SCENE_ENGINE_SPEC.md`

The two supplied review/plan documents remain unmodified and untracked, as at baseline. All verification artifacts/cache are ignored under `.studio/test-runs/`; no commit or push was made.

## Delivery and rollback

This iteration adds focused CLI tests, explicit typecheck/lint/format commands, an isolated V1/V2 rendering smoke utility, cancellation startup protection, browser provisioning design and the flexible engine specification. Lint checks the modified JavaScript verification scripts; typecheck checks application/packages/TypeScript tests. Formatting uses an explicit file list and excludes preserved source and unrelated existing code. New CLI tests exercise the actual npm alias, its help path and invalid arguments.

No data-schema migration occurs. To roll back, revert only this iteration's source/tooling/doc changes on its feature branch and reinstall from the prior root lockfile; retain all projects, assets, history, archives and verification evidence. The central copied browser is the existing pinned historical payload. Do not use `git reset --hard`, recursive deletion or a historical-directory reinstall as rollback.

Phase 2 PR breakdown is in [FLEXIBLE_SCENE_ENGINE_SPEC.md](FLEXIBLE_SCENE_ENGINE_SPEC.md). After this Phase 0/1 review, the user requested continuation and adding image sizing to the plan. Phase 2 implementation and its fresh results are recorded separately in [PHASE_2_IMPLEMENTATION.md](PHASE_2_IMPLEMENTATION.md), dated 2026-11-01. This document's baseline/test counts describe Phase 0/1, not the later expanded suite. Editor/media/prompts/recovery remain separate increments.

## Phase 3 status — 2026-11-01

The flexible-only project wizard/editor and schema-2 server integration are implemented on `feature/studio-flexible-scenes`; the editor includes local project creation, the three brand profiles, scene add/delete/reorder/retime/content editing, persisted image transforms, save/reopen/duplicate, image approval, and queued H.264 rendering. Legacy schema-1 routes and V1/V2 editor behavior remain separate. Phase details and limitations are in [PHASE_3_IMPLEMENTATION.md](PHASE_3_IMPLEMENTATION.md).

Fresh verification on Windows x64:

- `npm.cmd test`: 34/34 passed.
- `npm.cmd run build`: passed (TypeScript plus Vite).
- `npm.cmd run lint` and `npm.cmd run format:check`: passed.
- `npm.cmd run verify:editor`: passed all six browser end-to-end checks, including independent 20-second Elmekawy and 25-second Khatwa projects and a decoded 20-second export.
- `npm.cmd run verify:render-smoke`: passed 24/24 V1/V2 boundary-pixel comparisons for versions 1.0.0 and 1.1.0, plus both 30-frame H.264 smoke exports.
- `git diff --check`: passed.

The Phase 3 smoke browser logged 404s for known-absent optional V2 comparison-image URLs; the legacy output still matched its captured baseline. These targeted results do not clear the pre-existing `verify:legacy` junction failure or establish a clean-machine browser install. Remaining scope includes general video/audio asset support and timeline, broader aspect-ratio/font options, project archive export/reimport and later QA/recovery features. No Phase 3 changes have been committed or pushed.
