# Elmekawy Motion Studio V3 architecture

Status: Phase 1 proposal; implementation requires approval. Inspected 2026-10-31 (Asia/Riyadh).

Only the five planning documents are created in this phase. No application, dependency, legacy source, asset, configuration, or render changes are authorized by this document.

## 1. Findings from this workspace

The workspace currently has `README.md`, `elmekawy-bim-reel/` (V1), and `elmekawy-bim-reel-V2/` (V2). There is no root package manifest, workspace lockfile, server, Vite app, data-only project store, or archive. No `AGENTS.md` was found in the workspace or checked ancestor directories.

| Observed item | V1 | V2 |
| --- | --- | --- |
| Source | 13 files / 19,336 bytes | 24 files / 41,169 bytes |
| Public media/fonts/licenses | 9 files / 15,608,167 bytes | Same nine files, byte-identical |
| Installed dependencies | No `node_modules/` present | 18,927 files / 598,345,748 bytes |
| Generated bundle | Absent | `build/`: 61 files / 50,164,390 bytes |
| Outputs/review evidence | No `out/` present | `out/`: 29 files / 33,356,960 bytes |
| Complete directory, including hidden files | 602 files / 20,670,736 bytes | 19,642 files / 702,602,232 bytes |

Both folders contain matching `.agents/` and `.claude/` trees, each 285 files / 2,418,362 bytes per folder. These are development resources, not runtime project content. Counts describe the inspected checkout, not assumptions about earlier machines.

### Dependencies and configuration

The two `package.json` files and two lockfiles are byte-identical. Both packages are named `elmekawy-bim-reel`, version `1.0.0`; this name collision must not become two active workspace packages. Each lockfile is lockfileVersion 3 with 396 package records, including the root record.

| Package | Declared/locked baseline |
| --- | --- |
| `remotion`, `@remotion/cli`, `@remotion/gsap` | Exact `4.0.539` |
| `@remotion/eslint-config-flat` | Exact `4.0.539` |
| `@remotion/player`, `@remotion/renderer`, `@remotion/bundler` | Already transitively locked at `4.0.539`; not direct dependencies |
| `react`, `react-dom` | Exact `19.2.3` |
| `gsap` | Declared `^3.15.0`, locked `3.15.0` |
| TypeScript / ESLint / Prettier | `5.9.3` / `10.12.0` / `3.8.1` |
| React types / web types | `19.2.7` / `0.0.166` |

All Remotion records in the lockfile align at `4.0.539`. Fastify and Vite are absent. Transitive Ajv `6.15.0` is present; it is not a suitable implicit dependency for the proposed shared Ajv 8 validation layer. Source searches found no GSAP imports or timelines; installed GSAP is currently unused by these compositions. Keep it during parity work and consider removal separately.

Matching files include `remotion.config.ts`, `tsconfig.json`, ESLint config, Prettier config, `skills-lock.json`, and `docs/production-log.md`. Remotion configuration selects Rspack, JPEG frame capture, overwrite enabled, and two seconds default premount. The Node API does not automatically consume this CLI configuration. The new render service must translate intended settings explicitly; new outputs must use unique paths and `overwrite: false`.

Node observed here: `v24.19.0`; npm via `npm.cmd`: `11.17.0`. Plain `npm` resolves to a PowerShell script blocked by the local execution policy. Use `npm.cmd`/`npx.cmd` in Windows runbooks without changing that policy.

### Source duplication and differences

Twelve of V1's thirteen source files are byte-identical in V2: composition, data, theme, fonts, motion helpers, entry point, and all six scenes. Only `src/Root.tsx` differs among corresponding source files. V2 adds eleven files: five motion components, motion tokens/presets, and four `src/v2/` modules.

| Contract | V1 / copied baseline in V2 | V2 addition |
| --- | --- | --- |
| Composition ID | `ElmekawyBIMIntro` | `ElmekawyBIMIntroV2` |
| Format | 1080 x 1920, 30 fps, 900 frames / 30 s | 1080 x 1920, 30 fps, 360 frames / 12 s |
| Scene starts | 0, 120, 270, 450, 630, 780 | 0, 60, 135, 225, 300 |
| Nominal scene durations | 120, 150, 180, 180, 150, 120 | 60, 75, 90, 75, 60 |
| Transitions | First five outgoing sequences extend 12 frames; incoming opacity ramp | Cuts with persistent background/frame/FocusDot; local comparison wipe |
| Audio | `assets/audio/bim-reel.mp3`, volume 0.3 | No audio |
| Asset behavior | Three generated visuals; `portrait` actually maps to `assets/logos/ME-Logo.png` | Structural visual + logo; comparison images both absent |
| Typography/motion | Cairo/Inter; line reveals, blueprint, cards, camera push | RTL word reveal, layered parallax, network, comparison, workflow navigator, global FocusDot |

V1 metadata resolves the existing logo as available even though default props say `portrait: false`. Preserve resolved behavior and the raw default props separately. V2 uses the comparison images only when both are available; otherwise both sides are labeled schematics. Missing/decode-error fallbacks and Arabic illustrative disclaimers are part of the visual contract.

V2 timing is duplicated between `src/v2/data.ts` and explicit sequences in `src/v2/Composition.tsx`; the new template owns one canonical timeline. Many text strings, layouts, coordinates, and frame endpoints remain embedded in TSX. Neither project is presently a generic JSON-driven template. Both assume fixed portrait dimensions and 30 fps.

All nine public files are identical: three generated PNGs, logo PNG, MP3, Cairo/Inter TTF files and their two OFL licenses. These are 15,608,167 duplicated bytes across the two public trees. V2 `build/public/` includes another generated copy; build artifacts are not a source of truth. Generated visuals remain project media; fonts and approved logo/brand assets become immutable shared resources.

The existing V1 README/production log describe silence and an absent portrait, but actual current code includes audio and uses the logo. The V1 MP4 mentioned in the historical log is absent from this checkout; do not invent or replace it. V2's current MP4 exists, is 2,473,057 bytes, and hashes to `cacd607c054cb02f81d1fa694c11cbdb161cce279c113a22a9073abe71241e6e`. Stored FFprobe JSON reports H.264, 360 frames, 12 seconds, and no audio; this phase did not rerun a video probe or render.

V2 deliberately tracks its dependency tree, build and outputs, including a Chrome executable using Git LFS. This is recorded in `docs/V2_FULL_UPLOAD.md` and is confirmed by 18,927 tracked `node_modules` files. Do not untrack, purge history, or modify these legacy policies as part of installing the new workspace.

The existing read-only preservation script was run and passed: 28 original V1 files, 27 copied baseline files, identical V1 registration. Stored render QA is historical evidence, not a new V3 parity result.

## 2. Exact target layout

```text
Elmekawy-Motion-Studio/
  package.json                         # private root; apps/* and packages/* only
  package-lock.json                    # only active workspace lockfile
  tsconfig.base.json
  eslint.config.mjs
  .gitignore                           # new paths only; no legacy cleanup
  apps/
    studio/                            # @elmekawy/studio
      package.json
      vite.config.ts
      index.html
      src/{app,api,features,components}/
    server/                            # @elmekawy/server
      package.json
      tsconfig.json
      src/
        index.ts
        config.ts
        routes/
        services/{projects,uploads,media,renders,templates}/
        storage/{safe-path,atomic-json,locks,recovery}.ts
        workers/render-worker.ts
  packages/
    shared/                            # @elmekawy/shared; browser-safe
      package.json
      src/{types,validation,themes,utils}/
      schemas/v1/{project,template,brand,scene,asset,render-job}.schema.json
      schemas/v1/definitions.schema.json
    motion-components/                 # @elmekawy/motion-components
      package.json
      src/
        legacy-v1/                     # frozen compatible helpers
        motion-study-v1/                # frozen V2 components/tokens/presets
        common/{fonts,media}/           # explicit URL/media/font interfaces
    templates/                         # @elmekawy/templates
      package.json
      src/registry.ts                  # trusted explicit imports, no path eval
      src/bim-personal-intro/1.0.0/
        {template.json,defaults.json,Composition.tsx,scenes/}
      src/bim-motion-study/1.0.0/
        {template.json,defaults.json,Composition.tsx,Scenes.tsx,Visuals.tsx}
    motion-engine/                     # @elmekawy/motion-engine
      package.json
      remotion.config.ts               # CLI adapter over central options
      src/
        index.ts                       # registerRoot entry
        Root.tsx                       # keeps both original composition IDs
        client.ts                      # browser exports only
        resolve.ts                     # pure project -> composition props
        server.ts                      # Node-only bundle/render exports
        render-options.ts              # explicit API options
  projects/
    <safe-project-id>/
      project.json                     # canonical editable document
      assets/{images,video,audio,logos,fonts,references}/
      prompts/                         # imported manuals + optional exports
      renders/<job-id>/                # MP4, snapshot, manifest, probe, logs
      history/                         # prior JSON revisions
  shared-assets/
    fonts/{cairo,inter}/1.0.0/           # exact bytes + OFL + hash metadata
    brands/elmekawy-bim/1.0.0/           # logo + brand.json
  archive/<snapshot-id>/
    {manifest.json,RESTORE.md,verification.json}
    originals/{elmekawy-bim-reel,elmekawy-bim-reel-V2}/
  scripts/                             # future inventory/parity/migration tools
  docs/                                # these planning documents
  .studio/                             # ignored local runtime state
    {cache,jobs,staging,locks,logs,recovery}/
  elmekawy-bim-reel/                    # protected original, stays in place
  elmekawy-bim-reel-V2/                 # protected original, stays in place
```

The two originals and archive are excluded from workspace globs and runtime writes. Their old manifests, locks, and installed dependencies remain archival exceptions. “One engine / one dependency system” means one active application engine and one active root npm installation; it does not authorize erasing historical copies. Projects never contain executable application/template source, manifests for npm, lockfiles for npm, or `node_modules`.

## 3. Ownership and imports

| Package | Owns | Permitted internal dependencies |
| --- | --- | --- |
| shared | JSON schemas, generated TS contracts, plain theme data, validation helpers | None |
| motion-components | Deterministic graphics, transitions, RTL text, fonts and media primitives | shared |
| templates | Versioned compositions, scene layouts, capabilities, exact defaults | shared, motion-components |
| motion-engine client | Composition registration and shared resolution logic | shared, templates |
| motion-engine server | Bundling, metadata selection, local renderer adapter | engine pure modules, shared |
| studio | Forms, uploads, project browser, Player | shared, engine/client, player |
| server | Filesystem, local API, jobs, policy | shared, template metadata, engine/server |

Enforce `/client` and `/server` export boundaries. No renderer, bundler, `node:fs`, or server secrets enter the Vite graph. Keep template metadata importable without eagerly evaluating TSX on the backend. Browser packages use ESM and source exports resolved by Vite/Remotion; build Node entry points with a documented ESM toolchain before production launch. Avoid tsconfig aliases that work in only one bundler.

Private workspace packages use unique `@elmekawy/*` names. Use npm-compatible ordinary matching local versions, initially `0.1.0`, for internal dependencies; do not assume the `workspace:*` protocol works with npm. Each workspace declares the packages it imports. Root tooling and one root lock manage installs; compatible packages can be hoisted, although npm may still nest incompatible transitive dependencies. React/React DOM/Remotion are one resolved compatible set, with matching peer declarations in reusable packages. Vite explicitly dedupes React/React DOM/Remotion.

Initially pin every direct `remotion`/`@remotion/*` dependency exactly to `4.0.539`, including new direct Player, Renderer and Bundler declarations. Preserve React and tooling baselines during extraction. Root CI checks lockfile Remotion alignment and a single React runtime; do not use blanket overrides to conceal incompatible dependencies. Fastify 5, compatible official plugins, Vite and its React plugin, Ajv 8, formats support, schema-to-type tooling, and Node build/dev tooling require exact tested versions selected during the approved scaffold task. They are proposed additions, not installed packages or verified compatibility claims.

## 4. Templates and reproducibility

Initial immutable templates:

| Template reference | Composition ID | Capabilities at first release |
| --- | --- | --- |
| `bim-personal-intro@1.0.0` | `ElmekawyBIMIntro` | Fixed 900 frames, 30 fps, 1080 x 1920; six ordered scenes; exact baseline defaults |
| `bim-motion-study@1.0.0` | `ElmekawyBIMIntroV2` | Fixed 360 frames, 30 fps, 1080 x 1920; five ordered scenes; silent default |

Template IDs are independent of the old folder/package version. No implicit `latest`, semver range, or automatic project upgrade. A different composition structure, timing algorithm, or visual default creates a new version. Frozen templates also pin their motion component/theme contract. Do not refactor a shared helper underneath a frozen template without proving parity; add a new helper contract/version instead.

A template version alone cannot guarantee reproduction. Every render stores the project snapshot, asset/font hashes, template and transitive visual-code closure hash, engine revision, root lock hash, effective render settings, Node/OS/browser/FFmpeg information, and output hash. Release/checkpoint metadata retains the matching source and root lockfile outside projects. Reproduction uses that source revision in an isolated workspace with its central install. A mismatch blocks an exact-reproduction request; it must not silently use newer code. Pixel/encoded byte identity across different OS, GPU, browser or encoder versions is not promised.

## 5. Preview and render media contract

Canonical JSON contains asset IDs and managed relative storage paths, never machine paths, `file://` URLs, temporary browser object URLs, or external media URLs. The backend resolves a validated project revision to an immutable runtime descriptor:

```text
{ projectRevision, templateRef, compositionId, metadata,
  resolvedInputProps, mediaUrlByAssetId, fontUrls, warnings, descriptorHash }
```

Runtime media URLs are absolute loopback URLs with IDs and content hashes, for example `http://127.0.0.1:<port>/media/projects/<projectId>/<assetId>/<sha256>`. Shared fonts/logo use shared asset IDs. Asset replacement creates a new immutable file/ID; old revisions keep their media. HEAD and GET agree on verified MIME type; GET supports byte ranges for audio/video, and immutable hash URLs have stable cache headers. No broad static mount exposes `projects/`, `archive/`, or the repository.

Both Player and the Node render browser receive the same resolved descriptor and use the same template component. Do not assume Player invokes a `<Composition calculateMetadata>` callback: resolve metadata explicitly before mounting it. Existing image presence checks become backend validation and an equivalent shared resolver, preserving legacy defaults, paired placeholders, and decode-error behavior. A legacy URL-map adapter translates old `staticFile` keys without changing layout, crops, words, or timing. It must cover fonts and V1 audio as well as images. Initial source-only extraction may use a disposable flat legacy public fixture for parity; the final active app uses explicit managed URLs.

The renderer bundles code once per code/lock/options hash, not per project or video. Keep project media out of the code bundle; the loopback server stays alive through rendering. Bundling uses explicit Rspack settings. Render selection passes the same `inputProps` to metadata selection and `renderMedia`; verify metadata against the descriptor. Use explicit JPEG capture for inherited behavior and a named output preset. Carry the two-second default premount into supported Player/runtime options and verify its effect; do not invent an unsupported renderer parameter. Premount is not a new transition.

## 6. Backend contract and filesystem operations

MVP: one Fastify process, one render worker child process at a time, JSON files as authoritative data, no database, cloud worker, or external media fetch. Default bind `127.0.0.1:4310`; Vite development server at `127.0.0.1:5173`, with API proxy and an explicit allowed origin. Production serves the built UI on the backend origin. Fail clearly on port conflicts; never silently expose the server on the LAN.

| Route | Behavior and filesystem impact |
| --- | --- |
| `GET /api/health` | Runtime/browser readiness and local service status; no absolute paths in response |
| `GET /api/templates`, `GET /api/templates/:id/:version` | Trusted registry metadata, capabilities and defaults; read-only |
| `GET /api/brands`, `GET /api/brands/:id/:version` | Versioned local presets; read-only; project custom brands are embedded snapshots |
| `GET /api/projects` | Enumerate only committed valid project directories; bounded summaries, surface invalid entries as recoverable errors |
| `POST /api/projects` | Validate creation DTO, allocate server ID, stage folder tree and canonical JSON, commit atomically; `201`, Location, ETag |
| `GET /api/projects/:id` | Validate and return project with revision ETag |
| `PUT /api/projects/:id` | Full editable document, `If-Match` required; lock, validate, preserve server fields, save history, atomically replace JSON |
| `POST /api/projects/:id/duplicate` | New ID, clone document and registered project media/prompts only; no app code, dependencies, cache, history or renders by default |
| `POST /api/projects/:id/assets` | One streaming multipart file + validated metadata; quarantine, inspect, hash, rename, update JSON under revision lock |
| `POST /api/projects/:id/assets/:assetId/retire` | Hide from current selection; reject if currently used; retain bytes and historical references |
| `POST /api/projects/:id/resolve` | Resolve a saved revision or validated unsaved editable draft against its base revision; return Player descriptor/draft hash; no filesystem writes |
| `POST /api/projects/:id/validate` | Structured schema, semantic, media and render-readiness issues; no mutations |
| `POST /api/projects/:id/renders` | Verify expected revision, snapshot inputs, persist queued job, return `202` + job ID |
| `GET /api/projects/:id/renders` | Render history including imported legacy outputs |
| `GET /api/renders/:jobId` | Queued/bundling/resolving/rendering/verifying/completed/failed/cancelled/interrupted state |
| `POST /api/renders/:jobId/cancel` | Cancel queued/running job; retain diagnostic state; no successful partial MP4 |
| `GET /api/renders/:jobId/download` | Completed registered MP4 only; attachment headers; supports ranges |
| `GET`, `HEAD /media/projects/:projectId/:assetId/:hash` | Validated manifest lookup, MIME/range response, no caller filesystem path |
| `GET`, `HEAD /media/shared/:assetId/:hash` | Allowlisted immutable shared resource only |

No arbitrary filesystem browser, client-selected output directory, project deletion, archive edit, uploaded template execution, automatic URL import, or image-generation endpoint. Prompt editing is ordinary project editing. Clipboard copying happens in the frontend; there is no prompt-generation service.

### Transaction and recovery rules

Project creation uses a non-user-controlled staging directory on the same filesystem, creates all data folders, validates generated JSON, then renames to the final unused project path under a single-writer lock. Use exclusive creation and bounded collision retries. A repeated creation request with an idempotency key returns its committed result; request-body hash mismatch returns conflict. Keep recoverable operation records under `.studio/`.

Updates require revision compare-and-swap, one per-project lock, a validated temporary file beside the destination, flush/close, and tested Windows-safe atomic replacement. Do not claim portable atomic replacement without a Windows test. Crash recovery must select a complete valid prior or new revision, never merge partial JSON. Uploads require the current If-Match revision, return the updated document/ETag, and write immutable media before committing the JSON reference; an interrupted unreferenced file can be quarantined. A manifest must never reference a partially uploaded file. Disk-full and file-lock failures leave the previous valid project readable.

Duplicate from a locked immutable revision. Copy only assets declared in its manifest; shared references remain references. Preserve template version, brand snapshot, scene data, prompt text and per-project asset IDs; change the project ID, timestamps and revision, and remap any project-scoped URLs when resolving. File copies are independent; no mutable hardlinks. Do not copy an entire legacy or project folder recursively without a manifest allowlist.

Render queue state is persisted under `.studio/jobs/`; snapshots/output metadata live in `projects/<id>/renders/<jobId>/`. A job freezes media and JSON before enqueue. Worker uses an existing approved browser binary or reports setup needed; no surprise runtime network download. Write an MP4 partial path under that job, validate/probe, then publish the unique final filename. On restart mark active jobs interrupted, allow explicit retry as a new job, and never silently resume partial encoding. Jobs continue against their frozen revision while the user edits the project.

### Filesystem and upload boundary

IDs are allowlisted server identifiers. Resolve paths beneath separately configured project/shared/staging roots; verify using `path.relative`, volume and realpath checks, not string prefix alone. Reject `..`, separators, absolute/drive/UNC/device paths, NUL, alternate data streams, Windows reserved names and trailing dot/space aliases. Reject symlinks/junctions/reparse points in managed user-content paths; check parent realpaths before creation and final paths before read/rename. Serialize managed writes; defend against path swaps within the application's control. This is not an OS sandbox against another process with the same user's permissions.

Stream uploads with explicit limits: one file/request, 20 metadata fields, 1 MiB JSON body, 50 MiB image, 1 GiB video, 250 MiB audio/reference video, 20 MiB font, 2 GiB total project assets initially. Use a streaming overall cap and post-detection per-kind caps, bounded metadata/probe processes, and clear limit errors. Initially allow PNG/JPEG/WebP, MP4/WebM, MP3/WAV/M4A, and TTF/OTF/WOFF2; decoder support must be checked. Reject HTML, scripts, executables, archives and uploaded SVG. Existing trusted template SVG graphics stay code-owned. Verify magic bytes, decode/probe, dimensions/duration and font metadata; extension and client MIME alone are insufficient. Original filenames are display metadata only; managed filenames derive from asset IDs and verified type. Do not execute or shell-interpolate uploads or output names.

Bind locally, validate Host, reject unexpected browser origins, use same-origin API access and an in-memory session token for mutations. Keep media access available to the render browser without custom request headers, scoped to registered immutable assets. Do not place session tokens into saved project JSON or render manifests. CORS is not filesystem authorization. Render pages may load only application/loopback resources; disable remote media imports, remote fonts and executable user content. References may store HTTP(S) URLs as text; the app never fetches them automatically.

Errors use `{error:{code,message,issues?,requestId}}`, with JSON pointers and action-oriented messages. Suggested statuses: 400 malformed/schema; 404 unknown ID; 409 revision/template/operation conflict; 412 stale ETag; 413 size; 415 type; 422 semantic/decode/missing-required-asset; 428 missing If-Match; 503 renderer unavailable; 507 storage full. Never send stack traces or host paths to the UI.

## 7. Documentation and official references

Project and API constraints are defined further in [PROJECT_SCHEMA.md](PROJECT_SCHEMA.md), preservation gates in [MIGRATION_PLAN.md](MIGRATION_PLAN.md), screens in [STUDIO_UI_SPEC.md](STUDIO_UI_SPEC.md), and delivery tasks in [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md).

One root workspace installs and links local packages as described in the [npm Workspaces documentation](https://docs.npmjs.com/cli/v11/using-npm/workspaces/). Reusing a code bundle with input props follows the [Remotion bundle API](https://www.remotion.dev/docs/bundle); API configuration is explicit because [only the CLI reads the config file](https://www.remotion.dev/docs/options). Player needs explicit metadata resolution, covered by [Remotion dynamic metadata](https://www.remotion.dev/docs/dynamic-metadata). These are architectural choices applied to this repository, not evidence that V3 has been built.

Use application-owned JSON schemas and non-mutating validation, with asynchronous filesystem checks after structural validation, consistent with [Fastify validation guidance](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/). Configure and consume streaming upload limits explicitly using the [official multipart plugin](https://github.com/fastify/fastify-multipart).
