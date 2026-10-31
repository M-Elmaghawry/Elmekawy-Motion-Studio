# Safe migration and rollback plan

Status: planning only. Inspected 2026-10-31 (Asia/Riyadh). No migration step below has been executed, except the stated read-only inspection checks.

## 1. Preservation boundary

`elmekawy-bim-reel/` and `elmekawy-bim-reel-V2/` remain at their current paths, unchanged. Do not rename, move, overwrite, delete, reinstall inside, rewrite their Git rules, remove tracked dependencies, or replace their renders. The application must never write into either directory or into archive snapshots.

The root `README.md` describes an earlier product scope, including assumptions about automatic prompt writing. Preserve that file during the initial migration. The current approved requirement takes precedence: a local UI is now planned, and prompts are stored/edited/copied manually; no connected image or prompt generation is assumed.

Archive copies are safety snapshots, not active projects. It is intentional that they retain historical code, installed dependencies, and generated files. Newly created `projects/<id>/` folders are data-only.

## 2. Inspection evidence and initial checkpoint

Observed Git HEAD: `e6b7e82f6a06eb7524af9ab24d0625de93842746`. The worktree was clean before the five planning documents were created. Recheck status before implementation; preserve any subsequent user changes in the migration inventory.

| Item | Read-only result |
| --- | --- |
| Original V1 vs recorded snapshot | 28 files matched |
| Copied V2 baseline vs recorded snapshot | 27 files matched, with documented Root/README exceptions |
| V1 registration inside V2 | Identical registration |
| Source comparison | 12 identical source files, one changed Root, 11 V2 additions |
| Public comparison | Nine identical files, 15,608,167 bytes per project |
| Lockfile | Both identical; SHA-256 `18bed84325415fcd6771141d30b5a0510c03fa6b0f50a30707f7c4c80916434f` |
| Existing V2 MP4 | SHA-256 `cacd607c054cb02f81d1fa694c11cbdb161cce279c113a22a9073abe71241e6e` |

Full-directory integrity was also recorded, including hidden resources, installed dependencies, builds and outputs:

| Directory | Files | Bytes | Aggregate SHA-256 |
| --- | --- | --- | --- |
| `elmekawy-bim-reel` | 602 | 20,670,736 | `cd257ba7e99e5a9d8e56c949633d7ddbaa9ee1a7411c250d1fa25a7a8ae80e0e` |
| `elmekawy-bim-reel-V2` | 19,642 | 702,602,232 | `782ca31a6a68a890d73fd6eb8d5dfda11ad137ef57325950c7af0793cf6e64a3` |

Aggregate algorithm used here: recurse entries sorted per directory with JavaScript `localeCompare(name, 'en')`; for every regular file hash raw bytes and append `relative/posix/path + NUL + decimalByteLength + NUL + lowercaseSHA256 + LF` to a SHA-256 stream. Empty directories and file metadata are not covered by this aggregate. A migration backup additionally needs per-file records, directory inventory, timestamps where relevant, and link/reparse-point inventory. Do not use this aggregate alone as a restore manifest.

The read-only command run successfully in V2 was `node scripts/verify-baseline.mjs`. The stored QA images, render report and FFprobe JSON were inspected as files; rendering, linting, bundling, probing and UI playback were not rerun for this documentation phase.

## 3. Backup before scaffolding

1. Stop legacy preview/render processes, or confirm a stable no-writer window. Inventory untracked/ignored files as well as tracked files. Resolve the absolute source/destination paths and confirm a new archive snapshot lies inside the intended `archive/` root and outside both originals. Reject path overlap and junctions before copying.
2. Check available disk space. The originals currently total 723,272,968 bytes before root README/Git metadata. Reserve space for a full copy, verification, new dependencies, builds, and at least one render; do not assume a Git commit alone is a media backup.
3. Create a unique `archive/<timestamp>-<random>/` directory with exclusive creation. Never reuse or overwrite a snapshot. Copy the complete originals, including `.agents`, `.claude`, V2 installed dependencies/browser, `build/`, `out/`, prompts, fonts/licenses, scripts and hidden configuration. Do not follow links; inventory them and stop for explicit handling if discovered.
4. Also preserve the root README and a Git checkpoint: current commit, status, tracked-file inventory, relevant attribute rules, and a local Git bundle/checkpoint where available. Git LFS pointers alone are insufficient: verify that the actual Chrome binary bytes are present in the filesystem copy. Avoid history rewriting and avoid uploading this backup to any service.
5. Write `manifest.json` with source-relative paths, byte counts, SHA-256 values, directory records, original absolute root for operator context, snapshot time, Git revision and copy-tool results. Write `RESTORE.md` with the exact source/destination mapping and commands appropriate to Windows. Treat archive path metadata as private local data; do not expose it over HTTP.
6. Independently hash every destination file and compare file counts/paths/bytes/hashes with the source manifest. Verify the MP4, both locks and browser binary explicitly. Rehash sources to detect concurrent writes. An incomplete copy, mismatched file, unresolved LFS pointer or changing source blocks migration.
7. Record `verification.json`, make the snapshot application-read-only by policy, and optionally apply tested read-only filesystem permissions. Read-only attributes are only an aid, not a security guarantee. Preserve one independent offline copy if available; an on-disk archive does not protect against drive loss.
8. Prove restore before continuing: restore representative source, font, image, MP4 and browser records to a new disposable recovery location and compare hashes. Do not test by restoring over an original.

No deletion or recursive move is required. Future tools must verify resolved absolute targets before any cleanup. Copy commands must treat nonzero/failure codes correctly, including Windows copy-tool conventions; do not report a successful backup from process exit alone.

## 4. Build the active workspace alongside the originals

### Gate A: npm workspace scaffold

Create only new `apps/`, `packages/`, root tooling and root lockfile after approval. Root workspace globs are exactly `apps/*` and `packages/*`. Neither originals, `projects/`, archive, nor shared media are npm workspaces.

Keep Remotion `4.0.539`, React `19.2.3`, and current motion behavior. Declare Player, Renderer and Bundler directly where imported instead of relying on the old CLI's transitives. Align all direct Remotion packages exactly; review the new root lock against both legacy locks. Select/pin compatible new frontend/server tooling deliberately. Root install must never traverse and alter either legacy dependency tree.

Create root ignores scoped to new workspace caches, dependency installations and new render artifacts. Do not use `git rm --cached`, rewrite LFS rules, or remove existing tracked V2 files. The active root lockfile is new; legacy locks remain intact for recovery.

Acceptance: new empty packages build/typecheck; imports resolve through npm links; one active React/Remotion set is verified; complete-original hashes match the checkpoint; legacy preservation script still passes. Dependency downloads/setup may require network access during installation, but normal application use does not.

### Gate B: source extraction and unchanged rendering

Copy the V1 source baseline once into the proposed template and component packages, then add the V2 modules from V2. Keep both composition IDs registered from one engine Root. First preserve logic, coordinates, CSS, copy, fonts, easing, spring constants, audio and sequence order. Change import paths/package boundaries only. Use a temporary fixture public directory outside projects if needed to reproduce original `staticFile` layout during this gate.

| Current source | New owner |
| --- | --- |
| V1 `src/index.ts`, registration in both `Root.tsx` | `packages/motion-engine/src/index.ts` and `src/Root.tsx` |
| V1 `Composition.tsx`, `scenes/*`, scene data | `packages/templates/src/bim-personal-intro/1.0.0/` |
| V1 `components/Motion.tsx` | `motion-components/src/legacy-v1/` |
| Existing local `Fonts.tsx` | Versioned-compatible font loader; later explicit local URL interface |
| Shared theme | Plain frozen theme snapshot in shared; exact project brand defaults |
| V2 `motion/*`, five motion components | `motion-components/src/motion-study-v1/` |
| V2 `src/v2/*` | `templates/src/bim-motion-study/1.0.0/` |
| Legacy Remotion config | Explicit centralized engine options and CLI adapter; originals unchanged |

Do not merge superficially similar V1/V2 animation helpers: their springs, easing, timings and frame endpoints differ. Keep FocusDot global, outside scene sequences. Do not replace V1 overlaps with generic sequential cuts or reduce total duration by subtracting transitions twice.

Establish a reproducible legacy reference using the existing local bundle/runtime or a disposable source copy, never writing into protected folders. Existing scripts write outputs into V2 and therefore are references to adapt for new QA locations, not commands to rerun blindly. Keep the original V2 bundle as historical evidence; it can be stale relative to source and must be checked before use as a reference.

Parity gate: compare freshly rendered source references with the extracted engine under the same browser, fonts, renderer versions, metadata and PNG settings. Check at least:

| Composition | Required sampled frames |
| --- | --- |
| V1 | 0, 45, 119, 120, 131, 132, 269, 270, 281, 282, 449, 450, 461, 462, 629, 630, 641, 642, 779, 780, 791, 792, 899 |
| V2 | 0, 45, 59, 60, 110, 134, 135, 165, 200, 224, 225, 245, 285, 299, 300, 345, 359 |

Capture repeated nonsequential frames (45, 110, 200, 345 for V2), first/last frames, paired placeholder cases and missing structural/logo behavior. Compare raw pixel buffers or lossless PNG hashes in a controlled environment; inspect differences rather than broadly accepting a percentage threshold. Historical V2 PNG hashes help diagnose drift but are not cross-environment guarantees. Human review covers Arabic shaping, direction isolation, safe areas, crops, typography and visual continuity.

V1 audio must remain present at volume 0.3. Verify waveform/track behavior against a fresh source reference; historical “silent” documentation is not authoritative. V2 remains silent. A newly standardized H.264/yuv420p export preset may encode differently from the historical V2 yuvj420p file; label it as a new output preset, retain the old MP4, and do not use MP4 byte equality as the only visual gate.

### Gate C: data extraction and managed media

Only after source parity, replace embedded project content with exact defaults and schema-backed project data. Extract text/layout controls narrowly; preserve defaults byte-for-byte where text matters. Add the legacy path-to-asset adapter for explicit media URLs, including V1 audio and both fonts. Repeat the full parity gate after URL and data changes.

Publish immutable `bim-personal-intro@1.0.0` and `bim-motion-study@1.0.0` manifests once code/defaults/visual dependency hashes are stable. Both keep their original fixed metadata. Do not advertise arbitrary FPS, duration or landscape support until a separate version is built and validated.

Create two new data projects through an allowlisted migration service/tool:

| Data import | Include |
| --- | --- |
| V1 baseline project | Exact script/scene defaults, three generated visuals, MP3 with its unknown-license note, shared logo as the legacy portrait slot, shared Cairo/Inter references |
| V2 motion study project | Exact five scenes, structural visual, shared logo/fonts, missing before/after records and manual prompt document; no unused infrastructure/technology images or inherited MP3 |

Shared font directories retain exact TTF/OFL bytes. Brand preset retains exact logo and palette. Generated visuals belong to the imported projects; the structural PNG may be copied into both independent project folders. Content duplication is acceptable here; dependencies and executable code are never duplicated into projects. A content-addressed media store is a future option, not an MVP prerequisite.

Copy original V2 `out/` outputs/review evidence to a clearly named imported legacy render record, preserving every byte and recording provenance. Do not represent that record as a new render against the new project revision. Leave all original outputs where they are. V1's historical MP4 is absent here: record it as unavailable and allow later manual import from an actual backup. Do not fabricate it from historical file size or claim it was preserved locally.

Migration writes new projects via staging and commit, with generated IDs and an import map from original path to project ID. Rerunning against the same checkpoint is idempotent: return the prior import or create an explicit new import, never overwrite. Preserve original manuals with their historical paths; new UI guidance shows current upload slots and does not instruct users to edit protected originals.

Acceptance: schema validation passes; both projects render from their own manifest/shared assets with the originals inaccessible to the active app; no source/dependencies/unrelated media in either new project; descriptor and renderer metadata agree; all legacy hashes still match.

### Gate D: local application and cutover

Implement backend transactions, safe upload/media routes, Player screens and queued rendering incrementally as specified in the other documents. Work only against new project IDs. Test on Windows and offline after setup, with the browser binary already provisioned. First compare preview and render against the frozen source references; then test deliberate project edits.

Cutover changes operator launch commands to the new root scripts. No legacy move or deletion occurs. Keep both originals and the verified archive as recovery material indefinitely unless the user separately authorizes a future retention policy.

## 5. Rollback by failure stage

| Failure point | Safe response |
| --- | --- |
| Backup incomplete | Stop before any scaffold; retain partial snapshot marked invalid and create a new destination on retry |
| Workspace install/build fails | Stop new processes; preserve diagnostics; leave new paths isolated; run a verified recovery copy of V2 for both legacy composition IDs |
| Extracted visuals/audio differ | Do not publish template 1.0.0; revert new-package edits using the checkpoint, inspect source-vs-output differences; originals remain operational |
| Project import fails | Leave originals untouched; quarantine only the known new staging/import transaction; retry idempotently |
| API write/upload interrupted | Recover prior valid JSON/revision, quarantine unreferenced staged files; do not repair by deleting a whole project |
| Render fails/cancels | Keep diagnostics and mark job failed/cancelled/interrupted; retry as a new job; no overwrite of completed outputs |
| New UI/service regresses after cutover | Stop it, launch `npm.cmd run dev` in a verified recovery copy of V2; choose `ElmekawyBIMIntro` or `ElmekawyBIMIntroV2`; preserve newer data projects |
| Original corruption is detected | Stop writes, compare backup manifest, restore into a new recovery directory and verify there; never automatically overwrite an existing original |

V1 currently has no installed dependencies. Do not run `npm install` in V1 for rollback. V2 includes V1's unchanged composition and its installed environment. Restore a verified working copy to a new `.studio/recovery/<id>/` location and run it there, outside originals, archive snapshots and project folders. This lets legacy tools write their caches without altering the protected source or backup. Verify the recovery copy before launch and retain any damaged source for diagnosis.

Git rollback is limited to new application files and explicitly reviewed root changes. Do not use whole-repository `reset --hard`, recursive deletion, clean commands, or history rewrites. Never roll project data back merely to match older application code; use schema-compatible read mode or a copied recovery workspace. Preserve new renders and drafts even if application code is reverted.

## 6. Completion checklist

- Full archive copy independently verified, with actual LFS binary bytes and a successful recovery sample.
- Both legacy directory inventories and all per-file hashes unchanged after each gate.
- One active workspace install/root lock, aligned Remotion, unique package names and no duplicate React runtime.
- Both original composition IDs, exact metadata, timeline semantics, audio and placeholder behavior preserved.
- Independent project manifests and media, frozen template references, shared exact fonts/logo and retained font licenses.
- Preview and local render can load the same media offline; no original-path dependency remains.
- Project duplication copies data/media only, leaves shared immutable assets referenced, and omits dependencies/renders by default.
- Existing output files retained; missing V1 historical render reported honestly.
- Operator has launch, failure recovery and rollback instructions; cutover is reversible without touching originals.

Do not start Gate A until the user approves implementation after reviewing this Phase 1 plan.
