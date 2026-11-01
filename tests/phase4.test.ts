import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { setTimeout as pause } from 'node:timers/promises';
import { zipSync, unzipSync } from 'fflate';
import {
  brandProfiles,
  flexibleEditableOf,
  newFlexibleScene,
  fitScenesToDuration,
  parseFlexibleProject,
  projectWarnings,
  outputProfiles,
  upgradeFlexibleDocument,
} from '@elmekawy/shared/flexible';
import { editableOf, defaultImageLayout } from '@elmekawy/shared';
import type { Project, RenderJob } from '@elmekawy/shared';
import type {
  FlexibleProject,
  FlexibleCreate,
  SupportedSceneType,
} from '@elmekawy/shared/flexible';
import { createMediaFixtures } from './phase4-fixtures.ts';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
  directory = path.join(root, '.studio/test-runs/phase4-' + randomUUID());
await fs.mkdir(directory, { recursive: true });
const listener = net.createServer();
await new Promise<void>((resolve) => listener.listen(0, '127.0.0.1', resolve));
const address = listener.address();
assert.ok(address && typeof address !== 'string');
const port = address.port;
await new Promise<void>((resolve) => listener.close(() => resolve()));
const host = spawn(process.execPath, ['scripts/launcher-host.mjs'], {
  cwd: root,
  env: { ...process.env, STUDIO_DATA_ROOT: directory, STUDIO_PORT: String(port) },
  windowsHide: true,
  stdio: ['pipe', 'pipe', 'pipe'],
});
let logs = '';
host.stdout.on('data', (data) => (logs += data));
host.stderr.on('data', (data) => (logs += data));
const done = new Promise((resolve) => host.once('close', resolve)),
  origin = 'http://127.0.0.1:' + port;
let token = '';
for (let i = 0; i < 150; i++) {
  try {
    const response = await fetch(origin + '/api/session');
    if (response.ok) {
      token = (await response.json()).token;
      break;
    }
  } catch {}
  if (host.exitCode !== null) break;
  await pause(100);
}
if (!token) {
  host.kill();
  throw Error(logs);
}
after(async () => {
  host.stdin.end('shutdown\n');
  await done;
  await fs.writeFile(path.join(directory, 'server.log'), logs);
});
const request = (url: string, method = 'GET', body?: unknown, revision?: number) =>
  fetch(origin + url, {
    method,
    headers: {
      'X-Studio-Token': token,
      'Content-Type': 'application/json',
      ...(revision ? { 'If-Match': '"r' + revision + '"' } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
async function value<T>(response: Response): Promise<T> {
  const json = await response.json();
  assert.ok(response.ok, JSON.stringify(json));
  return json;
}
const base = (project: FlexibleProject) => '/api/flexible/projects/' + project.id;
const body: FlexibleCreate = {
  name: 'Revit course 30s',
  client: 'Course client',
  objective: 'فيديو دورة Revit',
  brandProfileId: brandProfiles[2].profileId,
  displayName: 'REVIT COURSE',
  colors: brandProfiles[2].colors,
  durationFrames: 900,
  sceneTypes: ['kinetic-title', 'media-showcase', 'offer-cta'],
  libraryImageId: 'structural',
  approveImage: true,
  crf: 24,
};
async function upload(url: string, file: Uint8Array, name: string, revision?: number) {
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(file)]), name);
  return fetch(origin + url, {
    method: 'POST',
    headers: {
      'X-Studio-Token': token,
      ...(revision ? { 'If-Match': '"r' + revision + '"' } : {}),
    },
    body: form,
  });
}
let project: FlexibleProject, legacy: Project, mediaFiles: { video: string; audio: string };
test('new version enables all nine scenes and three profiles while old documents remain frozen', async () => {
  project = await value(await request('/api/flexible/projects', 'POST', body));
  assert.equal(project.schemaVersion, '2.1.0');
  assert.equal(project.template.version, '1.1.0');
  const fixture = JSON.parse(
    await fs.readFile(
      path.join(root, 'packages/templates/src/flexible-reel/1.0.0/sample.json'),
      'utf8',
    ),
  ) as FlexibleProject;
  assert.equal(parseFlexibleProject(fixture).schemaVersion, '2.0.0');
  for (const type of [
    'ui-demo',
    'product-hero',
    'before-after',
    'data-explainer',
  ] as SupportedSceneType[]) {
    const next = upgradeFlexibleDocument(fixture);
    next.scenes = fitScenesToDuration(
      [
        newFlexibleScene(
          type,
          'new-scene',
          next.assets.find((asset) => asset.kind === 'image'),
        ),
        next.scenes[0],
        next.scenes[4],
      ],
      600,
    );
    assert.equal(parseFlexibleProject(next).scenes[0].type, type);
  }
  for (const output of outputProfiles) {
    const created = await value<FlexibleProject>(
      await request('/api/flexible/projects', 'POST', { ...body, outputProfileId: output.id }),
    );
    assert.equal(created.outputProfile.aspectRatio, output.aspectRatio);
    assert.ok(
      created.outputProfile.height - created.brand.safeArea.top - created.brand.safeArea.bottom >=
        400,
    );
  }
});
test('legacy image editing is explicit, scene-local, persisted and duplicated without changing the source project', async () => {
  const original = await value<Project>(
    await request('/api/projects', 'POST', {
      name: 'Legacy source',
      client: 'Client',
      objective: 'Image controls',
      templateId: 'bim-motion-study',
    }),
  );
  legacy = await value(
    await request(
      '/api/projects/' + original.id + '/image-editing-copy',
      'POST',
      {},
      original.revision,
    ),
  );
  assert.equal(legacy.template.version, '1.2.0');
  assert.notEqual(legacy.id, original.id);
  const edit = editableOf(legacy),
    asset = legacy.assets.find((asset) => asset.role === 'structural')!;
  edit.imageLayouts = {
    network: {
      [asset.id]: {
        ...defaultImageLayout(),
        frame: { x: 0.4, y: 0.55, width: 0.75, height: 0.8 },
        transform: { scale: 1.3, offsetX: 0.1, offsetY: -0.1 },
      },
    },
  };
  legacy = await value(await request('/api/projects/' + legacy.id, 'PUT', edit, legacy.revision));
  const source = await value<Project>(await request('/api/projects/' + original.id));
  assert.equal(source.template.version, '1.1.0');
  assert.equal(source.imageLayouts, undefined);
  const descriptor = await value<{ inputProps: { imageLayouts: unknown } }>(
    await request('/api/projects/' + legacy.id + '/resolve', 'POST', {}),
  );
  assert.deepEqual(descriptor.inputProps.imageLayouts, edit.imageLayouts);
  const duplicate = await value<Project>(
    await request('/api/projects/' + legacy.id + '/duplicate', 'POST', {
      name: 'Independent images',
    }),
  );
  assert.deepEqual(duplicate.imageLayouts, legacy.imageLayouts);
  const archive = await fetch(origin + '/api/projects/' + legacy.id + '/archive');
  assert.equal(archive.status, 200);
  const imported = await value<{ format: string; project: Project }>(
    await upload(
      '/api/project-archives/import',
      new Uint8Array(await archive.arrayBuffer()),
      'legacy.zip',
    ),
  );
  assert.equal(imported.format, 'legacy');
  assert.deepEqual(imported.project.imageLayouts, legacy.imageLayouts);
});
test('real video/audio upload probes and decodes bytes and rejects mislabeled or corrupt payloads', async () => {
  mediaFiles = await createMediaFixtures(root, directory);
  const scene = project.scenes.find((scene) => scene.type === 'media-showcase')!;
  assert.equal(
    (await upload(base(project) + '/media', Buffer.from('not MP4'), 'fake.mp4', project.revision))
      .status,
    415,
  );
  const fake = Buffer.alloc(40);
  fake.write('ftyp', 4);
  assert.equal(
    (await upload(base(project) + '/media', fake, 'fake.mp4', project.revision)).status,
    422,
  );
  project = await value(
    await upload(
      base(project) + '/assets/' + scene.id,
      await fs.readFile(mediaFiles.video),
      '../../source.html',
      project.revision,
    ),
  );
  const video = project.assets.find((asset) => asset.kind === 'video')!;
  assert.equal(video.mimeType, 'video/mp4');
  assert.ok(video.metadata!.durationSeconds >= 30);
  assert.equal(video.metadata!.hasAudio, true);
  assert.equal(video.approval, 'pending');
  assert.equal(
    (await request(base(project) + '/renders', 'POST', { revision: project.revision })).status,
    422,
  );
  project = await value(
    await request(
      base(project) + '/review/' + video.id,
      'POST',
      { approved: true, sourceNote: 'ملف فيديو محلي راجعته.' },
      project.revision,
    ),
  );
  project = await value(
    await upload(
      base(project) + '/media',
      await fs.readFile(mediaFiles.audio),
      'voice.wav',
      project.revision,
    ),
  );
  const audio = project.assets.find((asset) => asset.kind === 'audio')!;
  project = await value(
    await request(
      base(project) + '/review/' + audio.id,
      'POST',
      { approved: true, sourceNote: 'تعليق صوتي محلي.' },
      project.revision,
    ),
  );
  const descriptor = await value<{ inputProps: { media: Record<string, string> } }>(
    await request(base(project) + '/resolve', 'POST', {}),
  );
  assert.equal(
    (await fetch(descriptor.inputProps.media[video.id], { headers: { Range: 'bytes=0-15' } }))
      .status,
    206,
  );
});
test('prompt review, audio timeline, beats and silence survive saves and invalid overlaps are rejected', async () => {
  const edit = flexibleEditableOf(project),
    audio = project.assets.find((asset) => asset.kind === 'audio')!;
  edit.prompts = [
    {
      id: 'prompt-review',
      sceneId: project.scenes[1].id,
      text: 'وصف يدوي للصورة',
      negativeConstraints: 'بدون كتابة',
      source: 'موقع خارجي استخدمته يدويًا',
      status: 'draft',
      assetId: null,
    },
  ];
  edit.audio = {
    mode: 'timeline',
    tracks: [
      {
        id: 'voice-track',
        assetId: audio.id,
        assetSha256: audio.sha256,
        role: 'voiceover',
        startFrame: 0,
        trimStartFrame: 0,
        durationFrames: 870,
        volume: 0.8,
        fadeInFrames: 15,
        fadeOutFrames: 15,
      },
    ],
    beats: [0, 60, 120],
    pauses: [{ id: 'closing-pause', startFrame: 870, durationFrames: 30, label: 'وقفة النهاية' }],
  };
  project = await value(await request(base(project), 'PUT', edit, project.revision));
  assert.deepEqual(project.audio, edit.audio);
  assert.deepEqual(projectWarnings(project), []);
  const invalid = flexibleEditableOf(project);
  if (invalid.audio?.mode === 'timeline') invalid.audio.pauses[0].startFrame = 800;
  assert.equal((await request(base(project), 'PUT', invalid, project.revision)).status, 422);
  const image = await fs.readFile(
    path.join(root, 'shared-assets/defaults/1.0.0/bim-technology.png'),
  );
  project = await value(
    await upload(
      base(project) + '/media?promptId=prompt-review',
      image,
      'manual-result.png',
      project.revision,
    ),
  );
  const prompt = project.prompts![0];
  assert.equal(prompt.status, 'uploaded');
  assert.ok(prompt.assetId);
  project = await value(
    await request(
      base(project) + '/review/' + prompt.assetId,
      'POST',
      { approved: true, sourceNote: 'اعتماد نتيجة توليد يدوي.' },
      project.revision,
    ),
  );
  assert.equal(project.prompts![0].status, 'approved');
});
test('ZIP roundtrip includes immutable media and history, rejects traversal/tampering and restores a new revision', async () => {
  const response = await fetch(origin + base(project) + '/archive');
  assert.equal(response.status, 200);
  const bytes = new Uint8Array(await response.arrayBuffer());
  await fs.writeFile(path.join(directory, 'project-backup.zip'), bytes);
  const imported = await value<{ format: string; project: FlexibleProject }>(
    await upload('/api/project-archives/import', bytes, 'backup.zip'),
  );
  assert.notEqual(imported.project.id, project.id);
  assert.deepEqual(imported.project.scenes, project.scenes);
  assert.deepEqual(imported.project.audio, project.audio);
  assert.deepEqual(imported.project.prompts, project.prompts);
  assert.ok(imported.project.assets.every((asset) => asset.storage.scope === 'project'));
  const list = await value<{ revision: number }[]>(
    await request(base(imported.project) + '/history'),
  );
  assert.ok(list.length >= 4);
  const before = imported.project.revision;
  const restored = await value<FlexibleProject>(
    await request(
      base(imported.project) + '/restore',
      'POST',
      { revision: list[0].revision },
      before,
    ),
  );
  assert.equal(restored.revision, before + 1);
  assert.equal(
    (
      await request(
        base(imported.project) + '/restore',
        'POST',
        { revision: list[0].revision },
        before,
      )
    ).status,
    412,
  );
  const traversal = zipSync({ '../outside.txt': Buffer.from('bad') });
  assert.equal((await upload('/api/project-archives/import', traversal, 'bad.zip')).status, 422);
  const files = unzipSync(bytes);
  files['project.json'] = Buffer.from('{}');
  assert.equal(
    (await upload('/api/project-archives/import', zipSync(files), 'tampered.zip')).status,
    422,
  );
});
test('explicit upgrade and restoration preserve old flexible rendering and retained media URLs', async () => {
  const old = JSON.parse(
    await fs.readFile(
      path.join(root, 'packages/templates/src/flexible-reel/1.0.0/sample.json'),
      'utf8',
    ),
  ) as FlexibleProject;
  old.id = 'recover--' + randomUUID().replaceAll('-', '');
  old.revision = 1;
  const folder = path.join(directory, 'flexible-projects', old.id);
  for (const child of ['assets/images', 'history', 'renders'])
    await fs.mkdir(path.join(folder, child), { recursive: true });
  await fs.writeFile(path.join(folder, 'project.json'), JSON.stringify(old));
  let upgraded = await value<FlexibleProject>(
    await request(base(old) + '/upgrade', 'POST', {}, old.revision),
  );
  assert.equal(upgraded.schemaVersion, '2.1.0');
  const scene = upgraded.scenes.find((scene) => scene.type === 'media-showcase')!;
  upgraded = await value(
    await upload(
      base(upgraded) + '/assets/' + scene.id,
      await fs.readFile(mediaFiles.video),
      'source.mp4',
      upgraded.revision,
    ),
  );
  const video = upgraded.assets.find((asset) => asset.kind === 'video')!;
  const descriptor = await value<{ inputProps: { media: Record<string, string> } }>(
    await request(base(upgraded) + '/resolve', 'POST', {}),
  );
  const restored = await value<FlexibleProject>(
    await request(base(upgraded) + '/restore', 'POST', { revision: 1 }, upgraded.revision),
  );
  assert.equal(restored.schemaVersion, '2.0.0');
  assert.equal(restored.template.version, '1.0.0');
  assert.deepEqual(restored.scenes, old.scenes);
  assert.equal(
    (await fetch(descriptor.inputProps.media[video.id], { method: 'HEAD' })).status,
    200,
  );
});

test('legacy image replacement rebinds scene transforms to its new immutable file', async () => {
  const oldAsset = legacy.assets.find(
    (asset) => asset.role === 'structural' && asset.state === 'ready',
  )!;
  const updated = await value<Project>(
    await upload(
      '/api/projects/' + legacy.id + '/assets/structural',
      await fs.readFile(path.join(root, 'shared-assets/defaults/1.0.0/bim-technology.png')),
      'replacement.png',
      legacy.revision,
    ),
  );
  const replacement = updated.assets.find(
    (asset) => asset.role === 'structural' && asset.state === 'ready',
  )!;
  assert.notEqual(replacement.id, oldAsset.id);
  assert.equal(updated.assets.find((asset) => asset.id === oldAsset.id)?.state, 'retired');
  assert.equal(updated.imageLayouts!.network[replacement.id].frame.width, 0.75);
  assert.equal(updated.imageLayouts!.network[oldAsset.id], undefined);
});

test('30-second reel exports real video and audio with the saved timeline frozen', async () => {
  const frozen = project.revision;
  let job = await value<RenderJob>(
    await request(base(project) + '/renders', 'POST', { revision: frozen }),
  );
  const edit = flexibleEditableOf(project);
  edit.name = 'Later edit';
  project = await value(await request(base(project), 'PUT', edit, project.revision));
  for (let i = 0; i < 3000; i++) {
    job = await value(await request('/api/renders/' + job.id));
    if (['completed', 'failed', 'cancelled', 'interrupted'].includes(job.state)) break;
    await pause(100);
  }
  const folder = path.join(directory, 'flexible-projects', project.id, 'renders', job.id);
  assert.equal(job.state, 'completed', await fs.readFile(path.join(folder, 'render.log'), 'utf8'));
  const probe = JSON.parse(await fs.readFile(path.join(folder, 'probe.json'), 'utf8'));
  assert.equal(
    Number(
      probe.streams.find((stream: { codec_type: string }) => stream.codec_type === 'video')
        .nb_frames,
    ),
    900,
  );
  assert.ok(probe.streams.some((stream: { codec_type: string }) => stream.codec_type === 'audio'));
  const snapshot = JSON.parse(
    await fs.readFile(path.join(folder, 'project.snapshot.json'), 'utf8'),
  );
  assert.equal(snapshot.revision, frozen);
  assert.deepEqual(snapshot.audio, project.audio);
  await fs.writeFile(
    path.join(directory, 'report.json'),
    JSON.stringify({
      passed: true,
      output: path.join(folder, 'output.mp4'),
      checks:
        'all scenes, profiles, legacy image controls, real media validation, prompt review, audio timeline, archive recovery, 30s audiovisual export',
    }),
  );
});
