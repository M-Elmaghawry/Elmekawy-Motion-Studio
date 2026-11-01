# V2 manual asset prompts

No generation services or integrations are used. Manually copy these prompts to
your image website, review the results, then download approved PNGs. These are
optional replacements for the **two missing comparison images**. No portrait is
needed for this test. Existing structural art and the supplied logo are reused.

## coordination-before

- Scene: comparison, frames 135–224.
- Intended composition: synthetic intersecting service routes; match camera and
  geometry to the AFTER image.
- Aspect ratio: 6:5 landscape, recommended 1440×1200; displayed crop 800×650.
- Filename: `coordination-before.png`.
- Destination: `public/assets/v2/coordination-before.png`.
- Copyable English prompt:

```text
Create an original synthetic BIM coordination concept illustration, not a real
engineering project. Orthographic isometric view of one simple structural bay,
three translucent concrete beams, one pale blue horizontal service route and one
warm amber service route visibly crossing at the center. Clean simplified CAD
geometry, premium dark navy background #003060 fading to #030D1B, cyan #0E86D4
and light blue #68BBE3 accents, restrained illumination. Center the geometry in
the middle 70 percent, generous clear space at top and bottom for labels added
later. Landscape 6:5. No text. Keep the camera, framing and structure suitable
for a matched before and after concept pair.
```

Negative constraints: no logos, watermark, text, people, real project identifiers,
certification marks, construction drawings, accuracy or real-project claims.

## coordination-after

- Scene: comparison, frames 135–224.
- Intended composition: matched illustrative routing alternative, not a verified result.
- Aspect ratio: 6:5 landscape, recommended 1440×1200.
- Filename: `coordination-after.png`.
- Destination: `public/assets/v2/coordination-after.png`.
- Copyable English prompt; manually attach your approved BEFORE image as reference:

```text
Using my supplied synthetic BEFORE coordination concept as a reference, preserve
the exact orthographic isometric camera, crop, structural bay, beams, materials,
lighting and navy background. Change only the warm amber service route into a
cyan illustrative offset route around the central intersection, with visibly
separated routes. This is conceptual visualization only, not engineering
validation. Premium restrained dark tech illustration, simple clear geometry,
same empty top and bottom margins, landscape 6:5. No text or annotations.
```

Negative constraints: no changed camera, extra beams, real project labels, logos,
watermark, compliance stamps, numerical results or professional approval claims.

## Loading and audio

Create `public/assets/v2/` when you have approved files. Both files must exist
before the image pair is selected. Until then, the comparison uses two original
SVG schematics labeled `SCHEMATIC PLACEHOLDER`. The Arabic illustrative disclaimer
remains after replacement. Reload Studio or rerender to refresh metadata. Check
matching geometry and crops manually; file presence alone does not approve an asset.

The existing MP3 has no documented license in this repository. V2 is silent.
Optional future licensed local cues: impact at frame 22, network whoosh at 60,
comparison sweep at 147, workflow ticks at 225/243/261/279, CTA resolve at 320.
