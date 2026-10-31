# Phase 2 implementation record

Date: 2026-11-01 (Asia/Riyadh). Continues the approved Phase 0/1 work on `feature/studio-flexible-scenes`. The user's follow-up authorized continuation and adding scene image sizing to the plan.

## Delivered scope

- Separate `@elmekawy/shared/flexible` contracts, strict JSON schema `2.0.0`, exact `flexible-reel@1.0.0` manifest, five typed scene contracts and trusted registry. Four additional scene names stay reserved and rejected until implemented.
- Structural/semantic validation, version-dispatched legacy/flexible parsing, immutable parsed copies, reference/hash checks, approval readiness, bounded frame/image controls, and one overlap compiler shared with rendering.
- Five new frame-driven scene components: kinetic title, stat proof, image showcase, process flow and offer/CTA. Arabic/English bidi isolation, local Cairo/Inter loading, safe text regions and reduced travel motion are supported.
- A separate `FlexibleReel` composition with calculated metadata and independent engine/template exports. Existing legacy composition registration settings and implementations are preserved.
- A complete, expanded 20s JSON fixture at `packages/templates/src/flexible-reel/1.0.0/sample.json`. Five 132-frame scenes, four 15-frame overlaps: exactly 600 frames at 30 FPS. The fixture is inside the versioned package and therefore covered by the existing source fingerprint/release snapshot mechanism.
- An explicit local `render:flexible` CLI: JSON validation, new isolated output directory, immutable asset snapshots with path/link/signature/hash checks, registered local HTTP resources, boundary PNGs/repeated seeks, image-transform isolation checks, Arabic overflow rejection, H.264 export, FFprobe/full decode and reproducibility manifests. No production API/server/store is changed by this CLI.

The Studio wizard/editor and project-save API still expose legacy projects only. Flexible UI create/save/reopen/duplicate controls belong to Phase 3; schema support and a CLI render are not presented as completed UI integration. Video/audio uploads, voice/music tracks, export/reimport and the remaining four scene types remain later deliveries.

## Image sizing added to the execution plan

Phase 3/PR 06b now includes frame dimensions with aspect lock, image zoom, horizontal/vertical position, cover/contain, focal point and reset. These are scene-local persisted fields, with identical Player and Renderer behavior.

Phase 2 implements the actual data/rendering contract already:

- `frame`: normalized center `x/y` and relative `width/height` within the scene's image viewport. Defaults are center `0.5/0.5`, width/height `1/1`.
- `transform`: independent image `scale` (0.25–3) and offsets (−1–1 relative to the frame). Defaults `1/0/0`.
- `fit`: `cover` or `contain`; `focalPoint` uses normalized `x/y`.

The outer frame and zoom are separate operations. The frame clips content, and optional subtle pan remains frame-derived. Reduced motion removes that pan. The new settings are supported through JSON; there is no size slider in the current Studio UI yet. Legacy support must use a new opt-in template version and identity defaults, preserving existing V1/V2 versions.

## Run locally

From the repository root with Node 24+, installed root dependencies and seeded local resources/browser:

```powershell
npm.cmd run test:flexible
npm.cmd run render:flexible -- --validate-only
npm.cmd run render:flexible
npm.cmd run render:flexible -- path/to/expanded-project.json
```

Validation-only checks JSON without creating output directories or opening Chrome. Rendering requires Windows x64. A shared asset resolves under `shared-assets`; a project asset resolves below the supplied JSON's directory and must start with `assets/`. The CLI serves only registered local snapshot/bundle files, with no external media/generation calls. An unknown license remains visible in the snapshot; fixture approval is limited to this local illustration and does not assert commercial rights.

Every full run creates `.studio/test-runs/flexible-<UUID>/` containing saved JSON, snapshotted assets, PNGs, output MP4, probe JSON, render manifest and report. Prepared local operation remains offline. Dependencies have not been upgraded: Ajv `8.20.0`, already installed, is now explicitly declared by its shared consumer.

## Verification

| Command/check                                    | Actual result                                                                                                                                                                                                                                                             |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm.cmd run test:flexible`                      | 12/12 passed; strict schemas, legacy dispatch, references, image bindings, transitions/endpoints, retiming/reorder and 100 deterministic valid schedules                                                                                                                  |
| `npm.cmd test`                                   | 27/27 passed, including the full existing API/storage/upload/cancellation suite and real 360-frame V2 export; final suite completed in about 45 seconds                                                                                                                   |
| `npm.cmd run typecheck`                          | Passed                                                                                                                                                                                                                                                                    |
| `npm.cmd run build`                              | Passed; the legacy UI bundle retains its original `index-U0uJ7Z-x.js` output hash and 640.45 kB size because the flexible client has a separate entry point                                                                                                               |
| `npm.cmd run lint`                               | Passed in the declared incremental JavaScript scope; the full TypeScript workspace is checked by `typecheck`                                                                                                                                                              |
| `npm.cmd run format:check`                       | Passed for the explicit scope, including the new flexible files                                                                                                                                                                                                           |
| `npm.cmd run render:flexible -- --validate-only` | Valid schema-2 document, 600 frames, 20 seconds, zero render readiness issues                                                                                                                                                                                             |
| `npm.cmd run render:flexible`                    | Passed: 23 boundary/midpoint PNGs, two nonsequential repeated seeks, scene image transform pixel changes, unchanged header pixels/unrelated scene, blocked Arabic overflow, full H.264 export, FFprobe and full decode                                                    |
| `npm.cmd run verify:render-smoke`                | 24/24 exact V1/V2 PNG matches against the original bundle, covering legacy 1.0.0 and editable 1.1.0; both short H.264/audio smoke clips passed                                                                                                                            |
| `npm.cmd run verify:legacy`                      | Still fails at the existing `elmekawy-bim-reel/.claude/skills/remotion-best-practices` junction. No archive/inventory pass is claimed                                                                                                                                     |
| Protected bytes                                  | All 160 files from this continuation's baseline retained their exact SHA-256. Of the 51 Phase 1 source files, only `packages/motion-engine/src/Root.tsx` changes, to register the new composition; legacy templates, common components and the legacy client remain exact |
| `git diff --check`                               | Passed                                                                                                                                                                                                                                                                    |

Successful final flexible artifacts are in `.studio/test-runs/flexible-1d264e66-5cde-4e47-a944-832245229499/`: `flexible-reel-20s.mp4`, `report.json`, `render-manifest.json`, `probe.json`, boundary PNGs and `image-transform-variant.png`. The output is H.264, 1080×1920, 30 FPS, 600 frames, exactly 20 seconds, with no audio. Requested pixel format is yuv420p; FFprobe reports full-range yuvj420p, consistent with the existing JPEG-frame pipeline. Both requested settings and actual probe data are retained.

The latest legacy smoke report is `.studio/test-runs/render-smoke-3c6e8e71-b6f9-4577-a678-6dfb08ba247d/report.json`. Earlier failing development runs remain as diagnostic artifacts and are not included as passes. In particular, actual render checks caught asynchronous font/layout painting and the initial text guard's dependence on a parent forwarded ref. The final implementation waits for loaded fonts and font-set layout, uses a stable DOM root ID for safety checks, maintains a persistent header and an explicit scene paint layer, and tests header pixel isolation. The bundled FFmpeg lacks a rawvideo output muxer, so pixel-region hashes use the local browser canvas; full-video decoding still uses FFmpeg's supported null output with an explicit rawvideo decoder output codec.

The old `verify:legacy` junction/CRLF archive discrepancy remains recorded in `CURRENT_STATE_AND_GAPS.md`; no historical file or strict guard is rewritten to hide it. No existing browser fallback was removed and no independent fresh-Windows browser installation is newly certified.

At the start of this continuation, the user had modified the V2 `project.json` (revision 3). Its exact bytes, existing project assets/history, shared resources and frozen template/component sources were inventoried in `.studio/test-runs/phase02-start-baseline.json` and are preserved. Phase 1 changes remain in the same worktree; they are not reset or overwritten. Only engine root registration gains the new composition, and new subpath exports/metadata are added.

## Phase 2 file changes

- `packages/shared/src/flexible/`: new types, manifest/scene registry, schemas/parsers and timeline compiler.
- `packages/templates/src/flexible-reel/1.0.0/`: new scene components, composition, font/text guards and complete sample JSON.
- `packages/motion-engine/src/flexible.tsx`: new client component/metadata entry; `src/Root.tsx` adds registration while retaining both legacy registrations.
- `packages/shared/package.json`, `packages/templates/package.json`, `packages/motion-engine/package.json`, and the root lockfile: explicit exports and the existing pinned Ajv dependency; no runtime version upgrade.
- `scripts/render-flexible.ts`, `tests/flexible.test.ts`, and root `package.json`: JSON render/verification command, tests and focused formatting scope.
- `docs/ELMEKAWY_MOTION_STUDIO_NEXT_CODEX_PLAN.md`: image controls added to Phase 3/PR 06b and continuation boundary recorded.
- `docs/FLEXIBLE_SCENE_ENGINE_SPEC.md`, this record, `docs/CURRENT_STATE_AND_GAPS.md`, `docs/RUN_LOCAL_STUDIO.md`, and `README.md`: implementation status, usage, validation and remaining editor scope.

Existing user V2 JSON/history/render artifacts remain user data and must not be included in a code commit simply because Git reports them as modified/untracked. This session did not commit, push, publish or migrate production data.

## Rollback and next increment

No existing project is migrated. Revert only the Phase 2 registration/new source/export/tooling additions to return to the Phase 1 application; retain all project data, archives and generated verification evidence. A schema-2 document needs the matching flexible release to reopen/render it. Never coerce it into schema 1 or write resize fields into a legacy project.

Next: Phase 3 wizard and brand snapshots, then flexible-only scene controls and image size/position controls, persistence and duplication. Keep UI/API integration separately reviewable from the new engine.
