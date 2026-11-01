import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import { randomUUID, createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { setTimeout as pause } from 'node:timers/promises';
import {
  brandProfiles,
  flexibleEditableOf,
  compileTimeline,
  moveScene,
  resizeImageFrame,
  defaultBinding,
} from '@elmekawy/shared/flexible';
import type {
  FlexibleProject,
  FlexibleCreate,
  FlexibleDescriptor,
} from '@elmekawy/shared/flexible';
import type { RenderJob } from '@elmekawy/shared';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
  directory = path.join(root, '.studio/test-runs/flexible-editor-' + randomUUID());
await fs.mkdir(directory, { recursive: true });
const socket = net.createServer();
await new Promise<void>((resolve) => socket.listen(0, '127.0.0.1', resolve));
const address = socket.address();
assert.ok(address && typeof address !== 'string');
const port = address.port;
await new Promise<void>((resolve) => socket.close(() => resolve()));
const child = spawn(process.execPath, ['scripts/launcher-host.mjs'], {
  cwd: root,
  env: { ...process.env, STUDIO_DATA_ROOT: directory, STUDIO_PORT: String(port) },
  windowsHide: true,
  stdio: ['pipe', 'pipe', 'pipe'],
});
let logs = '';
child.stdout.on('data', (data) => {
  logs += data;
});
child.stderr.on('data', (data) => {
  logs += data;
});
const done = new Promise((resolve) => child.once('close', resolve));
const origin = 'http://127.0.0.1:' + port;
let token = '';
for (let attempt = 0; attempt < 150; attempt++) {
  try {
    const response = await fetch(origin + '/api/session');
    if (response.ok) {
      token = (await response.json()).token;
      break;
    }
  } catch {}
  if (child.exitCode !== null) break;
  await pause(100);
}
if (!token) {
  child.kill();
  throw new Error('Isolated flexible API failed: ' + logs);
}
after(async () => {
  if (child.exitCode === null) child.stdin.end('shutdown\n');
  await done;
  await fs.writeFile(
    path.join(directory, 'TEST_RUN.md'),
    'Flexible editor API tests; isolated data only.\n' + logs,
  );
});
const request = (route: string, method = 'GET', body?: unknown, revision?: number) =>
  fetch(origin + route, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Studio-Token': token,
      ...(revision ? { 'If-Match': '"r' + revision + '"' } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
const url = (project: FlexibleProject) => '/api/flexible/projects/' + project.id;
async function projectResponse(response: Response) {
  const value = await response.json();
  assert.ok(response.ok, JSON.stringify(value));
  return value as FlexibleProject;
}
const createBody = (profileIndex = 0, seconds = 20): FlexibleCreate => ({
  name: 'مشروع واجهة ' + profileIndex,
  client: brandProfiles[profileIndex].label,
  objective: 'فيديو محلي من الواجهة',
  brandProfileId: brandProfiles[profileIndex].profileId,
  displayName: brandProfiles[profileIndex].displayName,
  colors: { ...brandProfiles[profileIndex].colors },
  durationFrames: seconds * 30,
  sceneTypes: ['kinetic-title', 'stat-proof', 'media-showcase', 'process-flow', 'offer-cta'],
  libraryImageId: 'structural',
  approveImage: false,
  crf: 18,
});
let project: FlexibleProject;
test('wizard options and two brands create independent data-only projects with exact requested durations', async () => {
  const options = await (await request('/api/flexible/options')).json();
  assert.equal(options.brandProfiles.length, 3);
  assert.equal(options.images.length, 3);
  project = await projectResponse(await request('/api/flexible/projects', 'POST', createBody()));
  const second = await projectResponse(
    await request('/api/flexible/projects', 'POST', createBody(1, 25)),
  );
  assert.notEqual(second.id, project.id);
  assert.equal(compileTimeline(project.scenes).durationFrames, 600);
  assert.equal(compileTimeline(second.scenes).durationFrames, 750);
  assert.notDeepEqual(second.brand.colors, project.brand.colors);
  const folder = path.join(directory, 'flexible-projects', project.id);
  const files = await fs.readdir(folder);
  assert.ok(files.includes('project.json'));
  for (const file of ['node_modules', 'src', 'package.json'])
    assert.equal(files.includes(file), false);
  assert.deepEqual((await (await request('/api/projects')).json()).projects, []);
  assert.equal((await (await request('/api/flexible/projects')).json()).projects.length, 2);
});
test('flexible API rejects forged ownership/asset fields, unsupported formats and missing or stale revisions', async () => {
  assert.equal(
    (
      await fetch(origin + '/api/flexible/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      })
    ).status,
    403,
  );
  assert.equal(
    (await request('/api/flexible/projects', 'POST', { ...createBody(), id: project.id })).status,
    400,
  );
  assert.equal(
    (await request('/api/flexible/projects', 'POST', { ...createBody(), aspectRatio: '1:1' }))
      .status,
    400,
  );
  const edit = flexibleEditableOf(project);
  assert.equal((await request(url(project), 'PUT', edit)).status, 428);
  assert.equal(
    (await request(url(project), 'PUT', { ...edit, assets: [] }, project.revision)).status,
    422,
  );
  assert.equal(
    (await request(url(project), 'PUT', { ...edit, revision: 100 }, project.revision)).status,
    422,
  );
  assert.equal((await request(url(project), 'PUT', edit, project.revision + 1)).status, 412);
  assert.equal(
    (await request(url(project) + '/renders', 'POST', { revision: project.revision })).status,
    422,
  );
});
test('Unicode text, scene reorder and image transforms persist with immutable history and concurrent protection', async () => {
  const before = structuredClone(project),
    edit = flexibleEditableOf(project);
  edit.scenes[0].content = { headline: 'نص محفوظ من المحرر', subtitle: 'Arabic / English' };
  edit.scenes = moveScene(edit.scenes, 2, 1);
  edit.scenes[1].mediaBindings[0].frame.width = 0.75;
  edit.scenes[1].mediaBindings[0].frame.height = 0.75;
  edit.scenes[1].mediaBindings[0].fit = 'contain';
  edit.scenes[1].mediaBindings[0].transform.scale = 1.25;
  project = await projectResponse(await request(url(project), 'PUT', edit, project.revision));
  assert.equal(project.revision, 2);
  assert.equal(project.scenes[1].type, 'media-showcase');
  assert.equal(project.scenes[1].mediaBindings[0].frame.width, 0.75);
  const reloaded = await projectResponse(await request(url(project)));
  assert.deepEqual(reloaded, project);
  const history = JSON.parse(
    await fs.readFile(
      path.join(directory, 'flexible-projects', project.id, 'history/revision-1.json'),
      'utf8',
    ),
  );
  assert.deepEqual(history, before);
  const outcomes = await Promise.all([
    request(url(project), 'PUT', flexibleEditableOf(project), 2),
    request(url(project), 'PUT', flexibleEditableOf(project), 2),
  ]);
  assert.deepEqual(outcomes.map((response) => response.status).sort(), [200, 412]);
  project = await projectResponse(await request(url(project)));
});
test('locked frame sizing preserves aspect and clamps both dimensions; reset keeps the same asset binding', () => {
  const original = defaultBinding('image', '0'.repeat(64));
  original.frame.width = 0.8;
  original.frame.height = 1.2;
  const resized = resizeImageFrame(original, 'width', 1.5, true);
  assert.equal(resized.frame.height, 1.5);
  assert.equal(resized.frame.width, 1);
  assert.equal(original.frame.width, 0.8);
  const unlocked = resizeImageFrame(original, 'height', 0.5, false);
  assert.equal(unlocked.frame.width, 0.8);
  assert.equal(unlocked.frame.height, 0.5);
  const reset = defaultBinding(resized.assetId, resized.assetSha256);
  assert.equal(reset.transform.scale, 1);
  assert.equal(reset.frame.width, 1);
  assert.equal(reset.assetId, original.assetId);
});
test('manual replacement decodes real bytes, retains prior assets and requires explicit review', async () => {
  const old = project.assets.find((asset) => asset.kind === 'image')!,
    mediaScene = project.scenes.find((scene) => scene.type === 'media-showcase')!;
  let body = new FormData();
  body.append('file', new Blob(['not a PNG'], { type: 'image/png' }), 'fake.png');
  let response = await fetch(origin + url(project) + '/assets/' + mediaScene.id, {
    method: 'POST',
    headers: { 'X-Studio-Token': token, 'If-Match': '"r' + project.revision + '"' },
    body,
  });
  assert.equal(response.status, 415);
  const bytes = await fs.readFile(
    path.join(root, 'shared-assets/defaults/1.0.0/bim-technology.png'),
  );
  body = new FormData();
  body.append('file', new Blob([bytes], { type: 'image/png' }), '../../unsafe.html');
  response = await fetch(origin + url(project) + '/assets/' + mediaScene.id, {
    method: 'POST',
    headers: { 'X-Studio-Token': token, 'If-Match': '"r' + project.revision + '"' },
    body,
  });
  project = await projectResponse(response);
  const current = project.scenes.find((scene) => scene.id === mediaScene.id)!,
    asset = project.assets.find((asset) => asset.id === current.mediaBindings[0].assetId)!;
  assert.equal(asset.approval, 'pending');
  assert.match(asset.storage.path, /^assets\/images\/image-[a-f0-9]{32}\.png$/);
  assert.equal(project.assets.find((asset) => asset.id === old.id)?.sha256, old.sha256);
  assert.equal(current.mediaBindings[0].frame.width, 0.75);
  assert.equal(
    (await request(url(project) + '/renders', 'POST', { revision: project.revision })).status,
    422,
  );
  project = await projectResponse(
    await request(
      url(project) + '/review/' + asset.id,
      'POST',
      { approved: true, sourceNote: 'صورة توضيحية محلية راجعتها يدويًا.' },
      project.revision,
    ),
  );
  const descriptor = (await (
    await request(url(project) + '/resolve', 'POST', {})
  ).json()) as FlexibleDescriptor;
  const media = descriptor.inputProps.media[asset.id],
    head = await fetch(media, { method: 'HEAD' }),
    range = await fetch(media, { headers: { Range: 'bytes=0-7' } });
  assert.equal(head.status, 200);
  assert.equal(head.headers.get('content-type'), 'image/png');
  assert.equal(range.status, 206);
  assert.equal((await range.arrayBuffer()).byteLength, 8);
});
test('duplicated flexible media and transforms are independent, with no copied history/renders or dependencies', async () => {
  const copy = await projectResponse(
    await request(url(project) + '/duplicate', 'POST', { name: 'نسخة مستقلة' }),
  );
  assert.notEqual(copy.id, project.id);
  assert.deepEqual(copy.scenes, project.scenes);
  assert.equal(copy.revision, 1);
  const folder = path.join(directory, 'flexible-projects', copy.id);
  assert.deepEqual(await fs.readdir(path.join(folder, 'renders')), []);
  assert.deepEqual(await fs.readdir(path.join(folder, 'history')), []);
  assert.equal((await fs.readdir(folder)).includes('node_modules'), false);
  const asset = copy.assets.find((asset) => asset.kind === 'image')!,
    source = path.join(directory, 'flexible-projects', project.id, asset.storage.path),
    destination = path.join(folder, asset.storage.path);
  await fs.appendFile(destination, 'corrupt copy only');
  const digest = createHash('sha256')
    .update(await fs.readFile(source))
    .digest('hex');
  assert.equal(digest, asset.sha256);
  assert.equal((await request(url(copy) + '/resolve', 'POST', {})).status, 422);
});
test('real flexible queue freezes edited image transforms and serves a verified 20-second MP4', async () => {
  const frozen = project.revision,
    response = await request(url(project) + '/renders', 'POST', { revision: frozen });
  assert.equal(response.status, 202);
  let job = (await response.json()) as RenderJob;
  const edit = flexibleEditableOf(project);
  const media = edit.scenes.find((scene) => scene.type === 'media-showcase')!;
  media.mediaBindings[0].transform.scale = 1.5;
  project = await projectResponse(await request(url(project), 'PUT', edit, project.revision));
  for (let attempt = 0; attempt < 2400; attempt++) {
    job = await (await request('/api/renders/' + job.id)).json();
    if (['completed', 'failed', 'cancelled', 'interrupted'].includes(job.state)) break;
    await pause(100);
  }
  const folder = path.join(directory, 'flexible-projects', project.id, 'renders', job.id);
  assert.equal(job.state, 'completed', await fs.readFile(path.join(folder, 'render.log'), 'utf8'));
  const snapshot = JSON.parse(
    await fs.readFile(path.join(folder, 'project.snapshot.json'), 'utf8'),
  ) as FlexibleProject;
  assert.equal(snapshot.schemaVersion, '2.1.0');
  assert.equal(snapshot.revision, frozen);
  assert.equal(
    snapshot.scenes.find((scene) => scene.type === 'media-showcase')!.mediaBindings[0].transform
      .scale,
    1.25,
  );
  const probe = JSON.parse(await fs.readFile(path.join(folder, 'probe.json'), 'utf8'));
  const video = probe.streams.find(
    (stream: { codec_type: string }) => stream.codec_type === 'video',
  );
  assert.equal(Number(video.nb_frames), 600);
  assert.equal(Number(video.duration), 20);
  assert.equal(
    probe.streams.some((stream: { codec_type: string }) => stream.codec_type === 'audio'),
    false,
  );
  const download = await request('/api/renders/' + job.id + '/download');
  assert.equal(download.status, 200);
  assert.equal((await download.arrayBuffer()).byteLength, job.outputBytes);
  assert.deepEqual(await (await request('/api/projects')).json(), { projects: [], errors: [] });
  await fs.writeFile(
    path.join(directory, 'report.json'),
    JSON.stringify({
      passed: true,
      projectId: project.id,
      jobId: job.id,
      output: path.join(folder, 'output.mp4'),
      checks:
        'creation/brands, strict edits, transforms, history, upload/review, duplication, frozen render',
    }),
  );
});
