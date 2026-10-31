# Local Studio UI and MVP scope

Status: Phase 1 design, 2026-10-31 (Asia/Riyadh). No UI has been implemented. The app is a local React + Vite interface backed by Fastify, with Remotion Player preview and local queued MP4 export.

## 1. Product boundaries

The user can create, edit, preview, duplicate and render independent local video projects. The studio offers installed versioned templates and local assets. It stores user-written prompts and copyable prompt templates. Image generation, downloads from image websites and creative approval remain manual.

No image/prompt-generation button, model selector, API key field, provider account connection, paid integration, browser automation, MCP image workflow, cloud render, account system, billing screen or automatic asset search belongs in MVP. The existing repository README's automatic creative/prompt-writing concepts are historical, not a connected capability.

Initial content templates are the two preserved portrait compositions. Their duration/FPS/dimensions stay fixed. The general project model includes other formats, but the UI enables a value only when an installed template explicitly supports it. A flexible storyboard template is a later independent release, not a silent conversion of V1 or V2.

MVP labels can be English, with full Arabic input, correct field direction and mixed-text rendering. Video language/direction is separate from the application's layout direction. A small UI direction preference may switch layout; full translated interface copy is a later task. Existing templates remain Arabic-first with explicit Latin isolation; choosing English cannot imply that existing Arabic scenes are automatically translated.

## 2. Navigation and screens

| Screen / route | MVP purpose |
| --- | --- |
| Projects `/` | List local projects, create, open, duplicate, search by name/client |
| New project `/projects/new` | Guided brief/template/format/brand/script/assets/output/review workflow |
| Project `/projects/:id` | Header with save state/revision; brief, brand, scenes, assets, prompts, preview and exports tabs |
| Render detail `/projects/:id/renders/:jobId` | Progress, cancellation, errors, retained output and download |
| Local settings `/settings` | Renderer/browser readiness, local storage summary, interface direction, diagnostics |

Template browser is a panel in creation, not a separate marketplace. Brand presets are selected in brand settings; custom project brand values are edited inline. The global render queue is a small persistent drawer linking to project render details.

### Projects screen

Cards/rows show name, client, template and exact version, format/duration, last saved time, draft/ready state, validation summary and latest render result. Thumbnails are optional locally generated previews; no remote images or stock imagery. Provide search, sort by modified date and an empty state with Create project.

Duplicate asks for the new display name, explains that media/content/template reference are copied, and creates a new ID. Dependencies, source, cache, history and renders are excluded. Shared immutable fonts/logo stay references. Do not expose whole-directory clone operations or arbitrary filesystem targets.

Malformed project files appear as an unavailable entry with a recoverable error and diagnostic identifier; they must not crash the whole list or disappear silently. Do not expose host paths/stack traces. No permanent-delete action in MVP. Existing legacy folders are not automatically treated as editable projects before the approved importer has created their new data records.

## 3. Project creation workflow

The wizard may keep unsaved form state in memory. Do not persist uploaded file bytes in browser storage. Leaving the wizard with pending input shows an ordinary unsaved-change warning. A local metadata draft may be offered explicitly, but the server remains authoritative once created.

| Step | Inputs | Validation/behavior |
| --- | --- | --- |
| 1. Brief | Project name, client/brand name, description, objective, audience, platforms | Required name and objective; Arabic supported; backend owns the eventual ID |
| 2. Category/template | Category, installed template, exact version; preview/default summary | Only trusted installed versions; show six-scene V1 vs five-scene V2, fixed metadata, audio behavior and placeholders |
| 3. Video/language | Duration in seconds/frames, ratio, resolution, FPS, language, RTL/LTR | Intersect with template capabilities; show fixed values clearly for legacy templates; no automatic translation, retiming or resizing |
| 4. Brand | Preset or custom snapshot, colors, local font choices, logo selection/upload | Valid hex colors; registered fonts and known weight range; logo can be missing when fallback exists |
| 5. Script/scenes | Full script, ordered scene descriptions, exposed scene text, slot intentions | No automatic script-to-scenes or prompt generation; fixed scene order/timing for initial templates; template-specific length constraints |
| 6. Media/references | Images, videos, audio, logo/fonts, local reference media or text URLs; slot assignment | Queue files for upload; indicate unsupported template slots; use upload allowlist/limits; URLs remain references, not downloads |
| 7. Output/review | H.264 MP4 preset, CRF/quality where supported, display filename label; complete summary | Show missing/fallback assets, total duration, template version, local storage/render readiness; output destination is managed automatically |

Project identity and client name are separate. Choosing a shared brand initializes a snapshot, rather than creating a live link that changes all projects when a preset changes. Category is metadata plus template filtering; it does not cause code generation.

Every requested input has a place: brief captures name/client/description/objective; category/template selects the composition; format controls cover duration/ratio/resolution/FPS; locale handles language and direction; brand handles palette/fonts/logo; script/scenes capture content; media/references accept user files; output defines export settings. Disabled values remain visible with their template limitation explained.

### Creation transaction and file uploads

Review -> Create project sends the JSON create DTO. The backend validates, reserves a safe unique ID, stages the required folders/defaults and commits a valid draft. It returns a project ID, document and ETag. The UI then uploads queued files individually, shows progress, and saves explicit slot bindings against the latest revision. A project without uploads is still a valid draft.

Do not imply all browser-selected files were saved when only the JSON transaction succeeded. Failed uploads keep the project open with retry/remove actions and a count of pending local files. A successful upload can be reassigned to a slot; a failed binding save can be retried without uploading the same bytes again. Refreshing a page may require reselecting files that never reached the server. Duplicate submit/retry uses an idempotency key for project creation, avoiding duplicate folders.

Template capabilities determine which media affect the output. References can be stored even when they are not rendered. V2 does not begin playing an uploaded MP3 merely because it exists; unsupported audio stays informational or is clearly rejected as a track binding. The original V1 baseline starts with its actual MP3 at volume 0.3 and the logo-backed portrait slot.

## 4. Project editor

The header shows project name/client, template `id@version`, current format, last saved revision, and a distinct Saved / Unsaved / Saving / Save failed / Conflict state. One Save action persists the complete editable document with `If-Match`; no hidden rewrite of template identity or media storage fields.

| Tab | MVP controls |
| --- | --- |
| Brief | Names, objective, description, audience/platform/category metadata |
| Brand | Palette, preset snapshot provenance, logo/font assignment, supported brand fields |
| Scenes | Fixed ordered cards, frame ranges, script/description, exposed content fields, media/prompt links |
| Assets | Registered media library, per-slot requirements, uploads, assignment, hashes/provenance summaries, retire unused asset |
| Prompts | Manual editable text, local text templates, negative constraints, intended aspect ratio, Copy prompt, upload association |
| Preview | Player, seek/scrub, scene markers, frame/time readout, validation and asset state |
| Exports | Output preset, preflight, render queue/history, download and job diagnostics |

A responsive desktop layout can show scene cards beside the preview; tabs remain the authoritative navigation. No drag-and-drop timeline editor, keyframe editor, template-code editor or arbitrary transition picker in MVP. Fixed-template controls cannot suggest that rearranging cards is supported.

### Scene and brand safeguards

Scene cards distinguish script notes from rendered text. Template-exposed string fields are plain text; retain Arabic letters, punctuation and explicit Latin tokens. Preview truncation is not proof of a fitting final layout. Show field-specific maximum lengths and inspect actual wrapping in Player.

Legacy defaults reproduce exactly; later user edits are deliberate variations of that project. Editing a project does not mutate the installed template or any other project. A frozen template version cannot be switched through an ordinary dropdown save. Future template migration must be an explicit previewable operation; MVP can duplicate a project and choose a separately created project/template instead.

Brand controls show an asset's actual role. Imported V1 displays that its historical portrait slot uses a logo; do not relabel it as a supplied personal photograph. A future real portrait upload is an explicit content change. Preserve seven palette defaults, local font weights and inherited safe margins in initial import.

## 5. Assets and manual prompts

Asset cards show thumbnail/icon, kind, file size, actual dimensions/duration when relevant, original display filename, assigned scene slots, source note and license status if supplied. UI never asks users to type storage paths. The backend generates managed filenames and verifies bytes. Replacing media uploads a new immutable asset and updates bindings; render history retains old references.

Show upload limits before file selection and errors next to the affected file. Accept only enabled verified formats; videos/audio may require local probing before Ready. Unsupported, oversized, corrupt, truncated or unreadable media remains unassigned with retry/remove guidance. Retire only an asset not used in current scenes/brand/audio; do not offer hard deletion or silently break historical jobs.

V2 comparison slot behavior is explicit:

| Uploaded state | Preview/render behavior |
| --- | --- |
| Neither image | Two labeled schematics; informational warning |
| Only before or only after | Keep schematic pair; show which image is still missing |
| Both valid and assigned | Use both images; retain the illustrative disclaimer |
| Decode error at runtime | Preserve template's tested fallback behavior; surface diagnostic |

Prompt records show title, scene/asset association, text, negative constraints, aspect ratio and suggested filename. Copy uses the browser clipboard with manual selection fallback. A copied-state notice confirms only that text was copied. The user then visits the external website independently, generates/downloads manually, returns to upload, and associates the file with the intended prompt/slot.

Local prompt templates are static text with explicit user-filled placeholders. “Use text template” copies editable text and does not call a model. Status labels such as uploaded/approved are manual workflow notes; the studio does not evaluate image truthfulness or automatically certify matching before/after geometry. References open only after a user click and use safe HTTP(S) links.

## 6. Live preview contract

Mount `@remotion/player` with the same versioned component, resolved input props and metadata used by the render engine. The frontend does not independently reimplement scene timing or asset fallback rules. Fonts must finish loading before capture/display is treated as ready. Loading/error states remain visible; never silently substitute a system font for a failed local font.

For live form feedback, `POST /api/projects/:id/resolve` may accept a validated unsaved editable draft plus its base revision. It performs no filesystem writes and can reference only already registered media. Debounce requests, cancel stale resolutions, and retain the last valid preview while displaying field errors. Returned descriptor includes base revision, draft content hash and an Unsaved preview indicator. The Player does not invoke Composition metadata automatically.

Saving resolves the canonical saved revision. Exports always require saved data; they never enqueue from a transient form state. If Save fails or a revision conflicts, keep the user's edits, label the preview Unsaved and disable exporting those edits until resolved. A stale server revision should offer reload/copy edits and an explicit conflict resolution; do not silently last-write-wins.

Preview controls: play/pause, seek, current frame/time, scene jump markers, fit-to-panel, volume/mute when supported, and optional safe-area overlay that is UI-only and excluded from final output. Respect browser autoplay restrictions; start audio after a user interaction. Initial frame sizes use the true composition aspect ratio. A project never needs an MP4 render just to preview an edit.

Render preflight labels the exact saved revision and any allowed placeholders. An unsaved preview can differ from the last saved render by design; the UI must make that visible. Rendering while editing freezes the queued revision and does not lock the entire editor.

## 7. Export and job states

Export screen shows resolution, FPS, exact duration, output preset and audio behavior. The server validates schemas, template compatibility, asset presence/hashes, local fonts, disk space and browser readiness before accepting a render. Missing optional comparison images may remain warnings; required unresolved media or invalid timing blocks export with a link to the relevant field/slot.

| State | UI |
| --- | --- |
| Queued | Position in local queue; cancel available |
| Bundling | Preparing shared engine code; no invented percentage/ETA |
| Resolving | Checking exact composition metadata/assets |
| Rendering | Actual progress from worker; frame/progress where available |
| Verifying | Encoding/probe/output validation finishing |
| Completed | File size, exact output facts, download, project revision/template version |
| Failed | Clear error, diagnostic ID, edit/retry as appropriate; no partial download |
| Cancelled | Cancellation acknowledged and partial output withheld |
| Interrupted | App/server stopped; retry creates a new job |
| Imported legacy output | Clearly labeled historical file with known probe/hash and incomplete original render metadata |

Poll job status at a bounded interval while active, back off when backgrounded/offline, and recover on reconnect. A child worker keeps the API responsive; one render at a time is sufficient for MVP. Cancel cannot overwrite another job or remove an already completed output. Retry always generates a new job/output path.

Download returns a registered completed MP4. There is no text box for arbitrary filesystem destinations, overwrite toggle, or cloud publishing. Imported V2 proof and QA stay available as historical evidence; do not display the absent V1 historical MP4 as downloadable.

## 8. Error, accessibility and local-use requirements

- Map API issue JSON pointers to fields and scene/asset cards. Keep entered text after failures.
- Display renderer unavailable, media load failure, storage full, project conflict and corrupted project as different actionable states.
- Server disconnect does not erase unsaved editor text; show offline/disconnected status and retry after reconnect.
- Keyboard-operable dialogs, file controls and scene navigation; visible focus, labels and status announcements.
- Arabic fields use appropriate `dir`/language hints; Latin filenames/URLs/frame values remain readable in RTL layouts.
- Keep UI-only reduced-motion preferences separate from output animation; do not change a saved video's motion when a system accessibility setting changes.
- All assets/fonts/scripts load locally during normal use. No analytics, remote font CSS, remote stock assets or silent network generation calls.
- Local settings shows whether the browser/runtime is already installed. A missing runtime produces setup guidance; it must not silently download while starting a render.

## 9. MVP acceptance scenarios

1. Create a project with an Arabic name, client, objective, template, locale, brand, script/scenes, queued media and output settings. Backend-generated identity is safe; no source/dependencies appear inside the project.
2. Open both imported projects. Player reproduces 900-frame V1 with its MP3/logo mapping and 360-frame silent V2 with labeled schematics.
3. Edit an exposed text field, see an Unsaved live Player preview, save, and render that exact saved revision.
4. Copy a stored prompt, manually upload a file, assign it to the intended slot, and preview it without any generation integration.
5. Upload only one V2 comparison image; UI explains the pair requirement and keeps both schematic placeholders. Add the second and use the pair.
6. Duplicate a project; new identity and independent editable media/content exist, while workspace dependencies and shared template references remain centralized.
7. Reject unsupported format/upload, invalid path metadata, invalid project data and stale saves without destroying the last valid state.
8. Cancel/fail/restart a render; job state is recoverable and completed original/new outputs remain intact.
9. Run the prepared app with network disconnected; create, preview, upload and render using installed local resources.

See [ARCHITECTURE_V3.md](ARCHITECTURE_V3.md) for routes and media boundaries, [PROJECT_SCHEMA.md](PROJECT_SCHEMA.md) for validation, and [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md) for delivery gates.
