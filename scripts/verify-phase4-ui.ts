import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { setTimeout as pause } from 'node:timers/promises';
import { openBrowser } from '@remotion/renderer';
import { browserPath } from '@elmekawy/motion-engine/server';
import type { FlexibleProject, FlexibleDescriptor } from '@elmekawy/shared/flexible';
import type { Project, RenderJob } from '@elmekawy/shared';
import { createMediaFixtures } from '../tests/phase4-fixtures.ts';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
  directory = path.join(root, '.studio/test-runs/phase4-ui-' + randomUUID());
await fs.mkdir(directory, { recursive: true });
const socket = net.createServer();
await new Promise<void>((resolve) => socket.listen(0, '127.0.0.1', resolve));
const address = socket.address();
assert.ok(address && typeof address !== 'string');
const port = address.port;
await new Promise<void>((resolve) => socket.close(() => resolve()));
const origin = 'http://127.0.0.1:' + port,
  host = spawn(process.execPath, ['scripts/launcher-host.mjs'], {
    cwd: root,
    env: { ...process.env, STUDIO_DATA_ROOT: directory, STUDIO_PORT: String(port) },
    windowsHide: true,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
let logs = '',
  token = '';
host.stdout.on('data', (data) => (logs += data));
host.stderr.on('data', (data) => (logs += data));
const done = new Promise((resolve) => host.once('close', resolve));
let browser: Awaited<ReturnType<typeof openBrowser>> | undefined, failure: unknown;
const checks: string[] = [];
try {
  for (let i = 0; i < 150; i++) {
    try {
      const response = await fetch(origin + '/api/session');
      if (response.ok) {
        token = (await response.json()).token;
        break;
      }
    } catch {}
    await pause(100);
  }
  assert.ok(token, logs);
  async function post<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(origin + url, {
      method: 'POST',
      headers: { 'X-Studio-Token': token, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    assert.ok(response.ok, JSON.stringify(result));
    return result;
  }
  const original = await post<Project>('/api/projects', {
    name: 'UI legacy image source',
    client: 'Local client',
    objective: 'Image controls',
    templateId: 'bim-motion-study',
  });
  const fixtures = await createMediaFixtures(root, directory);
  browser = await openBrowser('chrome', {
    browserExecutable: browserPath(root),
    chromeMode: 'headless-shell',
    logLevel: 'error',
  });
  const errors: string[] = [];
  const page = await browser.newPage({
    context: () => null,
    logLevel: 'error',
    indent: false,
    pageIndex: 0,
    onBrowserLog: (log) => {
      if (log.type === 'error' && !log.text.includes('favicon')) errors.push(log.text);
    },
    onLog: () => {},
  });
  await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
  async function wait(predicate: () => Promise<boolean>, label: string) {
    for (let i = 0; i < 300; i++) {
      if (await predicate()) return;
      await pause(100);
    }
    throw Error(label + ' / ' + (await page.evaluate(() => document.body.innerText.slice(-3000))));
  }
  const exists = (selector: string) =>
    page.evaluate((value: string) => !!document.querySelector(value), selector);
  async function click(selector: string) {
    await wait(
      () =>
        page.evaluate((value: string) => {
          const element = document.querySelector<HTMLButtonElement>(value);
          return !!element && !element.disabled;
        }, selector),
      'Button ' + selector,
    );
    await page.evaluate(
      (value: string) => document.querySelector<HTMLElement>(value)!.click(),
      selector,
    );
    await pause(60);
  }
  async function fill(selector: string, value: string) {
    await wait(() => exists(selector), 'Input ' + selector);
    await page.evaluate(
      ({ selector, value }: { selector: string; value: string }) => {
        const element = document.querySelector<
          HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >(selector)!;
        const prototype =
          element instanceof HTMLSelectElement
            ? HTMLSelectElement.prototype
            : element instanceof HTMLTextAreaElement
              ? HTMLTextAreaElement.prototype
              : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(element, value);
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      },
      { selector, value },
    );
    await pause(80);
  }
  async function upload(selector: string, file: string, mime: string) {
    await wait(() => exists(selector), 'File ' + selector);
    const content = (await fs.readFile(file)).toString('base64');
    await page.evaluate(
      ({
        selector,
        content,
        name,
        mime,
      }: {
        selector: string;
        content: string;
        name: string;
        mime: string;
      }) => {
        const transfer = new DataTransfer();
        transfer.items.add(
          new File([Uint8Array.from(atob(content), (character) => character.charCodeAt(0))], name, {
            type: mime,
          }),
        );
        const element = document.querySelector<HTMLInputElement>(selector)!;
        element.files = transfer.files;
        element.dispatchEvent(new Event('change', { bubbles: true }));
      },
      { selector, content, name: path.basename(file), mime },
    );
    await pause(150);
  }
  async function screenshot(name: string) {
    const result = await page
      ._client()
      .send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await fs.writeFile(
      path.join(directory, name + '.png'),
      Buffer.from(result.value.data, 'base64'),
    );
  }
  async function flexible() {
    const id = await page.evaluate(() =>
      document.querySelector('[data-testid=flexible-editor]')?.getAttribute('data-project-id'),
    );
    assert.ok(id);
    return (await (await fetch(origin + '/api/flexible/projects/' + id)).json()) as FlexibleProject;
  }
  async function currentWhen(predicate: (value: FlexibleProject) => boolean) {
    await wait(async () => predicate(await flexible()), 'Saved project state');
    return flexible();
  }
  await page.goto({ url: origin, timeout: 30000 });
  await click('[data-testid=enable-legacy-images]');
  await wait(() => exists('[data-testid=legacy-image-select]'), 'Legacy image controls');
  await page.evaluate(() => {
    const button = [...document.querySelectorAll<HTMLButtonElement>('[role=tab]')].find((button) =>
      button.textContent?.includes('حجم وموضع الصور'),
    );
    button!.click();
  });
  await fill('[data-testid=image-width]', '75');
  await fill('[data-testid=image-zoom]', '135');
  await fill('[data-testid=image-x]', '40');
  await wait(
    () =>
      page.evaluate(() => {
        const image = document.querySelector<HTMLElement>('[data-image-scope] img');
        return (
          !!image &&
          getComputedStyle(image).objectFit === 'cover' &&
          getComputedStyle(image).transform !== 'none'
        );
      }),
    'Live legacy transform',
  );
  await screenshot('legacy-image-size-and-position');
  await click('#save-project');
  const list = (await (await fetch(origin + '/api/projects')).json()) as { projects: Project[] };
  const legacy = list.projects.find((project) => project.template.version === '1.2.0')!;
  assert.ok(legacy);
  const asset = legacy.assets.find((asset) => asset.role === 'structural')!;
  assert.equal(legacy.imageLayouts!.network[asset.id].frame.width, 0.75);
  assert.equal(legacy.imageLayouts!.network[asset.id].transform.scale, 1.35);
  assert.equal(
    (await (await fetch(origin + '/api/projects/' + original.id)).json()).template.version,
    '1.1.0',
  );
  checks.push('legacy image tab creates independent 1.2.0 copy; live size/position/zoom save');
  await click('[data-testid=new-flexible-nav]');
  await fill('[data-testid=wizard-name]', 'UI Revit course 30s');
  await fill('[data-testid=wizard-client]', 'Course client');
  await fill('[data-testid=wizard-goal]', 'شرح دورة Revit بفيديو وصوت محليين');
  await click('[data-testid=wizard-next]');
  await fill('[data-testid=wizard-brand]', 'custom-client');
  await fill('[data-testid=wizard-brand-name]', 'REVIT COURSE');
  await click('[data-testid=wizard-next]');
  await fill('[data-testid=wizard-duration]', '30');
  await click('[data-testid=wizard-next]');
  await click('[data-testid=wizard-approve]');
  await click('[data-testid=wizard-next]');
  await click('[data-testid=wizard-create]');
  await wait(() => exists('[data-testid=flexible-editor]'), 'Flexible editor');
  let project = await flexible(),
    mediaScene = project.scenes.find((scene) => scene.type === 'media-showcase')!;
  await click('[data-testid=flex-scene-select][data-scene-id="' + mediaScene.id + '"]');
  await upload('[data-testid=editor-image-file]', fixtures.video, 'video/mp4');
  project = await currentWhen((project) => project.assets.some((asset) => asset.kind === 'video'));
  await click('[data-testid=approve-image]');
  await currentWhen((project) =>
    project.assets.some((asset) => asset.kind === 'video' && asset.approval === 'approved'),
  );
  await click('[data-testid=add-audio-track]');
  await click('[data-testid=flex-save]');
  project = await currentWhen(
    (project) => project.audio.mode === 'timeline' && project.audio.tracks.length === 1,
  );
  assert.equal(project.audio.mode, 'timeline');
  checks.push(
    '30s course created via wizard; real video uploaded/reviewed; audible track added via UI',
  );
  await click('[data-testid=add-prompt]');
  await fill('[data-testid=prompt-text]', 'لقطة تعليمية نظيفة لمشروع Revit');
  await click('[data-testid=flex-save]');
  await currentWhen((project) => project.prompts?.[0]?.text.includes('Revit') ?? false);
  checks.push('scene-linked manual prompt saved via UI');
  for (const profile of [
    'square-1080p30-h264-v1',
    'landscape-1080p30-h264-v1',
    'portrait-1080p30-h264-v1',
  ]) {
    await fill('[data-testid=editor-output-profile]', profile);
    await wait(
      () => page.evaluate(() => document.querySelector('.player-error') === null),
      'Profile preview',
    );
    await click('[data-testid=flex-save]');
    await currentWhen((project) => project.outputProfile.id === profile);
  }
  checks.push('portrait/square/landscape change, preview and save');
  project = await flexible();
  await page.evaluate(() =>
    document.querySelector('[data-testid=flex-export]')!.scrollIntoView({ block: 'center' }),
  );
  await screenshot('revit-video-audio-editor');
  await click('[data-testid=flex-export]');
  let job: RenderJob | undefined;
  for (let i = 0; i < 3000; i++) {
    const jobs = (await (
      await fetch(origin + '/api/flexible/projects/' + project.id + '/renders')
    ).json()) as RenderJob[];
    job = jobs[0];
    if (job && ['completed', 'failed', 'cancelled', 'interrupted'].includes(job.state)) break;
    await pause(100);
  }
  assert.equal(job?.state, 'completed', job?.error);
  const folder = path.join(directory, 'flexible-projects', project.id, 'renders', job!.id);
  const probe = JSON.parse(await fs.readFile(path.join(folder, 'probe.json'), 'utf8'));
  assert.equal(
    Number(
      probe.streams.find((stream: { codec_type: string }) => stream.codec_type === 'video')
        .nb_frames,
    ),
    900,
  );
  assert.ok(probe.streams.some((stream: { codec_type: string }) => stream.codec_type === 'audio'));
  await promisify(execFile)(
    path.join(root, 'node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe'),
    [
      '-v',
      'error',
      '-i',
      path.join(folder, 'output.mp4'),
      '-c:v',
      'rawvideo',
      '-c:a',
      'pcm_s16le',
      '-f',
      'null',
      '-',
    ],
    { windowsHide: true, timeout: 60000, maxBuffer: 1024 ** 2 },
  );
  checks.push('UI exported and fully decoded 30s MP4 with video and audio');
  const zip = path.join(directory, 'ui-project-backup.zip');
  await fs.writeFile(
    zip,
    Buffer.from(
      await (
        await fetch(origin + '/api/flexible/projects/' + project.id + '/archive')
      ).arrayBuffer(),
    ),
  );
  await upload('[data-testid=project-archive-import]', zip, 'application/zip');
  await wait(async () => {
    try {
      return (await flexible()).id !== project.id;
    } catch {
      return false;
    }
  }, 'Imported project');
  const imported = await flexible();
  assert.deepEqual(imported.audio, project.audio);
  assert.equal(
    imported.assets.every((asset) => asset.storage.scope === 'project'),
    true,
  );
  checks.push(
    'ZIP import through UI opens independent project with media, prompts, audio and history',
  );
  await fill('[data-testid=history-revision]', String(imported.revision - 1));
  await click('[data-testid=restore-revision]');
  await currentWhen((project) => project.revision === imported.revision + 1);
  checks.push('history restore through UI creates a new revision');
  assert.deepEqual(errors, [], errors.join('\n'));
  await fs.writeFile(path.join(directory, 'output-location.txt'), path.join(folder, 'output.mp4'));
} catch (error) {
  failure = error;
  process.exitCode = 1;
} finally {
  try {
    await browser?.close({ silent: true });
  } finally {
    host.stdin.end('shutdown\n');
    await done;
    await fs.writeFile(
      path.join(directory, 'report.json'),
      JSON.stringify(
        {
          passed: !failure,
          checks,
          error: failure instanceof Error ? failure.stack : failure,
          serverLog: logs,
        },
        null,
        2,
      ),
    );
    console.log('Report: ' + path.join(directory, 'report.json'));
  }
}
if (failure) throw failure;
