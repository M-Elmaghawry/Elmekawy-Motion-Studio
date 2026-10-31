# Phase 3 — flexible Studio editor

Date: 2026-11-01 (Asia/Riyadh). Continues the approved Phase 2 engine on `feature/studio-flexible-scenes`.

## Delivered behavior

- A New Flexible Project wizard covers name/client/goal, versioned brand snapshot, supported format/duration, ordered storyboard, local image selection/manual upload/review, and H.264 output quality.
- Brand presets: Elmekawy BIM, Khatwa Designs and Custom Client. Project cards use stored client/brand/title/format data.
- Flexible-only add/delete/reorder/retime controls, editable scene content and motion, scene timeline and exact overlap accounting. Add/delete redistribute the current target duration; reordering retains transition boundaries and scene IDs. Individual retiming updates total duration.
- Per-scene image frame dimensions/aspect lock, independent zoom, frame/image offsets, cover/contain, focal point and reset. Defaults remain identity transforms. Draft preview and production rendering reuse the same scene component and image-layout function.
- Save/reopen/duplicate with optimistic revision checks and retained historical JSON. Immutable image replacement retains earlier files and bindings for saved versions/renders.
- A common local render queue accepts both project formats; flexible jobs carry an explicit format discriminator. Queued JSON/descriptor snapshots retain the saved image transforms and revision while later edits continue.

## Storage and compatibility

Schema-2 projects use `<STUDIO_DATA_ROOT>/flexible-projects/<id>/`; schema-1 projects retain `projects/<id>/` and their original routes/editor. The separate `api/flexible` namespace keeps legacy response contracts and validators unchanged. Both stores appear together in Studio. No existing project is automatically migrated or rewritten.

The root data path is server controlled. Create/edit DTOs exclude project identity, revision, asset paths/hashes/approval, font references and template versions. Saves validate the complete resulting project. Media paths reject traversal and links, verify catalog/shared membership and exact hashes, and are served through registered routes. New image uploads require actual decode/type/dimension/size validation; approval is a separate explicit action.

Pending images can be reviewed in draft preview. Production enqueue rejects required unapproved images. The browser preview reports text overflow as a warning; rendering retains the hard safety gate. Text measurement normalizes the Player's display scale so a small preview does not produce incorrect safe-area warnings.

Only portrait 1080×1920, 30 FPS, 20–45 seconds and silent MP4/H.264 are currently enabled by the manifest. Other ratios, general video/audio upload, voice/music tracks, full project ZIP export/reimport and legacy image controls remain later increments. The two historical template versions never gain mutable layout fields implicitly.

## User workflow

1. Open **＋ مشروع مرن**, complete the wizard and choose/review an image.
2. Select an image scene, adjust **حجم الصورة وموضعها**, preview immediately and save.
3. Reorder/add/delete/retime scenes, edit content, save and reopen. Duplicate produces an independent data/media folder without source/dependencies/history/renders.
4. Approve the current image and use **تصدير MP4**. Unsaved edits save first. A completed job provides a download link; later edits do not modify the queued revision.

The updated application must be restarted to load new server routes. A new UI against an older still-running server keeps the legacy projects usable and explains that a restart is needed to enable flexible editing. Tests do not stop or replace the user's production server.

## Verification

Fresh final command results and isolated artifact paths are recorded below after verification. New API and browser tests use fresh `.studio/test-runs/` stores. They never create demonstration projects inside the production stores.

The initial protected-file snapshot is `.studio/test-runs/phase03-start-baseline.json`, covering existing projects/resources and template/component files. Two flexible template files gain opt-in draft-preview handling; production defaults and legacy V1/V2 behavior remain protected by render comparisons. The known strict historical-inventory junction failure remains documented; no archive guard is weakened.

## Verification results — 2026-11-01

| Exact command                     | Result                                                                                                                                                                      |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm.cmd test`                    | Passed: 34/34 tests, including isolated flexible API/storage/upload/revision tests and real flexible and legacy render exports.                                             |
| `npm.cmd run build`               | Passed, including the full TypeScript check. Vite reports the existing runtime-font, `use client`, and large legacy bundle warnings.                                        |
| `npm.cmd run lint`                | Passed with zero warnings in the configured lint scope.                                                                                                                     |
| `npm.cmd run format:check`        | Passed for all configured files, including the Phase 3 editor and tests.                                                                                                    |
| `npm.cmd run verify:editor`       | Passed all six real-browser checks: create 20s Elmekawy and 25s Khatwa projects, edit/reset/reorder/retime/add/delete, save/reopen, duplicate, and export/decode a 20s MP4. |
| `npm.cmd run verify:render-smoke` | Passed all 24 V1/V2 boundary-pixel comparisons across versions 1.0.0 and 1.1.0, plus both 30-frame H.264 smoke exports (V1 audio, V2 silent).                               |
| `git diff --check`                | Passed.                                                                                                                                                                     |

The browser and render-smoke reports are retained in `.studio/test-runs/editor-ui-79340f21-120d-4b83-89ee-d0c613fb30d0/report.json` and `.studio/test-runs/render-smoke-a0aab077-37e1-4c7d-b37c-98c47b6a5f6b/report.json`. The smoke browser logged 404s for the known-absent optional V2 comparison images; both legacy compositions still matched the captured baseline pixels. The separate historical inventory check remains known to fail on the existing Windows junction, as recorded in `CURRENT_STATE_AND_GAPS.md`; it was not counted as passing here.

## Rollback

Remove/revert Phase 3 application/API integration and return to the Phase 2 client without deleting any store, asset, historical JSON or render. Preserve `flexible-projects/` for a matching release to reopen. No schema-1 migration or destructive cleanup is part of rollback.
