# Running the local Studio

The owner approved implementation after reviewing Phase 1 and finding that the design preview did not use the original compositions. The working application now replaces that prototype at **http://127.0.0.1:4311/**.

Use Node 24 on Windows. From the repository root:

```powershell
npm.cmd ci --ignore-scripts
npm.cmd run seed
npm.cmd run build
npm.cmd start
```

This checkout is already installed, seeded and built. Normally only `npm.cmd start` is needed after stopping the running service. The seed command copies exact local media and the already-present Chrome runtime into the active workspace. It does not generate images, download a browser, or alter either original project. When cloning elsewhere, retrieve the existing V2 Git LFS browser payload before seeding.

Alternatively, double-click `Elmekawy-Motion-Studio.exe` in the repository root. This small Windows/.NET Framework launcher uses the existing Node 24 installation and prepared checkout, starts the server hidden, waits for its health check, and opens the default browser. It also verifies the data-store lock before reusing a running service. Keep the EXE alongside the project and use a Windows shortcut for desktop access.

When the launcher starts the server, its tray icon offers Open and Stop Studio (including any active render). Closing the browser keeps the server running. Stop uses a private stdin pipe and the server's graceful shutdown path, which persists render state and releases the store lock. A service started independently is reused and remains independently owned; the launcher does not stop it. Startup logs are local under `.studio/launcher/`.

Rebuild with `npm.cmd run launcher:build`; validate with `npm.cmd run launcher:verify`. The checks run the actual EXE without browser/tray UI, using isolated stores to verify startup, reuse, graceful stop, external ownership, busy-port errors and control-pipe closure. No application dependency was added.

## Clean Windows setup and reliability checks

On a new Windows x64 machine, use a full Git checkout with Git LFS payloads, Node 24+ and the Windows .NET Framework C# compiler. Run the setup commands above from the repository root, then `npm.cmd run launcher:build` and `npm.cmd run launcher:verify`. Keep the EXE in the repository root; its preflight checks dependencies, built UI, the shared catalog and the central browser. If an existing service owns a store, stop it through its owner before running a second writer.

The historical V2 browser EXE must contain actual bytes, not a Git LFS pointer. If seeding fails because the payload is absent, complete `git lfs pull` before retrying. Do not reinstall inside V1/V2, overwrite a partial central runtime, or delete historical files to repair it. The [independent browser provisioning plan](BROWSER_PROVISIONING_PLAN.md) describes the future pinned installer; it is not implemented or certified as a fresh-install path in this iteration.

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run format:check
npm.cmd run test:cli
npm.cmd test
npm.cmd run verify:render-smoke
npm.cmd run verify:legacy
```

`lint` and `format` have an explicit incremental scope covering new tooling/documents; they do not reformat preserved templates or unrelated existing application code. `typecheck` checks the full active TypeScript workspace. `npm.cmd run format` formats only its listed files. The render smoke command starts its own hidden backend in a new store, compares representative/transition PNGs for both legacy template versions with the original bundle, and encodes/decodes short V1/V2 H.264 clips with their expected audio behavior. It requires the historical bundle and seeded media/browser, and does not require a production server or production render jobs.

New launcher and render smoke reports are retained inside unique `.studio/test-runs/` directories. The old `.studio/qa/launcher-report.json` remains historical evidence. `npm.cmd run launcher:verify -- --help` is a read-only command that also works before the EXE/runtime is ready. Full EXE verification requires Windows x64 and reports an explicit failure elsewhere. A pass in an already hydrated checkout does not establish clean independent-browser installation. See [the current verification record](CURRENT_STATE_AND_GAPS.md) for actual results and the pre-existing legacy-inventory junction failure.

For development, stop the production service and run `npm.cmd run dev`. The UI uses `http://127.0.0.1:5173` and proxies the local API at port 4310. Only one backend may write a given project store at a time. No hosting, provider API, account, or image-generation integration is used.

## What is working

- React/Vite UI with the actual Remotion Player and original V1/V2 scenes, geometry, typography and animation logic.
- Exact local Cairo/Inter variable fonts and original project images/logo. V1 retains its original MP3 at volume 0.3; V2 remains silent.
- JSON-backed creation, editing, saving, reopening, and duplication of independent data/media projects.
- Every rendered text fragment has its own labeled editing field in template 1.1.0: 51 fields in V1 and 60 in V2, including conditional fallback text. Changes drive both live preview and the saved revision used for rendering. Save writes `projects/<id>/project.json`; history records preserve earlier revisions.
- Local PNG/JPEG/WebP upload, byte/type/decode validation, generated filenames, immutable replacement, and original paired comparison fallback behavior.
- User-written/manual prompts, copy-to-clipboard and persisted prompt editing.
- Real local H.264 MP4 jobs, progress, cancellation, saved input snapshots, manifests, FFprobe results and completed-file downloads.
- One active npm workspace/root lockfile, with Remotion packages aligned at 4.0.539 and React at 19.2.3.

The two original folders stay unchanged and outside the workspace globs. Their historical dependency trees are protected exceptions, not active per-project installations. The verified full backup is in `archive/2026-10-31T10-52-36-439Z-646266a9/`; all 20,244 original files were copied and hashed, including actual media and browser bytes. A restore sample was verified. Restore into a new directory rather than overwriting an original.

## Using the editor

Open either project, select a scene, and edit its exposed text fields. Preview updates immediately. **Save project** becomes enabled when there are changes. **Save and export MP4** saves those edits before starting a real render. A completed render has a **Download MP4** link in the Output tab.

Each heading line, small heading, caption, service label, counter, workflow label, and link has an independent field with an Arabic label and its original value. Persistent V2 header fields appear in a separate group for every scene. Conditional image/logo fallback captions have their own group. Stable scene-scoped IDs keep repeated words such as `BIM` independent. Text embedded in an uploaded image is part of that image and changes through asset replacement.

The two working projects were upgraded to template 1.1.0 at project revision 2, preserving saved text, media, timing and output settings. Their revision-1 JSON is retained in each project's `history/`. The original 1.0.0 templates and helpers remain available for old project data and render snapshots. New projects use 1.1.0. For another existing 1.0.0 project, stop the local server and run `node scripts/upgrade-text-editing.ts` before restarting it; the script preserves history and skips projects already upgraded.

The initial selection shows an image-bearing scene: V2 at frame 110, or V1 at frame 200. Playback and frame seeking are provided by Remotion Player. Opening the project again reloads persisted data. Pending text edits remain separate from a render already in progress; that render retains its frozen saved revision.

The old `docs/previews/elmekawy-studio-preview.html` and exported browser HTML are retained design references. They are not the live application. The old `node docs/previews/serve-preview.cjs` command now delegates to the working server. Refresh the actual local URL to leave a previously loaded prototype.

## Verification completed on 2026-10-31

- Production TypeScript/Vite build passed.
- Twelve meaningful tests passed, including lossless legacy text upgrades, unique labeled inputs for every editable field, Unicode saves, stale/concurrent updates, Windows traversal/junction protection, independent duplication, MIME/HEAD/ranges, verified manual upload, cancellation, and a real MP4 retaining its queued revision while a newer edit was saved.
- All 40 planned legacy boundary/representative PNG captures match the original bundle exactly: 23 V1 and 17 V2 frames.
- Full V1 export: 1080 x 1920, 30 fps, 900 video frames, 30-second video stream, original audio retained. AAC padding makes the container duration 30.016 seconds.
- Full V2 export: 1080 x 1920, 30 fps, 360 frames, 12 seconds, no audio. Output SHA-256 matches the original MP4 exactly: `cacd607c054cb02f81d1fa694c11cbdb161cce279c113a22a9073abe71241e6e`.
- Both complete video streams decoded successfully. FFprobe reports yuvj420p full-range output; requested settings and actual probe facts are retained separately.
- Template 1.1.0 pixel comparison report: `.studio/qa/parity-e43e9643-0646-4e65-894c-f0c619ae793b/report.json`. Both complete baseline exports also match their previously verified output hashes; V2 matches the historical original MP4.
- All 111 text bindings changed their rendered output independently, and the cross-scene repeated-word check passed (112/112). Report: `.studio/qa/text-fields-58bb9344-d1ea-474f-bcaa-989b1c47eea6/report.json`. All 22 frozen 1.0.0 source files and all 20,244 protected original files remain byte-for-byte unchanged.
- Automated interaction with the user's Firefox window stopped because the available Computer Use tool could not enforce browser URL policy for that Windows browser. No alternative UI-control path was used after that stop. Reload the page manually; API, render and frame-output verification continued independently.

Commands:

```powershell
npm.cmd test
npm.cmd run verify:legacy
node scripts/verify-parity.mjs
node scripts/verify-text-fields.mjs
```

Parity verification requires the local service and completed baseline renders. Text-field verification renders every field with an alternate value, checks a visible pixel change (including conditional fallbacks), and checks that a repeated word in another scene stays unchanged. Test data is isolated under `.studio/test-runs/` and is retained for diagnostics. The API never serves the archive, arbitrary repository files, or these test stores.

## Current scope

The separate flexible engine and 20-second JSON sample are available through `npm.cmd run render:flexible -- --validate-only` and `npm.cmd run render:flexible`; outputs and reports use new `.studio/test-runs/flexible-<UUID>/` directories. Phase 3 adds a flexible-only project wizard/editor and persisted `api/flexible` routes. It supports the three brand profiles, scene content/order/timing, image frame and zoom/position/fit controls, save/reopen/duplicate, image approval, and local H.264 export. Run `npm.cmd run test:editor` for isolated API tests and `npm.cmd run verify:editor` for the Windows x64 headless-browser workflow; the latter needs the built UI and seeded local browser. See [PHASE_2_IMPLEMENTATION.md](PHASE_2_IMPLEMENTATION.md) and [PHASE_3_IMPLEMENTATION.md](PHASE_3_IMPLEMENTATION.md).

The initial two templates keep their fixed portrait format, duration, FPS, safe margins and brand styling; the flexible editor does not migrate or change them. The absent V2 comparison images still use the original labeled schematics until both images are manually uploaded. Additional aspect ratios, custom font management, general video/audio upload and timelines, full project export/reimport, and the rest of the broader roadmap remain future increments.

The original historical V1 MP4 is absent from this checkout; the current V1 export is a new verified render. The original V2 video/review files are retained as a clearly labeled legacy import and remain untouched in the original folder and backup.
