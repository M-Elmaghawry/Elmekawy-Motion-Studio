# Independent browser provisioning proposal

Status: Phase 1 design, 2026-10-31 (Asia/Riyadh). No provisioning migration is implemented here.

## Verified dependency today

`scripts/seed-projects.ts` first seeds project resources and then checks this central executable:

```text
node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe
```

If absent, it copies the entire `chrome-headless-shell` directory from the same relative path inside `elmekawy-bim-reel-V2/node_modules/.remotion/`. Existing destination files are never overwritten by this copy. A partial destination can make the exclusive copy fail; the present existence check does not verify browser version or integrity. Both the engine and the C# launcher expect the central Windows x64 executable. Remotion is locked at `4.0.539`.

The historical payload exists in this checkout (EXE: 221,143,040 bytes). Preserve it and its fallback. A successful seed in this checkout proves only the historical fallback, not a fresh installation independent of V2. Media/fonts/prompts and the historical V2 export also still depend on V2 through `prepareResources()` and `seedProjects()`; independent browser provisioning alone will not remove every fresh-clone dependency.

## Proposed pinned contract

Introduce a reviewed `browser-runtime.lock.json` in a separate PR, with an exact Remotion version, browser product/build version, platform/architecture, official artifact URL, archive SHA-256, expanded file SHA-256 manifest, executable relative path, and license/source notes. The installed `@remotion/renderer@4.0.539/dist/browser/get-chrome-download-url.js` declares `TESTED_VERSION = '157.0.8080.0'` and selects `https://storage.googleapis.com/chrome-for-testing-public/157.0.8080.0/win64/chrome-headless-shell-win64.zip` for Windows headless shell. This is inspected downloader code, not proof that a fresh download succeeds or that the installed historical EXE has been checked against that archive. Do not use `latest`. Record independently verified checksums before publishing the lock; no checksum in this proposal is a placeholder that an installer may accept.

An explicit `browser:install` command would:

1. Validate the lock and platform before modifying files. Use official Chrome for Testing artifacts selected by the pinned renderer, or an operator-supplied offline archive with the same pinned hash.
2. Download to a unique staging directory outside protected originals. Apply size/time bounds, verify SHA-256, reject path traversal and links on extraction, and check every expanded file against the reviewed manifest.
3. Execute the staged browser with `--version` hidden; compare with the lock. Render a short local composition and verify decoding and dimensions.
4. Publish an immutable versioned runtime atomically. Retain an existing working runtime on any failure. Never merge a partial extraction over an installation.
5. Resolve that exact runtime in both Node and the C# launcher through one versioned runtime descriptor. Keep the current central path compatible during rollout. Record effective browser version/hash in render manifests.

Downloads occur only through the explicit installation command. Startup and rendering must remain offline and never download implicitly. Existing fallback remains read-only and available until the independent gate passes. This is browser runtime setup, with no image-generation provider or automation.

## Fresh Windows acceptance gate

Use a new temporary checkout on Windows x64 with Node 24+, no central browser/cache, and no historical browser directory available. Do not hide, rename or delete the real checkout's historical folders to simulate this test.

- Install dependencies from the root lockfile and install the pinned runtime.
- Exercise download and offline-archive paths, checksum mismatch, truncation, partial extraction, unavailable network, and retry without losing the previous runtime.
- Use explicit demo media fixtures independent of V2. The current media seed dependency must be addressed in its own reviewed change before claiming full `fresh clone + seed + render` independence.
- Run launcher preflight plus real V1/V2 smoke renders using the central pinned runtime. Verify metadata/audio and representative frames against the frozen baseline.
- Repeat launch/render offline. Confirm originals, archive and existing project revisions retain their hashes.

Only after the complete gate succeeds may a later PR retire the historical browser fallback. Preserve old runtime versions referenced by retained renders. Rollback selects the previous runtime descriptor; it does not change project data or overwrite historical payloads.
