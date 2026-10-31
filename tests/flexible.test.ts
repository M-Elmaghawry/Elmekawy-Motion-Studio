import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {
  compileTimeline,
  scenesAtFrame,
  parseFlexibleProject,
  parseProjectDocument,
  renderReadinessErrors,
  motionProgress,
  reservedSceneTypes,
} from '@elmekawy/shared/flexible';
import type { TimelineInput, FlexibleProject } from '@elmekawy/shared/flexible';
import { projectSchema } from '@elmekawy/shared';

const samplePath = new URL(
  '../packages/templates/src/flexible-reel/1.0.0/sample.json',
  import.meta.url,
);
const fixture = JSON.parse(await fs.readFile(samplePath, 'utf8')) as FlexibleProject;
const fresh = () => structuredClone(fixture);

test('expanded JSON sample roundtrips as a separate flexible schema without input mutation', () => {
  const input = fresh(),
    snapshot = structuredClone(input),
    schemaSnapshot = JSON.stringify(projectSchema);
  const parsed = parseFlexibleProject(input);
  assert.deepEqual(input, snapshot);
  assert.notEqual(parsed, input);
  assert.deepEqual(parseProjectDocument(JSON.parse(JSON.stringify(parsed))), parsed);
  parsed.scenes[0].content = { headline: 'Changed independently' };
  assert.deepEqual(input, snapshot);
  assert.equal(JSON.stringify(projectSchema), schemaSnapshot);
});

test('schema dispatch still accepts a real legacy project and rejects unsupported schema/template versions', async () => {
  const folder = new URL('../projects/', import.meta.url);
  const [id] = (await fs.readdir(folder)).filter((name) => name.startsWith('elmekawy-bim-v1--'));
  const legacy = JSON.parse(await fs.readFile(new URL(id + '/project.json', folder), 'utf8'));
  assert.deepEqual(parseProjectDocument(legacy), legacy);
  for (const schemaVersion of ['3.0.0', '2.1.0', null])
    assert.throws(
      () => parseProjectDocument({ ...fixture, schemaVersion }),
      /UNSUPPORTED_SCHEMA_VERSION/,
    );
  const wrong = fresh();
  (wrong.template.version as string) = '9.0.0';
  assert.throws(() => parseFlexibleProject(wrong));
  assert.throws(() => parseFlexibleProject({ ...fixture, schemaVersion: '1.0.0' }));
});

test('strict nested schemas reject unknown fields, coercion, reserved scenes and executable-style paths', () => {
  assert.throws(() => parseFlexibleProject({ ...fixture, injected: true }));
  const coercion = fresh();
  (coercion.targetDurationFrames as unknown) = '600';
  assert.throws(() => parseFlexibleProject(coercion));
  for (const type of reservedSceneTypes) {
    const input = fresh();
    (input.scenes[0].type as string) = type;
    assert.throws(() => parseFlexibleProject(input));
  }
  for (const bad of [
    '../outside.ttf',
    'C:/Windows/test.ttf',
    '//server/share/font.ttf',
    'assets/../font.ttf',
    'assets/CON.ttf',
  ]) {
    const input = fresh();
    input.assets[0].storage.path = bad;
    assert.throws(() => parseFlexibleProject(input), bad);
  }
  const transition = fresh();
  Object.assign(transition.scenes[0].transitionOut, { cssAnimation: 'spin' });
  assert.throws(() => parseFlexibleProject(transition));
});

test('references, duplicate IDs, finite stats, motion budgets and target duration are enforced', () => {
  const mutations: ((project: FlexibleProject) => void)[] = [
    (p) => {
      p.assets[1].id = p.assets[0].id;
    },
    (p) => {
      p.scenes[1].id = p.scenes[0].id;
    },
    (p) => {
      p.brand.fonts.arabicAssetId = 'missing';
    },
    (p) => {
      p.scenes[2].mediaBindings[0].assetSha256 = '0'.repeat(64);
    },
    (p) => {
      p.scenes[2].mediaBindings[0].assetId = 'font-cairo';
    },
    (p) => {
      if (p.scenes[1].type === 'stat-proof') p.scenes[1].content.value = Infinity;
    },
    (p) => {
      p.scenes[0].motion.enterFrames = 180;
    },
    (p) => {
      p.targetDurationFrames++;
    },
    (p) => {
      p.scenes[0].motion.id = 'count-up';
    },
    (p) => {
      if (p.scenes[3].type === 'process-flow')
        p.scenes[3].content.steps[1].id = p.scenes[3].content.steps[0].id;
    },
  ];
  for (const mutate of mutations) {
    const input = fresh();
    mutate(input);
    assert.throws(() => parseFlexibleProject(input));
  }
});

test('approval is draft-valid but prevents rendering a required unapproved image', () => {
  const input = fresh();
  input.assets[2].approval = 'pending';
  const draft = parseFlexibleProject(input);
  assert.deepEqual(renderReadinessErrors(draft), ['UNAPPROVED_ASSET:showcase-image']);
  assert.deepEqual(renderReadinessErrors(fixture), []);
});

test('image size, independent zoom, position and fit survive save/reopen and cannot exceed bounds', () => {
  const input = fresh(),
    binding = input.scenes[2].mediaBindings[0];
  binding.frame = { x: 0.4, y: 0.6, width: 0.75, height: 0.8 };
  binding.transform = { scale: 1.2, offsetX: -0.1, offsetY: 0.1 };
  binding.fit = 'contain';
  assert.deepEqual(
    parseFlexibleProject(JSON.parse(JSON.stringify(input))).scenes[2].mediaBindings[0],
    binding,
  );
  assert.equal(fixture.scenes[2].mediaBindings[0].transform.scale, 1);
  for (const scale of [0, 3.01, NaN]) {
    const invalid = fresh();
    invalid.scenes[2].mediaBindings[0].transform.scale = scale;
    assert.throws(() => parseFlexibleProject(invalid));
  }
});

test('20s timeline accounts for exactly 600 frames with predictable transition endpoints', () => {
  const timeline = compileTimeline(fixture.scenes);
  assert.equal(timeline.durationFrames, 600);
  assert.deepEqual(
    timeline.scenes.map((scene) => scene.startFrame),
    [0, 117, 234, 351, 468],
  );
  assert.deepEqual(
    timeline.scenes.map((scene) => scene.endFrame),
    [132, 249, 366, 483, 600],
  );
  assert.deepEqual(
    scenesAtFrame(timeline, 117).map((scene) => [scene.id, scene.localFrame, scene.opacity]),
    [
      ['hook', 117, 1],
      ['proof', 0, 0],
    ],
  );
  assert.equal(scenesAtFrame(timeline, 131)[1].opacity, 1);
  assert.deepEqual(
    scenesAtFrame(timeline, 132).map((scene) => scene.id),
    ['proof'],
  );
  assert.deepEqual(
    scenesAtFrame(timeline, 599).map((scene) => scene.id),
    ['cta'],
  );
  for (const frame of [-1, 600, 1.5]) assert.throws(() => scenesAtFrame(timeline, frame));
});

const cut = { type: 'cut', durationFrames: 0 } as const;
test('single-frame scenes, adjacent cuts and minimum two-frame crossfades do not duplicate frames', () => {
  const inputs: TimelineInput[] = [
    { id: 'a', durationFrames: 1, transitionOut: cut },
    { id: 'b', durationFrames: 1, transitionOut: cut },
  ];
  const cuts = compileTimeline(inputs);
  assert.equal(cuts.durationFrames, 2);
  assert.deepEqual(
    scenesAtFrame(cuts, 0).map((scene) => scene.id),
    ['a'],
  );
  assert.deepEqual(
    scenesAtFrame(cuts, 1).map((scene) => scene.id),
    ['b'],
  );
  const fade = compileTimeline([
    { id: 'a', durationFrames: 3, transitionOut: { type: 'crossfade', durationFrames: 2 } },
    { id: 'b', durationFrames: 3, transitionOut: cut },
  ]);
  assert.equal(fade.durationFrames, 4);
  assert.equal(scenesAtFrame(fade, 1)[1].opacity, 0);
  assert.equal(scenesAtFrame(fade, 2)[1].opacity, 1);
});

test('invalid timing rejects gaps from negative/short fades, consumed scenes and nonfinal cuts', () => {
  for (const duration of [-1, 0, 1, 10, 10.5]) {
    const scenes: TimelineInput[] = [
      {
        id: 'a',
        durationFrames: 10,
        transitionOut: { type: 'crossfade', durationFrames: duration },
      },
      { id: 'b', durationFrames: 10, transitionOut: cut },
    ];
    assert.throws(() => compileTimeline(scenes));
  }
  assert.throws(() => compileTimeline([]));
  assert.throws(() =>
    compileTimeline([
      { id: 'a', durationFrames: 10, transitionOut: { type: 'crossfade', durationFrames: 2 } },
    ]),
  );
  assert.throws(() =>
    compileTimeline([
      { id: 'a', durationFrames: 5, transitionOut: { type: 'crossfade', durationFrames: 3 } },
      { id: 'b', durationFrames: 5, transitionOut: { type: 'crossfade', durationFrames: 3 } },
      { id: 'c', durationFrames: 5, transitionOut: cut },
    ]),
  );
});

test('fixed-seed schedule exploration covers every frame with at most two active scenes', () => {
  let seed = 49;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed;
  };
  for (let sample = 0; sample < 100; sample++) {
    const count = 3 + (random() % 6);
    const inputs: TimelineInput[] = Array.from({ length: count }, (_, i) => ({
      id: 'scene-' + i,
      durationFrames: 40 + (random() % 40),
      transitionOut:
        i === count - 1 || random() % 2
          ? cut
          : { type: 'crossfade', durationFrames: 2 + (random() % 12) },
    }));
    const timeline = compileTimeline(inputs);
    for (let frame = 0; frame < timeline.durationFrames; frame++) {
      const active = scenesAtFrame(timeline, frame);
      assert.ok(active.length >= 1 && active.length <= 2);
      assert.equal(active[0].opacity, 1);
      for (const scene of active) {
        assert.ok(scene.localFrame >= 0 && scene.localFrame < scene.durationFrames);
        assert.ok(scene.opacity >= 0 && scene.opacity <= 1);
      }
    }
    const reversed = inputs.toReversed().map((scene, i, all) => ({
      ...scene,
      transitionOut: i === all.length - 1 ? cut : scene.transitionOut,
    }));
    assert.ok(compileTimeline(reversed).durationFrames > 0);
  }
});

test('motion sampling is a seek-stable pure function and supports linear/reduced-motion clocks', () => {
  const frames = [0, 20, 4, 23, 4];
  assert.equal(
    motionProgress(frames[2], 24, 'ease-out'),
    motionProgress(frames[4], 24, 'ease-out'),
  );
  assert.equal(motionProgress(0, 24, 'linear'), 0);
  assert.equal(motionProgress(23, 24, 'linear'), 1);
  assert.equal(motionProgress(-1, 24, 'ease-out'), 0);
  assert.equal(motionProgress(100, 24, 'ease-out'), 1);
});

test('retiming and reordering recompile saved JSON without changing the target or scene identity', () => {
  const input = fresh();
  input.scenes[0].durationFrames += 12;
  input.scenes[1].durationFrames -= 12;
  const parsed = parseFlexibleProject(input),
    timeline = compileTimeline(parsed.scenes);
  assert.equal(timeline.durationFrames, 600);
  assert.equal(timeline.scenes[1].startFrame, 129);
  [input.scenes[0], input.scenes[1]] = [input.scenes[1], input.scenes[0]];
  const reordered = compileTimeline(parseFlexibleProject(input).scenes);
  assert.equal(reordered.scenes[0].id, 'proof');
  assert.equal(reordered.durationFrames, 600);
  assert.equal(fixture.scenes[0].durationFrames, 132);
});
