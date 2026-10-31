# V2 motion design system

Scope: 12 seconds only. `ElmekawyBIMIntroV2`, 1080×1920, 30 fps, 360 frames.
The copied `ElmekawyBIMIntro` remains available at 900 frames with original six
scenes, logo handling and audio. Never render or edit inside the sibling V1 project.

## Visual language

Reuse `src/brand/theme.ts`: navy #003060, blue #055C9D, cyan #0E86D4,
light blue #68BBE3; dark ink background; local Cairo Arabic and Inter Latin.
Shared light, frame and line connect the scenes. Grid and restrained glow support
the typography. Primary content stays inside x=100…900, y=220…1560. Decorative
structural-image bounds can extend beyond this text safe area.

## Motion API

`src/motion/tokens.ts`: 18-frame reveal, five-frame word stagger, spring damping 19,
stiffness 150, mass 0.8, Bézier (0.16,1,0.3,1), clamp and safe-area constants.
Fixed frame timings target this 30 fps proof.

`presets.ts` exports pure functions: `fade`, `maskReveal`, `overshoot(frame,fps)`,
`cameraPush`, `parallax`, `stagger`, `morph`. Morph changes shared bounds and corner
radius; it is a morph-like transition, not a path topology engine. Animation values
depend only on the requested frame. No CSS animation, timers, wall-clock timeline
or unseeded randomness is used. GSAP stays installed; this test needs no GSAP timeline.

## Reusable components

| Component | API and behavior |
| --- | --- |
| ArabicWordReveal | `text`, `delay`, `wordOffset`, `style`; spaces only, RTL parent, isolated Latin words, masks joined Arabic words |
| FocusDot | Global frame-based light outside scene Sequences; survives cuts |
| LayeredScene | `background`, `midground`, `foreground`, `duration`; camera push and independent depth offsets |
| ComparisonReveal | `before`, `after`; BEFORE hold, AFTER wipe, split settle; persistent labels |
| ProgressNavigator | `steps: {label, arabic}[]`; connected route, 18-frame active-step intervals |
| V2Asset | `asset`, `available`, `fallback`, optional image style; metadata gate and decode-error fallback |

```tsx
<ArabicWordReveal text="الموديل مش هو الـ BIM" delay={2}/>
<LayeredScene duration={75} background={image} midground={shade} foreground={network}/>
<ComparisonReveal before={beforeVisual} after={afterVisual}/>
```

`src/v2/data.ts` separates asset paths/status, workflow copy and timing summary
from animation. `Scenes.tsx` owns scene copy/layout; `Composition.tsx` has explicit
named Sequences for Studio editing. Keep its boundaries aligned with the data summary.

## Timing and transitions

| Inclusive frames | Scene | Frames |
| --- | --- | --- |
| 0–59 | Hook: الموديل مش هو الـ BIM | 60 |
| 60–134 | Model → network | 75 |
| 135–224 | Illustrative before/after | 90 |
| 225–299 | MODEL → COORDINATE → CHECK → DELIVER | 75 |
| 300–359 | Elmekawy BIM CTA | 60 |

Total 360; no scheduled gaps. Semantic cuts share the persistent light/background;
the model dims into a network, comparison wipes, workflow connects, and the CTA
container rounds into place. Text holds after its reveal for reading.

## Preview and screenshots

From V2, run `npm.cmd run dev`, select `ElmekawyBIMIntroV2`, and compare with
`ElmekawyBIMIntro` in the same project. For reproducible PNGs:

```console
npm.cmd run build
node scripts/render-v2-review.mjs
```

Review `out/review/v2-045.png` (hook), 110 (network), 165/200 (wipe), 285
(workflow), 345 (CTA), plus both sides of all cuts. Four captures are repeated
nonsequentially and PNG hashes compared. This checks separate capture pages in
one browser process; it does not replace manual Studio scrubbing or a real mobile
publishing preview. See `V2_QA.md` for actual results and limitations.

## Proposed next phase, after approval only

30 seconds: hook 0–3s; structural/network 3–9s; comparison 9–16s; workflow and
services 16–24s; brand/CTA 24–30s. Reuse these components, replace approved
comparison assets, refine pacing and add licensed local SFX. No full V2 implemented.
