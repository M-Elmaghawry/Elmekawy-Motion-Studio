# Elmekawy Motion Studio — V2 Codex Implementation Brief

## Project goal
Upgrade an existing Remotion-based Elmekawy BIM reel into a more sophisticated, original motion graphics system inspired by the **general design principles** identified in the user's Motion Lab reference videos. Do not reproduce another creator's exact shots, assets, or distinctive compositions.

## Non-negotiable safety and scope
1. **V1 is read-only.** Never modify, delete, rename, or install dependencies inside `../elmekawy-bim-reel/`.
2. Work exclusively in `elmekawy-bim-reel-V2/`. Confirm the current working directory before any write.
3. Do not overwrite the V1 video or render output. Use a V2-specific composition ID and output filename.
4. Preserve the existing six-scene V1 composition inside the V2 copy as a baseline for comparison. Add V2 as a separate composition.
5. No image generation APIs, MCP, browser automation, or external asset integrations. The user manually copies prompts into their image generation website and manually downloads images.
6. Never invent real project photos, personal portraits, logos, licenses, or professional credentials.
7. Do not add paid services or dependencies without explicit approval.
8. No full rewrite before inspecting the existing repository. Favor incremental, reversible changes.
9. Do not claim tests/renders passed unless you actually ran them and checked the result.

## Step 0 — Repository inspection (do this first)
- Confirm you are in the V2 directory and inspect `package.json`, Remotion config, `src/`, `public/`, asset paths, compositions, existing animation helpers, TypeScript config, and README.
- Identify existing GSAP usage and any nondeterministic animations.
- Report current scene durations, composition IDs, dimensions, FPS, and available media.
- Identify missing assets and risks. Show a concise proposed file-change plan **before editing**.
- Do not edit V1.

## Step 1 — Preserve baseline and register V2
- Keep original composition in the copied V2 project.
- Add composition ID `ElmekawyBIMIntroV2` with a **12-second motion proof of concept**, 1080x1920, 30 fps (360 frames).
- Do not modify V1 composition behavior.
- Implement with reusable React/TypeScript components and Remotion frame-based animation.

## Step 2 — Create a reusable motion design system
Create or adapt modules (follow the existing project's naming conventions):
- `src/motion/tokens.ts`: motion timing, spring settings, easing, stagger, durations.
- `src/motion/presets.ts`: fade, mask reveal, overshoot, camera push, parallax, stagger, morph-like transitions.
- `src/components/motion/ArabicWordReveal.tsx`: correct RTL word-based typography with mixed Arabic/English support.
- `src/components/motion/FocusDot.tsx`: animated focus light/dot used as a visual through-line.
- `src/components/motion/ComparisonReveal.tsx`: before/after split, wipe or sliding reveal.
- `src/components/motion/ProgressNavigator.tsx`: four-step workflow with active state.
- `src/components/motion/LayeredScene.tsx`: foreground/midground/background for 2.5D parallax.
- `src/theme/brand.ts` or reuse existing theme: navy `#003060`, blue `#055C9D`, cyan `#0E86D4`, light blue `#68BBE3`.
- Add an asset manifest or data file, if not already present, to keep content separate from animations.

All motion must be deterministic based on `useCurrentFrame()` and `useVideoConfig()`; use Remotion `interpolate` and `spring`. If GSAP is used, ensure it is driven from frame time with an appropriate Remotion-compatible integration; no wall-clock timelines. Avoid CSS infinite animation, `setTimeout`, uncontrolled `requestAnimationFrame`, or unseeded randomness for rendered visuals.

## Step 3 — 12-second motion proof of concept
**Format:** 1080x1920, 30fps, 360 frames, portrait, Arabic-first.

| Frames | Timing | Scene | Motion direction |
|---|---|---|---|
| 0–59 | 0–2s | Hook: `الموديل مش هو الـ BIM` | FocusDot guides gaze, Arabic word-by-word masked reveal, subtle impact |
| 60–134 | 2–4.5s | Structural model → coordination network | layered parallax and camera push; use approved available assets or placeholders |
| 135–224 | 4.5–7.5s | Before / After coordination | comparison wipe with visible labeling, highlight clash resolution concept without implying a real engineering result |
| 225–299 | 7.5–10s | `MODEL → COORDINATE → CHECK → DELIVER` | four-step animated ProgressNavigator with connected motion |
| 300–359 | 10–12s | Elmekawy BIM CTA | FocusDot resolves into branded end frame, logo if provided, otherwise text-based mark |

**Visual direction:** premium dark-tech, intentional negative space, restrained cyan glow, purposeful typography, tight rhythm, semantic transitions rather than unrelated slides.

**Audio:** If licensed audio assets exist, synchronize optional whoosh/impact cues. If not, leave a clean silent composition and document required SFX. Do not download copyrighted audio.

## Step 4 — Asset planning and manual prompts
- Audit existing images in `public/assets/` first.
- For every missing image, create `prompts/V2_ASSET_PROMPTS.md` with: asset ID, scene, intended composition, a copyable English prompt, negative constraints, aspect ratio, recommended filename, and destination path.
- The user will manually generate and approve assets, then place them in the project. **Do not call any image generation service.**
- Add branded fallback placeholders so the composition can preview without missing files. Clearly label placeholders and list them in the final report.

## Step 5 — QA and rendering
- Validate scene timing adds up to 360 frames; avoid unintended gaps or black frames.
- Check RTL, Arabic glyph joining, mixed-direction English words, safe areas, text legibility on mobile, aspect ratio, and image crops.
- Check all animations against frame-seek rendering. No animation may depend on preview playback history.
- Run available typecheck/lint/build commands based on actual `package.json` scripts. Report skipped checks.
- Render to `out/elmekawy-bim-v2-motion-test.mp4` using `npx remotion render ElmekawyBIMIntroV2 out/elmekawy-bim-v2-motion-test.mp4` only after composition is registered.
- Confirm output file exists and probe its duration, dimensions, frame rate and codec if tools are available.
- Keep original V1 composition in V2 copy for side-by-side comparison.

## Step 6 — Documentation and handoff
Create or update:
- `docs/V2_MOTION_DESIGN_SYSTEM.md`: tokens, presets, component usage and screenshots/preview guidance.
- `docs/V2_CHANGELOG.md`: files added/modified, rationale, known issues.
- `docs/V2_QA.md`: tests run, render details, outstanding assets, checklist.
- `prompts/V2_ASSET_PROMPTS.md`: manual image-generation prompts.

After the 12-second test is approved, propose—but **do not yet implement**—a full 30-second V2 upgrade using the same reusable components.

## Required assistant behavior
Start by responding with:
1. Confirmed absolute path of the V2 working directory.
2. Existing project architecture and composition IDs.
3. Files to create/change and any dependencies needed.
4. Risks and missing assets.
5. A short implementation plan.
Then implement step by step in V2 only. Stop and ask if a destructive action, new paid dependency, or major architectural rewrite is required.
