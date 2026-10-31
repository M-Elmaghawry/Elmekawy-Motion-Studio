# Elmekawy BIM Personal Brand Reel — MVP 01

Local Remotion / React / TypeScript production. Composition: **ElmekawyBIMIntro**.
1080 × 1920, 30 fps, 900 frames / 30 seconds. Silent H.264 MP4.

## Preview and export

From this directory (PowerShell uses npm.cmd / npx.cmd if script execution is restricted):

```console
npm.cmd run dev
npm.cmd run lint
npm.cmd run build
npx.cmd remotion render ElmekawyBIMIntro out/elmekawy-bim-intro.mp4 --codec=h264 --crf=18 --pixel-format=yuv420p --concurrency=2
```

Studio normally opens at http://localhost:3000/ElmekawyBIMIntro.
The first render may download Remotion's free Chrome Headless Shell.
All subsequent rendering uses local assets and fonts; no paid APIs or cloud rendering.

## Structure

- src/brand/theme.ts: colors, fonts, safe margins.
- src/scene-data.ts: copy, asset paths, service data and scene timing.
- src/components/: deterministic reveal, image push, blueprint and local font loading.
- src/scenes/: six independent scene components.
- src/Composition.tsx: scene sequencing and progress line.
- src/Root.tsx: composition registration and asset presence checks.

Scene starts: 0, 4, 9, 15, 21, 26 seconds. Incoming scenes crossfade over
12 frames; outgoing scenes extend by 12 frames so the total remains exactly 900.
Scene-local useCurrentFrame, spring and interpolate drive every animation.
No CSS animation loops, timers, random values or GSAP timelines.

## Assets

User-supplied generated visuals:
- public/assets/generated/bim-infrastructure.png
- public/assets/generated/structural-bim.png
- public/assets/generated/bim-technology.png

Optional actual portrait: public/assets/personal/profile.png.
Missing images use vector blueprint or ME monogram placeholders. No personal photographs
are fabricated. Composition metadata checks asset availability at preview/render time;
image decode failures also switch to a placeholder.

Cairo and Inter variable fonts are stored in public/fonts with their OFL licenses.
Font loading blocks frame capture until both font faces are ready.
Arabic uses Cairo, RTL and intact word/line shaping. Latin fragments use bdi and LTR.

Critical content stays inside x=100..900 and y=220..1560.
Platform UI varies; inspect the actual publishing preview before posting.

No audio is included. Add music only after supplying a licensed local file.
Keep the existing Remotion license terms in mind for your organization:
https://www.remotion.dev/license

## Review

See docs/production-log.md for checks and production status.
Review frames are in out/review (ignored by Git).
