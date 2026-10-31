# Project, template, brand, scene and asset contracts

Status: Phase 1 schema design, 2026-10-31 (Asia/Riyadh). Types, schema files, validators and examples described here are not application implementation. The JSON examples are planning examples; only the existing media hashes explicitly identified as inspected are verified repository values.

## 1. Persistence and validation policy

`projects/<projectId>/project.json` is the only authoritative editable project document. It embeds the brief, video settings, frozen template reference, brand snapshot, script, ordered scenes, asset records, prompts, references and output settings. There are no competing `scenes.json`, `assets.json`, or `brand.json` files to synchronize. Prompt Markdown exports are derived; imported original manuals are retained as reference documents. Render manifests and historical revisions are immutable records, not alternate editable configuration.

Use application-owned JSON Schema Draft 7, Ajv 8 and registered local `$ref` definitions. Derive TypeScript types from these schemas during development and check generated contracts for drift. Browser validation improves feedback; backend validation is authoritative for every creation, save, upload commit, duplicate, migration and render. Validate files on read as well as writes. Do not compile user-uploaded schemas, fetch remote `$ref`s, or execute template paths from project JSON.

All fixed objects have `additionalProperties: false`; dynamic maps have allowlisted property names and schema-checked values. Reject type coercion, unknown properties and implicit defaults on persisted input. Generate defaults explicitly from a trusted template before validation. API identity/revision/path/hash fields are server-owned and excluded from editable DTOs. Use dedicated request/response schemas rather than treating a complete stored project as a trusted create request.

Validation has three stages:

1. Structural: JSON shape, formats, numeric/string limits, enumerations and discriminated unions.
2. Semantic: IDs/references, template capabilities, exact timing, brand/fonts, text constraints, paired media and output compatibility.
3. Filesystem/render readiness: root containment, real files, no reparse points, hashes, decoding, font loading and installed local renderer readiness.

Drafts may contain missing asset records if their template has a fallback. A malformed reference is an error, not a missing asset. Return issues with `severity`, stable `code`, `jsonPointer`, `message` and optional `sceneId`/`assetId`. Required missing media blocks render; template-approved schematic fallbacks produce warnings. Existing V1 audio licensing uncertainty is recorded without silently removing its audio.

## 2. Identity, time and limits

| Value | Contract |
| --- | --- |
| Project ID | `<ascii-slug>--<32 lowercase random hex>`; slug max 48 chars, total max 82; stable after rename |
| Name | Unicode display string, 1–120 characters; trim surrounding whitespace, preserve Arabic |
| Asset/scene/prompt/reference IDs | Stable identifier matching `^[a-z][a-z0-9_-]{0,63}$`; unique within their collection/project; server allocates new asset IDs |
| Template/preset ID | `^[a-z][a-z0-9-]{0,63}$`; trusted registry lookup only |
| Version | Exact `MAJOR.MINOR.PATCH`, no range or `latest` |
| Schema version | Separate exact format version, initially `1.0.0`; unrelated to template version |
| Revision | Positive integer, starts at 1; increments once per committed editable document change |
| Timestamp | RFC 3339 UTC string; UI displays Asia/Riyadh or user-selected display zone |
| SHA-256 | Exactly 64 lowercase hexadecimal characters |
| JSON size | At most 1 MiB for project/create/save requests and project file initially |
| Text limits | Brief description/objective 10,000 chars each; script 50,000; prompt 20,000; scene description 5,000; smaller field limits per template |
| Collections | At most 100 scenes, 500 assets, 200 prompts and 100 references initially; template can constrain more tightly |
| Video bounds | Positive even width/height, at most 3840 on either axis initially; FPS one of 24/25/30/50/60; duration at most 18,000 frames; template intersection applies |

Backend derives the slug; an all-Arabic or empty ASCII result safely falls back to `project`, preserving the full display name. Use cryptographically random suffixes, exclusive directory creation and bounded retries. Do not trust client slugs or silently use a submitted name as a path. Project slug generation must also reject Windows reserved names and path aliases.

Frames are authoritative; duration seconds are `durationFrames / fps`, not a second independently saved duration. The wizard accepts seconds only when the result is an integer frame count; otherwise show the exact supported value and require an explicit correction. For built-in ratios use exact integer relationships (`width * 16 === height * 9` for 9:16). Resolution/FPS are restricted by the selected template. Legacy templates currently permit only 1080 x 1920 at 30 fps and their original frame count.

## 3. Project document

| Field | Required shape and behavior |
| --- | --- |
| `schemaVersion` | `"1.0.0"` |
| `id`, `revision`, `createdAt`, `updatedAt` | Server-owned identity/concurrency/audit values |
| `name`, `status` | Display name; `draft`, `ready`, or `archived`; archived is retained/read-only in MVP |
| `brief` | `client`, `description`, `objective`, `category`, `audience`, `platforms`; category is a trusted UI value, not a module path |
| `template` | Exact `{id, version}`; resolves to one trusted immutable manifest |
| `video` | `{width,height,aspectRatio,fps,durationFrames}`; ratio enum `9:16`, `16:9`, `1:1`, `4:5`, `custom` |
| `locale` | `{language,direction}`; BCP 47 language string, direction `rtl` or `ltr`; mixed spans controlled by template |
| `brand` | Complete BrandSnapshot below, even when initialized from a shared preset |
| `script` | `{text,notes}`; user-written narrative source; no automatic scene/prompt generation implied |
| `scenes` | Ordered Scene array; actual rendered copy is in declared scene content fields |
| `assets` | Asset union array; all scene/brand/audio references resolve here, including shared resources |
| `prompts` | User-editable Prompt records below |
| `references` | Text URLs or registered local reference asset IDs; informational, never automatically fetched |
| `audio` | `{mode:"none"}` or `{mode:"track",assetId,volume,startFrame,trimStartFrame,trimEndFrame,loop}`; trimming in composition frames; template validates support |
| `output` | `{container,codec,pixelFormat,crf,presetId,fileNameLabel}`; initial MP4/H.264, yuv420p, CRF 18 defaults; all enum/range checked |
| `provenance` | Server-owned optional legacy import/checkpoint/duplication source metadata; no runtime path lookup |

`status` is workflow state, not a replacement for computed validation. Changing to `ready` requires render-readiness validation. `fileNameLabel` is display-only: actual output path/filename is generated from project/job IDs. No user-provided FFmpeg arguments, executable paths or overwrite flags are accepted.

The initial output preset is `mp4-h264-v1`, codec `h264`, container `mp4`, pixel format `yuv420p`, CRF integer 0–51, default 18, audio AAC when a track is present. The backend chooses an effective concurrency setting based on local configuration and records it. The historical V2 output pixel format `yuvj420p` is retained in its imported render metadata; do not pretend it was encoded with the new preset.

### Illustrative project shape

This condensed V2 example shows all project sections; collections are intentionally empty placeholders for readability and therefore are not a render-ready V2 project. A creation service expands the exact trusted template defaults and asset records before commit. The complete field contracts below govern the populated records.

```json
{
  "schemaVersion": "1.0.0",
  "id": "elmekawy-motion-study--0123456789abcdef0123456789abcdef",
  "revision": 1,
  "createdAt": "2026-10-31T09:00:00Z",
  "updatedAt": "2026-10-31T09:00:00Z",
  "name": "Elmekawy BIM motion study",
  "status": "draft",
  "brief": {
    "client": "Elmekawy BIM",
    "description": "A short coordination concept reel.",
    "objective": "Explain the value of connected BIM workflows.",
    "category": "engineering-brand",
    "audience": "BIM professionals",
    "platforms": ["instagram-reels"]
  },
  "template": {"id": "bim-motion-study", "version": "1.0.0"},
  "video": {
    "width": 1080, "height": 1920, "aspectRatio": "9:16",
    "fps": 30, "durationFrames": 360
  },
  "locale": {"language": "ar-EG", "direction": "rtl"},
  "brand": {
    "preset": {"id": "elmekawy-bim", "version": "1.0.0"},
    "displayName": "Elmekawy BIM",
    "colors": {
      "navy": "#003060", "blue": "#055C9D", "cyan": "#0E86D4",
      "light": "#68BBE3", "ink": "#030D1B", "white": "#F3F8FC", "muted": "#9BB4C9"
    },
    "fonts": {
      "arabic": {"family": "Cairo", "assetId": "font-cairo", "weightMin": 100, "weightMax": 900},
      "latin": {"family": "Inter", "assetId": "font-inter", "weightMin": 100, "weightMax": 900}
    },
    "logoAssetId": "brand-logo",
    "safeArea": {"left": 100, "right": 180, "top": 220, "bottom": 360}
  },
  "script": {"text": "الموديل مش هو الـ BIM", "notes": "Illustrative coordination concepts."},
  "scenes": [],
  "assets": [],
  "prompts": [],
  "references": [],
  "audio": {"mode": "none"},
  "output": {
    "container": "mp4", "codec": "h264", "pixelFormat": "yuv420p",
    "crf": 18, "presetId": "mp4-h264-v1", "fileNameLabel": "motion-study"
  },
  "provenance": {"kind": "legacy-import", "legacyProject": "V2", "checkpointId": "migration-checkpoint-1"}
}
```

## 4. Brand contract

BrandSnapshot embeds all resolved values, so editing a reusable preset never changes an existing project. `preset` is a versioned provenance link or `null`. `displayName` is required. `colors` initially has exactly the seven inherited palette keys, each `^#[0-9A-Fa-f]{6}$`; new palette roles require a schema/template change. Template opacity suffixes remain in code. Font roles contain family, registered font asset ID, and valid weight bounds 1–1000. Logo asset ID is nullable if the template permits a fallback.

`safeArea` values are nonnegative integer pixels, with left+right < width and top+bottom < height. Initial frozen templates lock inherited safe area `{left:100,right:180,top:220,bottom:360}`. Do not proportionally rescale these templates just because other video sizes exist in the general schema.

A shared brand preset `shared-assets/brands/<id>/<version>/brand.json` has `schemaVersion`, `id`, `version`, `displayName`, `brand` defaults, and a hash-indexed resource list. Copying a preset into a project embeds values and registers shared font/logo records in its asset collection. Preset versions and shared bytes are immutable; custom uploaded logo/fonts belong to that project. Preserve font licenses adjacent to their shared files and include their hashes in resource metadata.

## 5. Scene contract and timeline rules

| Field | Contract |
| --- | --- |
| `id` | Unique stable scene instance ID |
| `type` | Trusted scene type key declared by the pinned template, not a component import path |
| `name` | User-facing scene label |
| `description` | User-written intent, references and staging notes |
| `startFrame`, `durationFrames` | Integers >= 0 and >= 1 respectively |
| `outgoingExtensionFrames` | Integer >= 0; explicit extra visible sequence time after nominal end |
| `content` | Strict template-specific JSON object: strings, bounded arrays and declared numeric controls only |
| `assetBindings` | Map of declared slot names to project asset IDs, or null for a permitted fallback |
| `promptIds` | Unique existing prompt IDs associated with this scene |

The template specifies the content schema for each scene type. No arbitrary React nodes, HTML, CSS, JavaScript expressions or module names are stored as content. Script/description changes alone do not magically alter rendered text. The UI edits only template-exposed fields and labels informational notes separately.

```json
{
  "id": "comparison",
  "type": "bim-motion-study/comparison",
  "name": "Before and after concept",
  "description": "Matched illustrative coordination alternatives.",
  "startFrame": 135,
  "durationFrames": 90,
  "outgoingExtensionFrames": 0,
  "content": {
    "headingLines": ["نشوف التعارض", "ونراجع المسار"],
    "note": "مثال توضيحي فقط · ليس نتيجة مشروع أو تحقق هندسي"
  },
  "assetBindings": {"before": "comparison-before", "after": "comparison-after"},
  "promptIds": ["prompt-before", "prompt-after"]
}
```

This scene example preserves the inspected V2 text and timing. Initial V2 content schema requires two heading strings and the fixed disclaimer; arbitrary additional fields are rejected. The importer extracts every other scene's existing strings with the same care.

For these two templates, first start is 0; each next nominal start equals previous start+duration; sum of nominal durations equals project duration. Every visible end is at most composition duration. V1 first five extensions are 12, final extension 0; sequence draw order/incoming fade remain template-owned. V2 extensions are all 0 and its persistent FocusDot follows global time. Arbitrary overlaps, reordering, deletion or duration editing are disabled until a template explicitly supports them.

## 6. Asset union

Every asset has `id`, `kind`, `role`, `displayName`, `state`, `provenance` and `license`. `kind` is `image`, `video`, `audio`, `logo`, `font`, or `reference`. `state` is `ready`, `missing`, or `retired`.

| Variant | Additional fields |
| --- | --- |
| Ready/retired stored asset | `storage`, `mimeType`, `extension`, `byteSize`, `sha256`, verified `metadata`, `originalFilename` |
| Missing asset | `expectedFilename`, `reason`, optional `promptId`; no storage, byte count, MIME, or fabricated hash |
| Project storage | `{scope:"project",path:"assets/images/<server-id>.png"}` relative to that project |
| Shared storage | `{scope:"shared",assetId:"<versioned-shared-id>",path:"fonts/.../1.0.0/Cairo.ttf"}` relative to shared-assets |

Storage fields are produced by the backend and cannot be chosen during upload or ordinary project editing. Regex path checks are preliminary only; filesystem containment and realpath checks remain mandatory. Resource registry verifies shared ID/path/hash agreement. References to assets in another project are forbidden; duplication copies project-owned bytes into the new project instead.

Verified metadata is kind-specific: image/logo width+height; video width+height+durationSeconds+stream FPS/codec; audio durationSeconds+codec+sampleRate+channels; font family+format+weight range; reference attachment its verified media properties. Do not trust browser-provided dimensions. Initially local reference files use the same media allowlist; PDF/Office/archives and arbitrary executable attachments are outside MVP.

`provenance` describes `user-upload`, `legacy-import`, or `manual-external-generation`, with optional user-entered provider/reference/prompt ID and a server-recorded import time. This records history and does not assert generation or rights were verified. `license` has `status` (`unknown`, `user-confirmed`, `documented`) and optional note/source text/local license resource ID. Never infer a paid service license from a filename or previous subscription.

```json
{
  "id": "comparison-before",
  "kind": "image",
  "role": "comparison-before",
  "displayName": "Coordination before",
  "state": "missing",
  "expectedFilename": "coordination-before.png",
  "reason": "Not present in the inspected V2 public directory.",
  "promptId": "prompt-before",
  "provenance": {"kind": "legacy-import", "importedAt": "2026-10-31T09:00:00Z"},
  "license": {"status": "unknown"}
}
```

Replacement is explicit: upload creates a new ready asset, then the save operation changes scene/brand bindings. Missing records can be retained for provenance. Old assets remain readable to historical revisions/renders. Do not overwrite an existing file under an unchanged ID/hash. Retire unreferenced current assets without deleting bytes; garbage collection is deferred.

Verified source hashes useful to the importer:

| Media | SHA-256 |
| --- | --- |
| Structural PNG | `bfc90c60a017881d6ba9dea89fd0f704285f5b302c8a365652ddb5a039b40481` |
| Infrastructure PNG | `15450128d51d710b9a954d72058f7569aa1a273fd21ccd3dba8aa620fa2688b7` |
| Technology PNG | `0fb9a0d4614787a259b57644b920469b5424abafb072117829a50eca3ec7177a` |
| Logo PNG | `c143f9d66409365194ded00b18530250fb5be807d24fd18337167ffd0d64c1fe` |
| MP3 | `7e9e8e997a10bd5ac818fa391ee4a281c559f3ddf6f6b06866e38e4e0c0287de` |
| Cairo TTF | `667c987182391c91f4e57a2f455b1794fb5e3ee6ca4ef3383e86bb690fa9c964` |
| Inter TTF | `29160a80ff49ddcab2c97711247e08b1fab27a484a329ce8b813d820dc559031` |

## 7. Manual prompts and references

Prompt records contain `id`, `title`, `sceneIds`, optional `assetId`, `text`, `negativeConstraints`, `aspectRatio`, `suggestedFilename`, `status`, and optional `templateRef`. Status is `draft`, `ready-to-copy`, `uploaded`, or `approved`; these are user-managed workflow labels, not automated image evaluation. Prompt template reference identifies an immutable local text template/version. Substitution is limited to explicit user-entered placeholders; no model invocation or automatic translation is implied.

The user writes or edits text, copies it, generates externally by hand, downloads manually and uploads a file. The app may record the prompt-to-asset association. It cannot infer that uploading a file proves the intended prompt was used. Existing `V2_ASSET_PROMPTS.md` is retained as reference and its two prompts may be imported as editable records with provenance. Preserve explanatory manual-generation instructions.

Reference records are `{id,label,kind:"url",url,notes}` or `{id,label,kind:"asset",assetId,notes}`. URL schemes are only HTTP/HTTPS; they are text/open-in-browser references and never an import/fetch command. Rendered CTA links are display text defined by scene fields and not automatically navigated by the render browser.

## 8. Versioned template manifest

| Field | Contract |
| --- | --- |
| `schemaVersion`, `id`, `version`, `name`, `description`, `category` | Required metadata and exact immutable identity |
| `compositionId` | Original stable composition ID for initial templates |
| `engineContractVersion` | Exact compatible adapter contract, initially `1.0.0` |
| `motionContract` | Exact frozen helper namespace/version, e.g. `motion-study-v1` |
| `supportedProjectSchemaVersions` | Explicit list of accepted data schema versions |
| `defaults` | JSON defaults in the versioned package directory, never a project executable |
| `capabilities` | Allowed dimensions/FPS/durations, languages/directions, editable fields, timeline mode, audio mode and slot rules |
| `sceneTypes` | Trusted scene identifiers and local content-schema references |
| `assetSlots` | Kind/required/fallback rules and paired requirements |
| `integrity` | Release-generated defaults/schema hashes and full visual source dependency closure hash |

Code components are registered in trusted `registry.ts`; manifests contain keys, not executable filesystem paths. Each release manifest is immutable and its integrity is checked. A helper change must create a new contract/template version unless deterministic parity is demonstrated and recorded under the existing release policy. Source checkpoints/root lockfiles must remain recoverable to reproduce an older release.

For `bim-personal-intro@1.0.0`, capabilities lock six ordered scenes, 900 frames, 30 fps, 1080 x 1920; the legacy portrait slot accepts its actual logo image, and audio uses the existing track at volume 0.3. For `bim-motion-study@1.0.0`, lock five scenes, 360 frames, the same FPS/dimensions, and no audio; before/after are an atomic pair with labeled schematic fallback. A single uploaded side does not enable a mixed image/schematic comparison. Decode failure behavior remains aligned with the inspected implementation.

General schema capacity is broader than those capabilities. A later flexible storyboard template may expose other formats, timing and media slots without changing either frozen template.

## 9. Planned JSON Schema layout

The following is the planned root schema outline. Referenced schemas and detailed constraints above must be implemented together; this outline alone is not a complete validator and is not emitted as a runtime file during Phase 1.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "urn:elmekawy:project:1.0.0",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schemaVersion", "id", "revision", "createdAt", "updatedAt", "name", "status",
    "brief", "template", "video", "locale", "brand", "script", "scenes", "assets",
    "prompts", "references", "audio", "output"
  ],
  "properties": {
    "schemaVersion": {"const": "1.0.0"},
    "id": {"type": "string", "maxLength": 82, "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*--[a-f0-9]{32}$"},
    "revision": {"type": "integer", "minimum": 1},
    "createdAt": {"type": "string", "format": "date-time"},
    "updatedAt": {"type": "string", "format": "date-time"},
    "name": {"type": "string", "minLength": 1, "maxLength": 120},
    "status": {"enum": ["draft", "ready", "archived"]},
    "brief": {"$ref": "urn:elmekawy:definitions:1.0.0#/definitions/brief"},
    "template": {"$ref": "urn:elmekawy:definitions:1.0.0#/definitions/versionedRef"},
    "video": {"$ref": "urn:elmekawy:definitions:1.0.0#/definitions/video"},
    "locale": {"$ref": "urn:elmekawy:definitions:1.0.0#/definitions/locale"},
    "brand": {"$ref": "urn:elmekawy:brand:1.0.0"},
    "script": {"$ref": "urn:elmekawy:definitions:1.0.0#/definitions/script"},
    "scenes": {"type": "array", "maxItems": 100, "items": {"$ref": "urn:elmekawy:scene:1.0.0"}},
    "assets": {"type": "array", "maxItems": 500, "items": {"$ref": "urn:elmekawy:asset:1.0.0"}},
    "prompts": {"type": "array", "maxItems": 200, "items": {"$ref": "urn:elmekawy:definitions:1.0.0#/definitions/prompt"}},
    "references": {"type": "array", "maxItems": 100, "items": {"$ref": "urn:elmekawy:definitions:1.0.0#/definitions/reference"}},
    "audio": {"$ref": "urn:elmekawy:definitions:1.0.0#/definitions/audio"},
    "output": {"$ref": "urn:elmekawy:definitions:1.0.0#/definitions/output"},
    "provenance": {"$ref": "urn:elmekawy:definitions:1.0.0#/definitions/provenance"}
  }
}
```

Each referenced file is code-owned under `packages/shared/schemas/v1/`. `brand.schema.json` covers the embedded snapshot; shared preset metadata wraps it using a definition in `definitions.schema.json`. Template manifest is a separate `template.schema.json`. Scene-specific content schemas live with their versioned templates and are explicitly registered. Asset uses `oneOf` branches with state `const` discriminants; stored project/shared location branches are also disjoint. Cross-record uniqueness and contiguous frames require semantic checks, not `uniqueItems` on whole objects.

## 10. API DTOs, render snapshot and compatibility

Create DTO accepts the user fields described above plus optional idempotency key in headers; the server supplies ID/times/revision and registered default records. Template defaults are previewed before commit. Uploads are separate streaming operations after project creation. A failed upload leaves a valid draft; selected browser files remain visible for retry while the page is open. A staged creation transaction ensures no half-created directory is listed.

Save DTO contains editable fields only, uses `If-Match`, and cannot alter managed storage/hashes/provenance or invent registered assets. Revision mismatch returns 412; missing precondition returns 428. Upload commits also require If-Match and return the updated document/ETag; the frontend retains unsaved text while merging the returned registered media changes. A submitted template/version change is rejected in MVP; an explicit future migration creates a new project revision with a reversible plan. Duplication uses `{name, includeReferenceDocuments}` and generates a new identity; render inclusion is false in MVP.

Resolve DTO accepts either a saved revision or `{baseRevision, editableDraft}` for live preview. The latter has the same structural/semantic checks as a save, references only registered assets, and makes no filesystem changes. Its response includes base revision and draft content hash so the UI can discard stale responses and mark unsaved previews. Rendering accepts only a committed revision and resolves it again after save; it never executes arbitrary unsaved props supplied by the browser.

Each render folder includes:

| File | Contents |
| --- | --- |
| `project.snapshot.json` | Complete validated document at the requested revision |
| `render-manifest.json` | Job ID/state, project revision, template reference/integrity, visual closure hash, engine Git/source hash, root lock hash, effective dimensions/FPS/frames/options, per-resource hashes, environment/browser/encoder versions, output hash and warnings |
| `descriptor.json` | Canonical resolved input content plus asset ID/hash references; regenerate ephemeral loopback origin when replaying |
| `output.mp4`, `probe.json`, `render.log` | Unique validated output and diagnostics; publish output only after success |

Persist canonical content and hash references, not ephemeral media session tokens or machine-specific preview URLs. Keep rendered asset bytes immutable for as long as referenced jobs/history exist. Imported legacy outputs use a distinct `legacy-import` provenance/status with their actual probe/hash and explicitly unknown engine/input details; do not fill missing metadata with current values.

Future schema migration is explicit and versioned: validate the old document, take a revision backup, apply a pure known migration, validate the result, commit atomically, and record `from/to` versions. Unknown newer versions open in a read-only error state; never rewrite them with stripped properties. The current projects have TypeScript data rather than existing project JSON, so the initial adapter is a trusted importer, not an arbitrary TS execution loader. Preserve legacy mapping details (`portrait` to logo, audio, missing pair) in provenance and defaults.

Acceptance fixtures must cover both legacy imports, Arabic names, missing pairs, malformed/unknown fields, invalid timing/ratios, invalid references, template incompatibility, stale revisions, newer schema versions and round-trip stability. Filesystem tests cover real bytes and path safety separately from schema shape tests.
