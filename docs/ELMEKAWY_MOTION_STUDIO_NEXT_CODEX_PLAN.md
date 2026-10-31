# Codex Implementation Brief — Elmekawy Motion Studio Next Iteration

**Purpose:** Safe, incremental modernization informed by the updated GitHub audit and the complete 18-video Motion Lab reference set.  
**Work on a NEW BRANCH**, not directly on `main`. Preserve both legacy projects and template versions.

## Copy/paste this instruction into Codex

```text
ROLE: You are the lead architect for Elmekawy Motion Studio, a local-first
React/Remotion/TypeScript/Fastify motion production platform.

BASELINE:
- Repository: M-Elmaghawry/Elmekawy-Motion-Studio
- The existing V1 and V2 compositions are preserved and must remain reproducible.
- Manual AI image generation only: the user writes or copies prompts, generates images
  on the external website manually, then uploads files. NO external image-generation
  APIs, MCP integrations, browser automation, or paid generation providers.

READ FIRST:
- README.md
- package.json
- apps/studio/src/main.tsx
- apps/server/src/projects.ts
- apps/server/src/uploads.ts
- packages/shared/src/index.ts
- packages/motion-engine and packages/templates
- scripts/seed-projects.ts
- tools/launcher/Program.cs
- scripts/build-launcher.ps1
- docs/ and tests/
- ELMEKAWY_MOTION_STUDIO_FINAL_REVIEW_2026-10-31.md (if copied to repo)

IMPORTANT DISCOVERED MISMATCH:
README documents npm scripts launcher:build and launcher:verify, but published
root package.json does not currently define them. Confirm actual workspace state
before changing anything; fix the documentation/scripts mismatch with tests.

PHASE 0 — REQUIRED BASELINE AND PROTECTION
1. Create a dedicated branch, e.g. feature/studio-flexible-scenes.
2. Record git status, current commit hash, package versions, tests and asset paths.
3. Identify any uncommitted user data and never overwrite it.
4. Do not delete or rewrite archive, .studio, projects, or historical directories.
5. Run available typecheck/build/tests and V1/V2 render smoke tests where possible.
6. If a test cannot run, report exact reason; never invent passes.
7. Create docs/CURRENT_STATE_AND_GAPS.md with verified facts and uncertainties.

PHASE 1 — SMALL RELIABILITY FIXES (IMPLEMENT FIRST)
1. Fix launcher:build / launcher:verify npm script mismatch. If verification
   script does not exist, create a minimal safe verification based on real code
   (do not claim a Windows run in non-Windows environments).
2. Add/verify automated tests for CLI commands and clean Windows setup notes.
3. Inspect Chrome Headless Shell seeding dependency on legacy V2.
   Document an independent pinned browser provisioning approach but DO NOT
   remove the existing working fallback until a fresh-install test passes.
4. Add focused lint/format scripts and typecheck script without reformatting
   all the legacy source in the same PR.
5. Report changed files and actual test results; stop for review.

PHASE 2 — FLEXIBLE SCENE ARCHITECTURE (SPEC FIRST, THEN IMPLEMENT)
1. Create a NEW template ID 'flexible-reel' and its independent schema version.
   NEVER change rendering logic or default visuals of existing V1/V2 versions.
2. Define TemplateManifest, SceneRegistry, SceneData, MotionPreset,
   TransitionSpec, MediaBinding and OutputProfile types.
3. Support scene types:
   kinetic-title, stat-proof, ui-demo, product-hero, media-showcase,
   before-after, process-flow, data-explainer, offer-cta.
4. Start the actual implementation with only:
   kinetic-title, stat-proof, media-showcase, process-flow, offer-cta.
5. Derive all animations deterministically from frame/fps; no uncontrolled
   real-time GSAP timelines, CSS animations, timers or randomness in renders.
6. Define a single time accounting model for overlapping transitions; validate
   total duration and ensure no missing/duplicated frames.
7. Support Arabic RTL mixed with English and phone-safe text regions.
8. Render a 20s sample from JSON only. Verify original V1/V2 untouched.

PHASE 3 — EDITOR MVP
1. Build a New Project Wizard: name, client, goal, brand, aspect ratio,
   duration, storyboard, assets, output format.
2. Implement Scene List + add/delete/reorder/retime controls for FLEXIBLE only.
3. Add Brand Profiles for Elmekawy BIM, Khatwa Designs and Custom Client.
4. Make preview update with data-driven scene changes; save/reopen reliably.
5. Keep existing legacy templates editable with their existing UX unchanged.
6. Allow project duplication without copying dependencies.
7. Add per-scene image controls: frame size with aspect-ratio lock, image zoom,
   horizontal/vertical position, cover/contain fit, focal point and reset.
   Store numeric transforms in MediaBinding, apply identically in Player/Renderer,
   and preserve them through save/reopen/duplicate. Keep changes scene-local.
   Add these to flexible scenes first; any legacy support requires a NEW template
   version with identity defaults and explicit opt-in, never edits to frozen V1/V2.

PHASE 4 — MEDIA, PROMPTS, AND AUDIO
1. Add immutable image/video/audio media with strict validation using real file
   introspection, max size/duration, and safe serving for both Player and Renderer.
2. Add PromptWorkspace records: prompt, scene, source, copy action, asset upload,
   review/approved status. No image-generation integration.
3. Add a voiceover/music timeline with beats and explicit silence/pause markers.
4. Add animated UI/mobile/data components, driven by scenes and timing.
5. Add meaningful QA warnings: missing approved assets, Arabic overflow,
   unexpected silence, unsafe area placement, missing render output.

QUALITY BAR / ACCEPTANCE:
- 3 separate new reels can be created via UI without editing TSX:
  a) 20s Elmekawy BIM,
  b) 25s Khatwa product/service,
  c) 30s Revit course with real video and audio.
- V1 and V2 render outputs retain baseline visual behavior.
- No API or automation to generate images externally.
- No hard-coded client identity in project list/cards.
- No project-level duplicate node_modules.
- Project export + reimport works, and saved versions remain recoverable.
- Document all breaking migrations and provide rollback instructions.

EXECUTION POLICY:
Carry out ONLY Phase 0 and Phase 1 in the first implementation session.
Create docs/FLEXIBLE_SCENE_ENGINE_SPEC.md for Phase 2, but do not begin
large-scale refactoring or implement Phase 2 without review.
After completing Phase 1, give a concise change summary, diff file list,
exact test commands and actual results, and a Phase 2 proposed PR breakdown.
```

## Proposed PR sequence

| PR  | Topic                                                               | Risk   |
| --- | ------------------------------------------------------------------- | ------ |
| 01  | Launcher script/doc mismatch + Windows smoke checks                 | Low    |
| 02  | Chrome provisioning proposal + controlled fallback                  | Medium |
| 03  | Scene data schema and registry (new code only)                      | Medium |
| 04  | 5 baseline scene types + Remotion composition                       | Medium |
| 05  | New project wizard and brand presets                                | Medium |
| 06  | Editable storyboard + scene order/duration                          | High   |
| 06b | Scene image size/zoom/position/fit controls + preview/render parity | Medium |
| 07  | Video/audio asset validation and timeline                           | High   |
| 08  | Prompt workspace + project backup/export                            | Medium |

Keep each PR small and protect legacy V1/V2 composition hashes.

## Continuation approved after Phase 1 review

The user requested continuation after the Phase 0/1 results and Phase 2 specification were delivered. Proceed with Phase 2 (PRs 03–04): separate flexible schemas/registry/timing, then the five initial scenes and a JSON-only 20s render. Keep Phase 3 editor controls, including image resizing, as the next incremental delivery. Phase 2 establishes the stored image layout/transform fields and shared rendering behavior so the editor can expose them without another data migration. Do not silently add resize fields to legacy project JSON.
