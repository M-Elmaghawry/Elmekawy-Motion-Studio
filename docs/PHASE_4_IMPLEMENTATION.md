# Phase 4 and legacy image editing

Date: 2026-11-01 (Asia/Riyadh). Branch: `feature/studio-flexible-scenes`.

## Image size and position in V1/V2

The previous image controls were implemented only in the flexible editor. Existing V1/V2 projects therefore did not show them.

The V1/V2 editor now has a **حجم وموضع الصور** tab, and image controls also appear before the selected scene's text fields. Choose **إنشاء نسخة تدعم التحكم بالصور** to create an independent project using template **1.2.0**. The source project and its existing template version are preserved. Select a scene and its image, then adjust frame width/height, aspect lock, horizontal/vertical frame position, image zoom/offset, cover/contain and focal point, or reset. Save to retain the settings.

The new version uses scene scopes around the existing immutable scene implementations. CSS transforms target only the registered image URL inside that scene. Identity settings emit no transform rules. Player and Renderer use the same provider and composition. Replacing an uploaded image rebinds the layout to the new immutable asset ID. Duplication and archive import preserve layout settings.

V1/V2 templates 1.0.0 and 1.1.0 and all previously frozen motion-component source remain untouched. The new 1.2.0 compositions and manifests are separate files. No existing project is automatically upgraded.

## Flexible release and compatibility

- New projects use `flexible-reel@1.1.0`, project schema `2.1.0`.
- Existing schema `2.0.0` documents retain their strict validator, manifest and rendering through `flexible-reel@1.0.0`. The editor provides an explicit upgrade button; upgrading retains the previous JSON revision.
- All nine scene types are implemented: kinetic title, stat proof, media showcase, process flow, offer/CTA, mobile/app UI demo, product hero, before/after comparison and data explainer.
- Profiles: portrait 1080×1920, square 1080×1080 and landscape 1920×1080; 30 FPS, 20–45 seconds, MP4/H.264. Safe regions and layout adapt to the profile. Old portrait projects retain their stored output metadata.
- Animations and transition timing remain frame-derived. Video receives scene-local sequence time; audio receives track-local sequence time.

## Media, prompts and audio

Images use byte-signature and real browser decoding. Timed media use byte/container checks, FFprobe stream/codec/duration inspection and full FFmpeg decoding before registration. The supported inputs are PNG/JPEG/WebP, MP4/H.264, MP3, WAV PCM and M4A/AAC. Current limits are 50 MiB per image/font, 250 MiB per video, 100 MiB per audio, 180 seconds per timed input, 100 catalog entries and 2 GiB per project. Video dimensions are limited to 3840 per axis and 3840×2160 total pixels. Replacements receive generated immutable filenames and hashes; original files remain available to retained revisions.

The flexible editor includes a media/audio panel with local upload, review and separate voiceover/music tracks. Tracks store start, source trim, duration, gain and fades. Audio embedded in a video is used through an explicit audio track; the scene's video element is muted to avoid playing it twice. Beat markers and explicit silence/pause markers persist with the timeline. Validation rejects source overruns, out-of-range timing and audible tracks overlapping declared silence. QA warns about unmarked silence of at least one second, unapproved media, text overflow/unsafe text, and missing completed output.

PromptWorkspace records store scene, prompt, negative constraints, source, manual upload reference and draft/copy/upload/approval status. The UI supports copy, manual file upload and explicit review. There is no external generation API, provider, MCP or generation browser automation.

## Project archives and recovery

Both legacy and flexible projects support ZIP export/import. The archive contains project JSON, registered media/fonts and up to 100 historical revisions, with a versioned SHA-256 manifest. It excludes source, dependencies, caches and rendered video jobs. Archive size is limited to 512 MiB. Import validates paths, duplicate names, file counts, expanded sizes, manifest hashes, project versions and actual media payloads before publishing an independent project ID. Imported resources become project-local, including fonts that were originally shared. Existing project folders are not overwritten.

History restoration creates a new revision and retains the pre-restore state. Older registered media remain available to queued renders, including through retained history when an old flexible format is restored. No destructive migration or cleanup is performed.

API additions:

| Method     | Route                                                           | Behavior                                                  |
| ---------- | --------------------------------------------------------------- | --------------------------------------------------------- |
| POST       | `/api/projects/:id/image-editing-copy`                          | Explicit independent legacy 1.2.0 copy; requires If-Match |
| GET        | `/api/projects/:id/archive`                                     | Complete legacy project ZIP                               |
| GET / POST | `/api/projects/:id/history`, `/restore`                         | List versions / restore as new revision                   |
| GET        | `/api/flexible/projects/:id/archive`                            | Complete flexible project ZIP                             |
| POST       | `/api/project-archives/import`                                  | Validate and import into an independent ID                |
| POST       | `/api/flexible/projects/:id/media`                              | Upload validated image/video/audio                        |
| POST       | `/api/flexible/projects/:id/assets/:sceneId?slot=N&promptId=ID` | Scene-local upload, optionally linked to prompt           |
| POST       | `/api/flexible/projects/:id/upgrade`                            | Explicit schema-2.1 upgrade with retained history         |
| GET / POST | `/api/flexible/projects/:id/history`, `/restore`                | Version history / restore                                 |

All mutations retain the existing local session/origin checks. Saves, review, restoration and version upgrades require optimistic revision checks. Application resources stay local after setup.

## Verification

The new API suite covers scene/profile compatibility, explicit legacy image copies, scene-local persistence/duplication, real video/audio uploads, corrupt inputs, prompt review, beats/silence validation, archive roundtrips/tampering/traversal, history restoration and a frozen 30-second audiovisual export.

`verify:phase4-ui` exercises legacy image controls in the actual browser, then creates a 30-second course reel through the wizard, uploads/reviews video, adds its audio track, saves a scene-linked prompt, changes all three output profiles, exports and fully decodes the audiovisual output, imports its ZIP through the UI, and restores a historical revision.

The render-smoke utility now includes template 1.2.0 identity comparisons and scene-local image-transform isolation, in addition to the earlier 1.0.0/1.1.0 compatibility checks. The scene matrix renders all nine scene types in all three ratios with the text safety gate enabled.

Verified on Windows x64 with Node 24.19.0:

| Command/check                                              | Actual result                                                                                                                               |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm.cmd test`                                             | 42/42 passed in the final complete suite, including cross-version restoration and immutable legacy image replacement                        |
| `npm.cmd run test:phase4`                                  | 8/8 passed, including real media decoding, archive roundtrips, cross-version recovery and a 900-frame audiovisual export                    |
| `npm.cmd run build`                                        | Passed, including TypeScript                                                                                                                |
| `npm.cmd run lint`                                         | Passed in the declared incremental JavaScript scope                                                                                         |
| `npm.cmd run format:check`                                 | Passed in the explicit scope; frozen templates excluded                                                                                     |
| `npm.cmd run verify:editor`                                | 6/6 actual-browser checks passed, including 20s Elmekawy, 25s Khatwa and a decoded 20s export                                               |
| `npm.cmd run verify:phase4-ui`                             | 7/7 browser workflows passed, including legacy size/position/zoom and a fully decoded 30s audiovisual export                                |
| `npm.cmd run verify:scenes`                                | 27/27 stills passed the text safety gate: nine scene types in three ratios                                                                  |
| `npm.cmd run verify:render-smoke`                          | 36/36 exact legacy pixel comparisons, two scene-local transform/isolation checks and both 30-frame H.264/audio smoke clips passed           |
| `npm.cmd run verify:legacy`                                | All 20,244 protected original files match the backup                                                                                        |
| `npm.cmd run launcher:verify`                              | 5/5 passed against the real EXE                                                                                                             |
| `npm.cmd run render:flexible`                              | Original schema-2.0 JSON sample passed boundary/seek/transform/overflow checks and a complete 600-frame silent export                       |
| `npm.cmd run render:flexible -- <schema-2.1 project.json>` | Passed boundary/seek checks and a fully decoded 900-frame audiovisual export; CLI supports the same validated video/audio and range serving |
| Protected active source inventory                          | 50/50 pre-existing template/motion-component files retain identical SHA-256 hashes                                                          |

Successful evidence is retained under `.studio/test-runs/`:

- UI: `phase4-ui-d315668c-5184-4f88-bf5b-4f883556469a/report.json`, with the legacy controls screenshot and 30-second output location.
- Earlier editor workflow: `editor-ui-1ed8471d-e721-4f0c-b87c-88892353102f/report.json`.
- Nine-scene matrix: `scene-matrix-94f85724-73ca-4cc1-94c4-fa21adf6fa66/report.json` and 27 PNGs.
- Legacy parity/image isolation: `render-smoke-e4cf105c-b6c3-472a-b7ae-f012b5e1b005/report.json`.
- JSON-only 30s video/audio: `flexible-17225989-e0c1-46aa-aaaa-dce068f7527b/report.json` and `flexible-reel-30s.mp4`.
- Original 20s JSON: `flexible-4bca94d3-7681-4381-93fa-7d6dacd90afb/report.json`.

Build warnings remain for runtime font URLs, Remotion's module-level directive and bundle size. Optional missing V2 comparison-image URLs still log 404s when reading the old bundle; the captured baseline pixels match. The browser-independent clean-install proposal remains a separate design gate; the working historical browser fallback is retained. The course test uses local fixture video/audio to verify the workflow, not authored Revit lesson footage.

The production desktop launcher was restarted after confirming zero active render jobs. Closing its owner closed the private control pipe and the old server shut down gracefully. The replacement server at `http://127.0.0.1:4311` reports schema `2.1.0`, nine scene types and three output profiles. Restart evidence: `.studio/test-runs/phase4-work/live-restart.json`. No production project, shared asset, historical original or archive file appears in the source diff.

## Rollback

Keep every project, uploaded file, ZIP, history directory and archive. Returning to the earlier application requires reverting only this iteration's code/tooling changes and reinstalling the prior root lockfile. Old schema-1 template 1.0.0/1.1.0 and flexible schema-2.0 projects remain compatible with the previous application. Template 1.2.0 and schema-2.1 projects need this release to reopen; retain them or export a ZIP before switching versions. Their original source projects / previous JSON revisions remain recoverable. Do not coerce new data into an old schema or use destructive reset/deletion as rollback.
