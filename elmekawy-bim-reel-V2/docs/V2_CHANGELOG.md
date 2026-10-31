# V2 changelog — 2026-10-31 (Asia/Riyadh)

## Added

- `src/motion/tokens.ts`, `presets.ts`: shared frame-based motion vocabulary.
- `src/components/motion/{ArabicWordReveal,FocusDot,ComparisonReveal,ProgressNavigator,LayeredScene}.tsx`:
  reusable typography, continuity, wipe, workflow and parallax components.
- `src/v2/{data.ts,Visuals.tsx,Scenes.tsx,Composition.tsx}`: isolated 12-second
  proof, local asset detection, labeled original schematics.
- `scripts/verify-baseline.mjs`: read-only original V1 hashes, copied baseline
  hashes and original composition registration check.
- `scripts/render-v2-review.mjs`: actual metadata assertions, sampled frames,
  repeated capture hashes, missing-asset captures and copied V1 still.
- `docs/V2_BASELINE_HASHES.json`, `V1_READONLY_HASHES.json`: pre-edit snapshots
  of source, media, packages/config and documentation.
- This changelog, `V2_MOTION_DESIGN_SYSTEM.md`, `V2_QA.md`, and manual prompts
  in `prompts/V2_ASSET_PROMPTS.md`.

## Modified

- `src/Root.tsx`: fragment around original registration; separate V2 registration.
  Original metadata function and registration are preserved.
- `README.md`: V2 commands, baseline audio/logo audit and documentation links.

No package/dependency, baseline scene, shared V1 helper, theme, font, original asset
or Remotion config changes. Bundle and rendered outputs stay in V2 `build/` and `out/`.

Validation completed: lint/typecheck, production bundle, composition discovery,
sampled/repeated frame rendering, preservation hashes, full 12-second MP4 export,
FFprobe and full decode passed. See `V2_QA.md` for exact results and skipped checks.

## Known limitations

- Two comparison PNGs missing; original labeled SVG schematics are the placeholders.
- Reference videos were not supplied here; visual direction follows the written
  brief and original layouts, without reproducing another creator's shots.
- Audio license undocumented; V2 has no audio track.
- Historical README/production-log silence and portrait claims disagree with the
  copied code. Existing baseline audio and logo behavior are preserved.
- The proof illustrates coordination concepts; no project result or credential is invented.
