# Incremental implementation roadmap

Status: Phase 1 complete when these five planning documents are reviewed. Every implementation task below is proposed and awaits user approval. Date: 2026-10-31 (Asia/Riyadh).

## 1. Delivery rules

Deliver small, reviewable increments. Each gate must preserve both originals, isolate application code from project data, and leave a usable rollback path. Do not combine a dependency upgrade, visual redesign, template generalization and workspace extraction into one change.

No external image generation API/integration, MCP workflow, browser automation, paid service, or automatic model-written prompts is in scope. Prompts are local text; image creation/download/upload is manual. Do not infer image or prompt model capabilities from tooling available to the development agent.

The preservation plan in [MIGRATION_PLAN.md](MIGRATION_PLAN.md) controls file operations. The architecture, schema and UI documents define the target behavior. Legacy instruction files are historical context; the current request authorizes planning only, so no implementation step is approved merely because this roadmap describes it.

## 2. Ordered milestones and acceptance criteria

| Milestone | Depends on | Deliverable / gate |
| --- | --- | --- |
| P0. Planning | Current inspection | Five docs; no structural changes |
| P1. Verified recovery checkpoint | User approval | Full verified archive and restore proof |
| P2. Active npm workspace | P1 | Root lock, package boundaries, aligned versions |
| P3. Single engine, frozen visual baseline | P2 | Both original composition IDs and source parity |
| P4. Data contracts and legacy imports | P3 | Valid data-only projects, immutable media/template versions |
| P5. Local API and safe files | P4 | Transactional create/save/duplicate/upload/serve |
| P6. Studio creation/editor and Player | P5 | End-to-end manual local creative workflow |
| P7. Queued local MP4 rendering | P5 + P6 | Saved-revision renders with manifests and recovery |
| P8. MVP cutover and offline acceptance | P1–P7 | Operator handoff and rollback drill |
| P9. Flexible template release | After MVP parity | Additional supported formats/timing without changing frozen templates |

These are dependency gates, not time estimates. Implementation should stop for review when a material visual difference or data-loss risk remains unresolved, not report a partial gate as complete.

### P0 — inspection and planning

Completed in this phase: inspect real structure, compare raw source/assets/config/locks, read compositions/helpers/QA, run existing read-only preservation verification, and define the five planning documents. Inventory records actual V1/V2 differences, tracked V2 dependencies/builds, current MP4 and the absent historical V1 MP4.

Acceptance: only `docs/ARCHITECTURE_V3.md`, `docs/MIGRATION_PLAN.md`, `docs/PROJECT_SCHEMA.md`, `docs/STUDIO_UI_SPEC.md`, and this file are added; original directories remain byte-identical. No root manifest, package install, scaffold, migration script, schema runtime, render, archive, or application code is created in Phase 1.

### P1 — inventory, archive and restore tooling

Tasks:

- Implement a read-only inventory command with path/link handling, source-relative file SHA-256 records, directory list, byte totals, Git revision/status, and LFS payload checks.
- Implement backup into a newly reserved archive snapshot with non-overlapping verified roots. Include complete originals and root README/checkpoint context. Never follow links or overwrite a prior snapshot.
- Verify destination independently, then verify source stability. Record copy/verification results and generate operator restore instructions.
- Implement an original-directory integrity guard for later gates and a restore sample into a new recovery location.

Acceptance:

- All 602 V1 and 19,642 V2 files from the inspected baseline, or an explicitly refreshed user-change baseline, are accounted for; no dependency, media or output exclusions.
- Actual MP4/font/image/browser bytes are recoverable; an LFS pointer cannot pass as the executable.
- Backup interruption produces an invalid/incomplete snapshot marker, never a false successful checkpoint.
- A recovery sample matches hashes without writing to originals. No original rename/move/delete occurs.

### P2 — root workspace and package boundaries

Tasks:

- Create private root manifest, exact `apps/*`/`packages/*` workspaces, root lock, shared TS/lint/format settings and unique private package names.
- Scaffold React/Vite studio and Fastify backend with an ESM Node build/dev strategy; select exact compatible versions and record the resolved dependency matrix.
- Create shared, components, templates and engine packages with browser/Node export boundaries. Add central scripts for dev, build, lint, typecheck, schema checks and meaningful integration/parity checks.
- Keep Remotion exactly `4.0.539` across direct packages, React `19.2.3`, and inherited motion/tooling versions initially. Add explicit Player/Renderer/Bundler declarations where imported.
- Add scoped ignores for new installs/caches/artifacts; do not untrack or rewrite legacy V2 contents/LFS policy. Record browser setup without initiating downloads in ordinary render routes.

Acceptance:

- A fresh root install/lock-based install produces the active application packages; no per-project install is needed.
- `npm.cmd` root scripts work on this Windows environment without changing PowerShell execution policy.
- Workspace names are unique; React/Remotion resolve consistently; browser bundle cannot import Node renderer/filesystem code.
- Legacy manifests/locks/dependency tree and all hashes remain unchanged. A standalone Remotion upgrade is not hidden in this task.

### P3 — source extraction with strict parity

Tasks:

- Extract V1's twelve shared baseline files once and V2's eleven additional source files into the proposed owners; register both IDs through one engine Root.
- Keep legacy-V1 and motion-study-V1 helper contracts distinct. Preserve all hardcoded defaults before parameterization.
- Centralize explicit CLI/API render settings; keep Rspack/JPEG behavior and supported premount behavior consistent. Use new unique output paths with overwrite disabled.
- Adapt legacy review tooling to write only to new QA/cache locations and produce fresh reference-vs-extracted comparisons. Keep the old build as protected evidence.

Acceptance:

- Composition discovery returns `ElmekawyBIMIntro` at 1080 x 1920 / 30 fps / 900 frames and `ElmekawyBIMIntroV2` at the same size/rate / 360 frames.
- Every sampled boundary/representative frame in the migration plan matches a fresh controlled reference; Arabic shaping/crops/layout receive visual review.
- V1 uses the existing logo-backed portrait and MP3 at 0.3; V2 is silent with the existing paired schematics, structural image, logo and global FocusDot.
- Nonsequential repeats are deterministic; no new wall-clock animation, unseeded randomness or uncontrolled GSAP timeline is introduced.
- All original/source/media/config hashes remain unchanged.

### P4 — schemas, immutable templates and data imports

Tasks:

- Implement Draft 7 JSON schemas and derived TS contracts for project, template, brand, scene, asset and render-job records, with shared definitions and strict validation.
- Add semantic checks for timing, capabilities, ID/reference uniqueness, paired media, font/brand roles, output settings and template compatibility. Keep trusted schema registry local.
- Extract exact content/defaults into immutable `bim-personal-intro@1.0.0` and `bim-motion-study@1.0.0`. Establish release integrity hashes for the complete visual dependency closure.
- Create immutable shared Cairo/Inter/OFL and Elmekawy logo/brand resources. Implement explicit managed-media URL resolution and the legacy key adapter.
- Implement idempotent trusted imports into new projects using staging, preserving actual scene/audio/logo behavior and prompt records. Retain V2 outputs/review evidence as a distinct legacy import; report absent V1 MP4 accurately.
- Freeze render project/resource snapshots and define source/lock checkpoints for reproducibility. Add unknown-schema read-only handling and pure future data-migration interfaces.

Acceptance:

- Both imported project files pass structural/semantic validation and round-trip without losing Arabic, provenance, exact timing, brand values or asset slots.
- New project folders contain only configuration/content, registered assets, prompts/reference documents, history and renders. No application source, `package.json`, npm lock or dependencies.
- Active projects can resolve/preview/render with original paths unavailable to the app. Missing V2 pair remains a fallback, not a false asset-presence claim.
- Parity suite passes again after content and URL refactoring. Unsupported format/FPS/duration is rejected rather than stretched automatically.
- Version/closure mismatch prevents exact reproduction; old project data does not silently follow new template defaults.

### P5 — local backend and safe storage

Tasks:

- Implement the API table in [ARCHITECTURE_V3.md](ARCHITECTURE_V3.md): health/templates/brands/projects, safe create/get/save/duplicate, validation/resolve, streaming upload/retire and allowlisted media routes.
- Implement containment validation, Windows reserved/path/UNC/ADS checks, realpath/reparse protection, single-writer/project locks, exclusive IDs and staged creation.
- Implement ETags/If-Match, atomic JSON replacement/history, idempotent create, crash recovery, disk-full handling and clear structured errors.
- Add immutable media, verified MIME/magic/decode/probe/font metadata, streaming limits, partial-upload cleanup/quarantine, GET/HEAD/range support and hash-based cache keys.
- Bind loopback, validate Host/origin, constrain mutation access, prevent remote media fetch/executable content, and deny originals/archive from the service path registry.
- Support saved descriptor resolution plus validated unsaved editable drafts for Player without filesystem mutation; prevent arbitrary paths/URLs in either mode.

Acceptance:

- Concurrent same-name creates produce separate safe IDs; retried idempotent requests do not create duplicates.
- Traversal, percent-encoded/double-encoded separators, Windows drive/UNC/device/ADS/reserved-name cases and junction escapes cannot read/write outside managed roots.
- Interrupted writes/uploads leave a valid old/new document, never truncated JSON or an assigned partial file. Two simultaneous stale saves cannot overwrite one another.
- Oversized/mismatched/corrupt media is rejected with the correct error class; malicious filename text never becomes a disk path or shell argument.
- Duplicate project content/media is independently editable; shared assets remain immutable references; app code/dependencies/renders do not get cloned.
- Media GET and HEAD report consistent verified type; audio/video range requests work in Player and the headless browser.
- Unexpected browser origins/hosts cannot mutate projects. A request for archive/source files is denied even when it contains a valid-looking ID.

### P6 — frontend creation, editor, prompts and Player

Tasks:

- Implement project list/search/duplicate, installed-template panel, the seven-step wizard, review and staged file-upload feedback.
- Implement brief/brand/scenes/assets/prompts/preview/exports tabs with typed API access, validation pointers, retained unsaved text and revision conflict handling.
- Add Arabic-friendly fields, explicit Latin spans, template-supported direction controls, registered local fonts/logo selection and clear fixed-format controls.
- Implement local prompt text templates/edit/copy/manual-upload association with no model/provider connection.
- Mount Player from the shared engine client, resolve unsaved content with debounce/cancellation, wait for fonts, show safe-area overlay and scene markers.

Acceptance:

- A user creates a complete project through the UI with the requested brief/format/brand/script/media/output fields and receives a data-only project folder automatically.
- Failed upload does not erase the committed draft or falsely label local files saved; retry/binding recovery works.
- Text edits update a clearly labeled Unsaved preview without MP4 rendering; save produces a revision/ETag and restores Saved status.
- Preview and export use the same component and resolver. A stale request cannot replace a newer preview or save.
- The manual prompt flow is complete using only stored/user-written text and user-selected files. No hidden HTTP generation call exists.
- Initial V1/V2 defaults pass visual review in the actual Player as well as reference renders. Keyboard navigation, Arabic input and load/error states work.

### P7 — render worker, queue and durable outputs

Tasks:

- Implement saved-revision preflight/queue endpoints, one worker process, persistent job states, progress polling, cancellation and restart interruption handling.
- Cache code bundles by engine/template closure/lock/bundler-options hash; keep project media outside code bundles. Pass identical resolved props into metadata selection and rendering.
- Validate and freeze media/JSON before enqueue; record exact template, engine, lock, resource and environment details for each job.
- Render H.264 to a unique job-local partial file using an already installed local browser/runtime. Probe/decode as appropriate, publish final MP4 only after validation, and provide scoped download.
- Keep completed and imported legacy outputs immutable. Retry is a new job; do not resume uncertain partial files or overwrite old renders.

Acceptance:

- Actual local MP4 outputs verify 900 frames / 30 seconds for V1 and 360 frames / 12 seconds for V2, both 1080 x 1920 at 30 fps, with expected audio presence/absence.
- Representative encoded frames match the correct saved preview composition within documented encoding effects; JSON/template/resource metadata is traceable.
- Edit project during render: the queued job still produces its original revision, and the next job can use the new revision.
- Missing runtime, full disk, corrupt media, worker crash, cancellation and server restart produce accurate recoverable states without a completed partial output.
- Render API remains responsive during encoding; media routes stay available until the worker finishes. Repeated renders reuse a valid code bundle.
- No unexpected network fetch occurs during a prepared offline render; no image-generation integration exists.

### P8 — complete MVP acceptance and operator cutover

Tasks:

- Run the end-to-end scenarios below on Windows against a copied test project store, then inspect imported originals and fresh projects manually.
- Verify original directory manifests and archive restore samples again. Document start/stop, browser provisioning, storage locations, schema errors, backups and failed-job recovery.
- Perform a rollback drill by stopping the new app and opening both original composition IDs through a verified V2 recovery copy outside the protected directories. Legacy tool caches must not alter originals/archive. Do not reinstall inside V1.
- Change launch guidance to root application scripts after acceptance; retain original paths and archive without cleanup.

Acceptance: all P1–P7 gates pass, offline create/preview/render works, visual defaults are approved, operators can restore/revert safely, and no remaining required task is disguised as completed. Source/control/Git cleanup of old dependencies is separately scoped future work requiring its own review.

### P9 — future flexible template, independent of preserved baselines

Tasks: publish a separate `bim-storyboard@1.0.0` template with responsive composition layouts, declared scene-duration editing, supported 9:16/16:9/1:1/4:5 presets, chosen resolutions/FPS, explicit audio/video slots and tested RTL/LTR content variants. Convert time-based motion only inside that new template, preserving layout/text safe areas per format. Extend UI controls only from its capability manifest.

Acceptance: supported formats have actual visual/audio/frame-seek tests and metadata validation; duration sums remain exact; changing the new template cannot alter either preserved legacy template/project. Do not call arbitrary aspect ratios or translations supported until they pass this gate. No expansion introduces image/prompt-generation integrations implicitly.

## 3. Verification strategy

Use meaningful tests at the boundaries where corruption or divergence is possible. Avoid tests that merely restate a constant or duplicate schema implementation. Use temporary managed test roots, never originals.

| Area | Required evidence |
| --- | --- |
| Preservation | Full original manifest verification after each migration gate; known baseline script remains passing |
| Dependency/imports | Root lock install/build/typecheck/lint, aligned Remotion records, one React runtime, no Node modules in browser graph |
| Schema/semantic validation | Both real imports; invalid fields/types/references/timing/format; schema-version compatibility; no mutation/coercion |
| Filesystem transactions | Real Windows containment, concurrent saves/creates, stale ETags, failed upload, disk/file-lock faults and interrupted commit recovery |
| Media | MIME/magic/decode/probe, oversized/truncated files, immutable replacement, font readiness, HEAD/GET and ranges |
| Visual preservation | Controlled fresh-reference PNG/pixel comparisons, boundary frames, nonsequential repeats, Arabic/crop review, legacy audio |
| Player/render parity | Shared descriptor/metadata; actual preview asset loads; completed MP4 probe/decode and representative encoded frames |
| Local lifecycle | Worker failure/cancel/restart, saved revision freezing, offline prepared operation, no remote media/API calls |
| Recovery | Independent archive verification, recovery sample, switch back to original V2 environment without overwriting data |

Pin the environment for strict pixel comparisons. Historical stored PNG hashes are supporting evidence and may differ with a changed browser/OS/renderer. A mismatch requires diagnosis and recorded approval of any intentional later change; it cannot be waived as “probably equivalent.” MP4 hashes measure artifact identity, not whether an intentional new encoding preset looks the same.

## 4. End-to-end MVP scenarios

1. Create two projects with the same Arabic display name. Both have unique safe folders, complete validated JSON and no copied source/dependencies.
2. Import and preview original V1 and V2 defaults. Confirm exact metadata, V1 logo/audio behavior, V2 silent schematic-pair behavior and original files unchanged.
3. Edit content, preview unsaved changes, save, enqueue, edit again, then download a verified MP4 for the frozen queued revision.
4. Write/copy a manual prompt, upload generated media manually, assign it, and verify no external generation/model request occurred.
5. Upload one comparison image, then both; verify pair behavior and explanatory labels. Exercise image/font decode failure separately.
6. Duplicate a project, edit its copy, and verify original content and media are independent while template/shared resources remain referenced.
7. Attempt traversal/UNC/ADS/junction access, oversized fake PNG/MP4, stale save and unsupported FPS; preserve the last valid project in every case.
8. Cancel a render, kill a worker, restart the server and simulate a failed write. Inspect correct states and retry without losing completed outputs.
9. Disconnect the network after setup. Create, upload, preview, render and download locally using installed assets/fonts/browser.
10. Verify the archive and originals, stop the new service and open both compositions in a verified working recovery copy of V2 as the rollback drill.

## 5. MVP scope and remaining decisions

The first usable MVP includes centralized workspaces/engine, two frozen templates and migrated projects, safe project creation/edit/duplication, manual prompts/media, Player preview, local H.264 render queue/history, reproducibility records and recovery. It deliberately starts with the actual supported portrait formats; P9 adds general duration/aspect/resolution/FPS flexibility.

Routine choices can be resolved during approved implementation: exact new tooling/plugin versions, UI styling, tested Windows atomic-write strategy and local worker concurrency tuning. Do not present those as already verified. Before cutover, record an approved dependency matrix, a verified browser setup, the visual parity report and the backup/restore report. The default architectural choices are JSON storage, Ajv 8 Draft 7, one render worker, loopback-only serving, immutable template/media versions and no automatic asset garbage collection.

Do not begin P1 or change the repository structure until the user approves implementation. Phase 1 ends with the five documents and a findings summary.
