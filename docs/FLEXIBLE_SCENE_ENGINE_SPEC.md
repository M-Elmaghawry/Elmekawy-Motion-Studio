# Flexible Scene Engine specification

Status: Phase 2 implementation approved and delivered incrementally on 2026-11-01 (Asia/Riyadh), following Phase 1 review. See [PHASE_2_IMPLEMENTATION.md](PHASE_2_IMPLEMENTATION.md) for current behavior and verification. The design examples below began as the 2026-10-31 proposal; the actual exported contracts live under `packages/shared/src/flexible/` and the complete accepted fixture is `packages/templates/src/flexible-reel/1.0.0/sample.json`.

## Compatibility boundary

Add `flexible-reel@1.0.0`, with an independent project schema `2.0.0` and scene schema `1.0.0`. Existing project schema `1.0.0`, template IDs `bim-personal-intro` and `bim-motion-study`, and both `1.0.0`/`1.1.0` implementations remain unchanged. Flexible projects never call legacy timing validation or legacy scene editors.

A new parser dispatches on exact `schemaVersion`, then validates the template/version against a trusted registry. Preserve the current legacy `Project` shape; introduce `FlexibleProject` and a discriminated boundary union in new modules. Unknown versions fail with a recoverable error. No automatic migration or default conversion of legacy documents is proposed. Frozen render snapshots continue selecting their exact template version.

## Contracts in new modules

The following design contracts are implemented in new modules with strict JSON schemas, no coercion and no implicit defaults. IDs resolve through installed registries; project JSON cannot provide module names, filesystem paths or executable code. The shared registry owns metadata; the template package owns its separately typed component registry.

```ts
type SceneType =
  | 'kinetic-title'
  | 'stat-proof'
  | 'ui-demo'
  | 'product-hero'
  | 'media-showcase'
  | 'before-after'
  | 'process-flow'
  | 'data-explainer'
  | 'offer-cta';

type OutputProfile = {
  id: string;
  version: string;
  width: number;
  height: number;
  fps: 24 | 25 | 30 | 50 | 60;
  aspectRatio: '9:16' | '1:1' | '16:9';
  container: 'mp4';
  codec: 'h264';
  pixelFormat: 'yuv420p';
  crf: number;
};

type MotionPreset = {
  id: 'word-reveal' | 'count-up' | 'pan' | 'step-reveal' | 'cta-reveal';
  version: '1.0.0';
  enterFrames: number;
  staggerFrames: number;
  exitFrames: number;
  easing: 'linear' | 'ease-out';
  reducedMotion: boolean;
};

type TransitionSpec =
  | { type: 'cut'; durationFrames: 0 }
  | { type: 'crossfade'; durationFrames: number };

type MediaBinding = {
  slot: string;
  assetId: string;
  assetSha256: string;
  fit: 'cover' | 'contain';
  focalPoint: { x: number; y: number }; // normalized 0..1
  frame: { x: number; y: number; width: number; height: number };
  transform: { scale: number; offsetX: number; offsetY: number };
  // Video trim/mute is deferred; unsupported fields are rejected today.
};

type ContentByType = {
  'kinetic-title': { headline: string; subtitle?: string };
  'stat-proof': {
    label: string;
    value: number;
    prefix: string;
    suffix: string;
    sourceNote: string;
  };
  'media-showcase': { headline: string; caption: string };
  'process-flow': { headline: string; steps: { id: string; label: string }[] };
  'offer-cta': { headline: string; action: string; contact: string; offer?: string };
};
type ImplementedType = keyof ContentByType;
type SceneData<K extends ImplementedType> = {
  schemaVersion: '1.0.0';
  id: string;
  type: K;
  durationFrames: number;
  direction: 'rtl' | 'ltr';
  content: ContentByType[K];
  motion: MotionPreset;
  transitionOut: TransitionSpec;
  mediaBindings: MediaBinding[];
};
type ImplementedScene = { [K in ImplementedType]: SceneData<K> }[ImplementedType];

type TemplateManifest = {
  id: 'flexible-reel';
  version: '1.0.0';
  projectSchemaVersion: '2.0.0';
  sceneSchemaVersion: '1.0.0';
  compositionId: 'FlexibleReel';
  supportedSceneTypes: ImplementedType[];
  outputProfiles: OutputProfile[];
  limits: { minScenes: number; maxScenes: number; maxDurationFrames: number };
};

type SceneRegistry = {
  [K in ImplementedType]: {
    type: K;
    version: '1.0.0';
    contentSchemaId: string;
    motionPresetIds: MotionPreset['id'][];
    mediaSlots: { name: string; kinds: ('image' | 'video')[]; required: boolean }[];
    // The template package's component registry is typed by the same scene keys.
  };
};
```

The registry reserves all nine scene names. Only `kinetic-title`, `stat-proof`, `media-showcase`, `process-flow`, and `offer-cta` are enabled in the first implementation. Reserved `ui-demo`, `product-hero`, `before-after`, and `data-explainer` fail as unsupported until implemented; no silent substitute scene. Initially `media-showcase` accepts images only; validated video/audio is a Phase 4 capability.

Each scene schema defines allowed bindings and motions. Require unique scene/step IDs, finite stat values, 1–8 steps, bounded text (headline 200 characters, caption 400, contact 200), and a documented source note for claims. Text-length limits are structural bounds; measured text layout determines overflow warnings. Validate enter/stagger/exit schedules against the scene's usable time. Registry content schemas narrow motion IDs, media kinds and slot counts. Limits begin at 3–8 scenes and 20–45 seconds; these are product constraints for this release, not legacy constraints.

The current `FlexibleProject` contains identity/revision/timestamps, brief, locale, a snapshot of a versioned brand profile (display name/palette/fonts/safe margins), `outputProfile`, `targetDurationFrames`, ordered `scenes`, immutable assets, and `audio: { mode: 'none' }`. The CLI accepts complete expanded JSON and produces an isolated snapshot/render; server ownership of create/save fields and draft placeholder UI are Phase 3 integration. Script/prompt records, logo slots and general media/audio remain later increments. Structural and semantic validators are separate. Rendered duration is computed, never independently edited. Asset records retain source/license/review state; required unapproved/missing media blocks production rendering.

The user's image-control request is now in Phase 3/PR 06b. Phase 2 already persists and renders normalized frame center/dimensions, independent image scale/offsets, focal point and cover/contain. An identity binding uses `frame: {x:0.5,y:0.5,width:1,height:1}` and `transform: {scale:1,offsetX:0,offsetY:0}`. The editor will expose these fields per scene with aspect lock and reset; current legacy versions do not gain fields or change visuals.

## One timing model

All timing values are integers in project frames. A scene's `durationFrames` includes both its incoming and outgoing overlaps. Transitions consume time shared between adjacent scenes; they never append extra frames.

For ordered durations `D[i]` and outgoing transition durations `T[i]`:

```text
T[last] = 0
S[0] = 0
S[i+1] = S[i] + D[i] - T[i]
E[i] = S[i] + D[i]
totalFrames = E[last] = sum(D) - sum(T)
scene localFrame = globalFrame - S[i]
active interval = [S[i], E[i])
```

Require `D[i] >= 1`, cuts of exactly zero frames, crossfades of at least two frames, and `T[incoming] + T[outgoing] < D[i]` (missing endpoint transitions count as zero). This prevents triple overlaps and guarantees at least one solo scene frame. Reject transitions longer than either neighbor. The last transition must be a cut. Require computed total to equal `targetDurationFrames` and fit the selected profile's limits; do not stretch, round or silently pad a project.

During a crossfade of `T` frames, let `k = globalFrame - S[next]`, in `0..T-1`; render the outgoing scene fully opaque beneath incoming opacity `k / (T-1)`. Draw the transition over a shared opaque background. At a cut, the previous half-open interval ends exactly where the next starts. Every global frame in `[0, totalFrames)` has one or two active scenes and is encoded once. Player and Renderer use the same compiled timeline and local frames. No legacy `outgoingExtensionFrames` is reused.

For five scenes at 132 frames each and four 15-frame crossfades: starts are `0,117,234,351,468`, exclusive ends are `132,249,366,483,600`. The result is exactly 600 frames / 20 seconds at 30 FPS. A reorder or retime recompiles the entire timeline and invalidates stale render descriptors.

## Deterministic rendering and Arabic layout

All visual states are pure functions of saved JSON, frame and FPS. Use Remotion interpolation/springs with explicit parameters; prohibit real-time GSAP timelines, timers, CSS animation, `Date.now()` and uncontrolled randomness in compositions. If procedural variation is later needed, persist a seed and use a deterministic function. Record template/registry versions, source commit/fingerprint, lockfile hash, browser version, asset hashes and output settings in the render manifest.

Use the exact approved local Cairo/Inter fonts initially. Await fonts and image decoding for rendering. Set paragraph direction explicitly, isolate Latin tokens/URLs/numbers with bidi spans, and segment Arabic words without breaking glyph shaping. Preview and production layout share the same measured dimensions. Do not reverse a string to simulate RTL.

For the initial 1080×1920 profile, phone-safe text bounds are left 100, right 180, top 220, bottom 360 pixels, giving a 800×1340 text region. Other profiles require reviewed explicit margins rather than inherited portrait constants. Measure after font loading; warn/block according to severity for overflow, unreadably small text, and unsafe placement. Assets may bleed beyond this region; essential text/CTA stays inside it. Reduced motion removes travel/overshoot and preserves readable timing.

## JSON-only 20-second acceptance fixture

The complete implemented fixture is `packages/templates/src/flexible-reel/1.0.0/sample.json`, rendered using `npm.cmd run render:flexible`. It contains every required expanded field, exact local image/font hashes and a brand snapshot. No scene-specific TSX is generated or edited. The earlier shorthand design below is retained as a wizard-input example and is not accepted by the current CLI or legacy API:

```json
{
  "schemaVersion": "2.0.0",
  "template": { "id": "flexible-reel", "version": "1.0.0" },
  "outputProfileId": "portrait-1080p30-h264-v1",
  "targetDurationFrames": 600,
  "brandProfileId": "elmekawy-bim",
  "locale": { "language": "ar-EG", "direction": "rtl" },
  "sceneDefaults": {
    "schemaVersion": "1.0.0",
    "durationFrames": 132,
    "direction": "rtl"
  },
  "storyboard": [
    {
      "id": "hook",
      "type": "kinetic-title",
      "content": { "headline": "من الفكرة للتنسيق", "subtitle": "BIM / Revit" },
      "motionPresetId": "word-reveal"
    },
    {
      "id": "proof",
      "type": "stat-proof",
      "content": {
        "label": "مراحل في المثال",
        "value": 3,
        "prefix": "",
        "suffix": "",
        "sourceNote": "Illustrative workflow count, not a client performance claim."
      },
      "motionPresetId": "count-up"
    },
    {
      "id": "media",
      "type": "media-showcase",
      "content": { "headline": "رؤية واضحة", "caption": "صورة يرفعها المستخدم يدويًا" },
      "motionPresetId": "pan",
      "assetRole": "showcase-image"
    },
    {
      "id": "steps",
      "type": "process-flow",
      "content": {
        "headline": "كل خطوة متصلة",
        "steps": [
          { "id": "model", "label": "نمذجة" },
          { "id": "coordinate", "label": "تنسيق" },
          { "id": "deliver", "label": "تسليم" }
        ]
      },
      "motionPresetId": "step-reveal"
    },
    {
      "id": "cta",
      "type": "offer-cta",
      "content": { "headline": "ابدأ مشروعك", "action": "تواصل معنا", "contact": "example.com" },
      "motionPresetId": "cta-reveal"
    }
  ],
  "betweenScenes": { "type": "crossfade", "durationFrames": 15 },
  "audio": { "mode": "none" }
}
```

This shorthand describes a possible Phase 3 wizard input: `sceneDefaults`, preset IDs, asset roles, and `betweenScenes` would expand into full `SceneData` records. No shorthand builder is shipped in Phase 2. The implemented sample is already fully expanded and validated directly. Persist only the expanded document; fixture-input keys are rejected by the project schema. Current tests exercise JSON roundtrips and the CLI render; UI save/reopen remains Phase 3.

## Implementation PRs and gates

1. **Schemas and registry:** new schema/version/manifest and five typed content contracts; parser dispatch; invalid/unknown version and reference tests; timing compiler with exhaustive boundary and overlap invariants. No legacy schema widening.
2. **Five scenes and composition:** pure frame functions, RTL layout, still-image binding, new `FlexibleReel` registration and dynamic metadata isolated from V1/V2; render the 600-frame fixture from JSON and verify FFprobe/decode results and all boundary frames.
3. **Editor MVP (Phase 3):** wizard, brand snapshots, flexible-only add/delete/reorder/retime, per-image frame size/zoom/position/fit/focal point/reset, live preview, save/reopen/duplicate; retain legacy editor behavior. Different-client cards derive identity from project data. Image controls use the Phase 2 binding contract; legacy support requires a new opt-in version.
4. **Media and timeline (Phase 4):** immutable, FFprobe-validated video/audio with bounds, exact trim/rate mapping, voice/music tracks, beats/silence/pause markers, and sound QA. Prevent overlap from playing clip audio twice. Review time stretching/resampling semantics before enabling.
5. **Manual prompts and recoverability:** scene-linked prompt versions, copy/upload/review, ZIP manifest/hash export and validated reimport into a new project ID. No provider calls, MCP or browser automation for generation.

Before and after each rendering PR, compare frozen legacy source hashes and run V1/V2 representative/boundary parity checks plus smoke exports, including legacy and editable template versions. Test timeline durations of one frame, cut boundaries, minimum crossfades, invalid overlaps, target mismatch, reorder and random valid schedules with a fixed test seed. Confirm no gaps, triple overlaps or duplicated encoded frames. Test mixed Arabic/English, long headings, fonts, missing/retired/hash-mismatched assets and repeated seek/render determinism.

The eventual UI acceptance set remains 20s Elmekawy BIM, 25s Khatwa and 30s Revit with real video/audio. Those are later gates; Phase 2 delivers the 20s JSON-only engine/render gate. Backup/restore must be verified before a migration or storage cleanup. Rollback removes/selects the new template release without rewriting schema-1 projects; retain new-format data and use the matching release to reopen it. No archive, `.studio`, project history or original directory is deleted or rewritten as part of rollback.
