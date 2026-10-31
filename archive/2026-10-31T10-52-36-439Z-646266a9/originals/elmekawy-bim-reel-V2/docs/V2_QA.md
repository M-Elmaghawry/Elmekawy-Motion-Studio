# V2 QA — 2026-10-31 (Asia/Riyadh)

Working directory: `D:\zz-CODING\Elmekawy-Motion-Studio\elmekawy-bim-reel-V2`.
Master brief read completely before implementation. No writes or installs in V1.
Environment actually used: Node 24.19.0, npm 11.17.0, Remotion 4.0.539,
React 19.2.3, TypeScript 5.9.3. No dependency changes.

## Inspection and preservation

- Inspected package/scripts, config, strict TS config, every existing scene,
  composition registration, animation helpers, fonts, assets, README and log.
- Baseline: `ElmekawyBIMIntro`, 1080×1920, 30 fps, 900 frames; scene durations
  120/150/180/180/150/120 with 12-frame incoming crossfades/outgoing extensions.
- GSAP installed but unused. Existing animations derive from frame values;
  no animation timers, CSS loops or unseeded random values found.
- Existing generated images: infrastructure, structural, technology, all 1152×2048.
  Logo: 1000×1000 transparent PNG. Local Cairo/Inter and OFL files present.
  MP3 present, license not documented. The historical log's silence and missing
  portrait statements conflict with the current source: baseline plays this MP3
  and uses the logo for its portrait key. That source behavior was preserved.
- Pre-edit hashes recorded. `node scripts/verify-baseline.mjs` **PASS**:
  28 original V1 files and 27 unchanged copied baseline files match their hashes;
  original composition registration is identical. Root and README are the only
  existing copied files intentionally modified. Snapshots cover listed files,
  not dependency directories or old V1 render outputs.

## Checks actually run

| Check | Actual result |
| --- | --- |
| Baseline `npm.cmd run lint` before implementation | PASS |
| V2 `npm.cmd run lint` (ESLint + `tsc`) | PASS after removing redundant `from={0}` flagged on first run |
| `npm.cmd run build` | PASS; production bundle in V2 `build/` |
| `npx.cmd remotion compositions` | PASS; both V1 900f and V2 360f listed at 1080×1920 / 30 fps |
| `node scripts/render-v2-review.mjs` | PASS; 17 sampled V2 frames, four identical repeated capture hashes, two fallback captures and copied V1 still |
| `node scripts/verify-baseline.mjs` after render | PASS; same preservation counts |
| Full V2 MP4 render | PASS; 360 frames rendered and encoded |
| FFprobe | PASS; exact metadata below |
| Full video decode using bundled FFmpeg and rawvideo/null | PASS; exit 0, no decode errors |
| Encoded CTA extraction at 11.5 seconds | PASS; PNG visually inspected |

V2 schedule: 0–59, 60–134, 135–224, 225–299, 300–359. The five durations
60+75+90+75+60 = **360**. No scheduled gaps or overlaps.

## Frame and visual review

Captured frames: **0, 45, 59, 60, 110, 134, 135, 165, 200, 224, 225, 245,
285, 299, 300, 345, 359**. Actual hashes and detected asset availability are in
`out/review/render-checks.json`.

- Visually inspected full-size 45, 110, 200, 285 and 345; boundary contact sheet
  includes 0/59/60/134/135/224/225/299/300/359. Header, background and focus light
  persist across cuts. Text begins its reveal at scene starts; these are
  intentional entrances, not black frames or missing scenes.
- RTL order, Arabic joining, Latin BIM direction and Cairo loading checked in
  rendered output. Words are never split into isolated Arabic letters.
- Main text and CTA fit the portrait safe area, with no visible clipping or
  overlap in inspected frames. Structural crop retains the building and network.
  Small captions/URL need final review on the target phone/platform.
- Comparison has visible BEFORE/AFTER labels, a moving wipe and a split end state.
  Placeholder label and Arabic concept-only disclaimer are present; no real
  engineering result is claimed.
- The supplied white logo is visible against dark navy in the rendered CTA.
- Missing structural image and logo states rendered at frames 110 and 345 and
  were visually inspected; structural schematic and ME text fallback appeared.
- Copied baseline frame 45 rendered and visually inspected. Baseline full-video
  re-export was unnecessary and was not run.
- Repeated frames **200, 45, 345, 110** after later captures: identical PNG SHA256
  hashes. This checks nonsequential requested-frame rendering on separate capture
  pages in one browser process. Continuous interactive Studio scrubbing and a
  same-page seek-history test were **not run**; there is no wall-clock animation
  or animation state in the new components.

Review artifacts:

- `out/review/v2-boundaries.png`: labeled boundary contact sheet.
- `out/review/v2-*.png`: full-resolution sampled frames.
- `out/review/fallback-structural.png`, `fallback-mark.png`: forced missing assets.
- `out/review/baseline-v1.png`: unchanged copied baseline example.
- `out/review/v2-encoded-cta.png`: extracted from the actual MP4.

## Export details

Command actually run from V2:

```console
npx.cmd remotion render ElmekawyBIMIntroV2 out/elmekawy-bim-v2-motion-test.mp4 --concurrency=2
```

Output: `out/elmekawy-bim-v2-motion-test.mp4`, **2,473,057 bytes**.

| Property | FFprobe result |
| --- | --- |
| Codec | H.264 |
| Dimensions | 1080×1920 |
| Rate | 30/1 fps (nominal and average) |
| Duration | 12.000000 seconds |
| Frame count | 360 |
| Pixel format | yuvj420p |
| Streams | One video stream; no audio |

SHA256: `CACD607C054CB02F81D1FA694C11CBDB161CCE279C113A22A9073ABE71241E6E`.
Raw probe output is `out/review/v2-ffprobe.json`.

Probe/decode commands (bundled executables, no system install):

```console
node_modules/@remotion/compositor-win32-x64-msvc/ffprobe.exe -v error -show_entries stream=index,codec_type,codec_name,width,height,pix_fmt,r_frame_rate,avg_frame_rate,nb_frames,duration -show_entries format=duration,size -of json out/elmekawy-bim-v2-motion-test.mp4
node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe -hide_banner -v error -i out/elmekawy-bim-v2-motion-test.mp4 -map 0:v:0 -c:v rawvideo -f null -
```

## Tooling attempts and limitations

- Initial composition listing failed downloading Chrome Headless Shell with
  sandbox `EACCES`. Rerun with approved escalation downloaded free Remotion
  Headless Shell in V2 successfully; subsequent rendering used local assets.
- The two missing-image HEAD checks return expected 404s; metadata selects the
  schematic pair. These are not failed frame renders.
- Bundled FFmpeg lacks `xstack`, so its first contact-sheet attempt failed.
  Python was unavailable. Windows System.Drawing then created the contact sheet
  successfully. Neither issue affects the rendered video or required checks.
- No standalone test script exists in package.json. Its actual lint and build
  scripts were used, plus the purpose-specific preservation/render checks.
- No live Studio UI automation, real-phone/platform review, full playback pacing
  approval, replacement-image crop approval or audio sync check was performed.
  Audio sync is inapplicable to this silent test.

## Outstanding assets and handoff

- Missing `public/assets/v2/coordination-before.png` and `coordination-after.png`.
  Current render uses **two labeled schematic placeholders**. Manual prompts,
  constraints, dimensions and destinations: `prompts/V2_ASSET_PROMPTS.md`.
- Existing structural visual and logo detected and used. Missing/decode-error
  fallbacks are implemented; forced missing states tested, corrupt-file decode
  simulation was not performed.
- Licensed optional SFX remain outstanding; V2 deliberately stays silent because
  existing MP3 licensing is undocumented.
- Ready for user review of this 12-second proof. The 30-second upgrade is proposed
  in `V2_MOTION_DESIGN_SYSTEM.md` and has **not** been implemented.
