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
import type { FlexibleProject } from '@elmekawy/shared/flexible';
import type { RenderJob } from '@elmekawy/shared';

assert.equal(process.platform, 'win32', 'UI verification currently requires Windows x64.');
assert.equal(process.arch, 'x64');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
  directory = path.join(root, '.studio/test-runs/editor-ui-' + randomUUID());
await fs.access(path.join(root, 'apps/studio/dist/index.html'));
await fs.access(browserPath(root));
await fs.mkdir(directory, { recursive: true });
const listener = net.createServer();
await new Promise<void>((resolve) => listener.listen(0, '127.0.0.1', resolve));
const address = listener.address();
assert.ok(address && typeof address !== 'string');
const port = address.port;
await new Promise<void>((resolve) => listener.close(() => resolve()));
const origin = 'http://127.0.0.1:' + port,
  host = spawn(process.execPath, ['scripts/launcher-host.mjs'], {
    cwd: root,
    env: { ...process.env, STUDIO_DATA_ROOT: directory, STUDIO_PORT: String(port) },
    windowsHide: true,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
let logs = '';
host.stdout.on('data', (data) => {
  logs += data;
});
host.stderr.on('data', (data) => {
  logs += data;
});
const completion = new Promise((resolve) => host.once('close', resolve));
let browser: Awaited<ReturnType<typeof openBrowser>> | undefined, failure: unknown;
const checks: { name: string; passed: boolean }[] = [];
try {
  let ready = false;
  for (let attempt = 0; attempt < 150; attempt++) {
    try {
      if ((await fetch(origin + '/api/health')).ok) {
        ready = true;
        break;
      }
    } catch {}
    if (host.exitCode !== null) break;
    await pause(100);
  }
  assert.ok(ready, logs);
  browser = await openBrowser('chrome', {
    browserExecutable: browserPath(root),
    chromeMode: 'headless-shell',
    logLevel: 'error',
  });
  const browserErrors: string[] = [];
  const page = await browser.newPage({
    context: () => null,
    logLevel: 'error',
    indent: false,
    pageIndex: 0,
    onBrowserLog: (log) => {
      if (log.type === 'error' && !log.text.includes('favicon')) browserErrors.push(log.text);
    },
    onLog: () => {},
  });
  await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
  async function wait(selector: string) {
    for (let attempt = 0; attempt < 200; attempt++) {
      if (await page.evaluate((value: string) => !!document.querySelector(value), selector)) return;
      await pause(100);
    }
    throw new Error(
      'UI element not found: ' +
        selector +
        ' / ' +
        (await page.evaluate(() => document.body.innerText.slice(-2500))),
    );
  }
  async function click(selector: string) {
    await wait(selector);
    await page.evaluate((value: string) => {
      const element = document.querySelector<HTMLButtonElement>(value)!;
      if (element.disabled) throw new Error('Disabled button: ' + value);
      element.click();
    }, selector);
    await pause(50);
  }
  async function fill(selector: string, value: string) {
    await wait(selector);
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
    await pause(50);
  }
  async function saved() {
    for (let attempt = 0; attempt < 150; attempt++) {
      if (
        await page.evaluate(() =>
          document.querySelector('[data-testid=flex-save-state]')?.textContent?.startsWith('محفوظ'),
        )
      )
        return;
      await pause(100);
    }
    throw new Error('Editor did not reach a saved state.');
  }
  async function current() {
    const id = await page.evaluate(() =>
      document.querySelector('[data-testid=flexible-editor]')?.getAttribute('data-project-id'),
    );
    assert.ok(id);
    return (await (await fetch(origin + '/api/flexible/projects/' + id)).json()) as FlexibleProject;
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
  async function create(name: string, client: string, profile: string, seconds: number) {
    await click('[data-testid=new-flexible-nav]');
    await fill('[data-testid=wizard-name]', name);
    await fill('[data-testid=wizard-client]', client);
    await fill('[data-testid=wizard-goal]', 'اختبار الإنشاء والمعاينة والحفظ من الواجهة');
    await click('[data-testid=wizard-next]');
    await fill('[data-testid=wizard-brand]', profile);
    await click('[data-testid=wizard-next]');
    await fill('[data-testid=wizard-duration]', String(seconds));
    await click('[data-testid=wizard-next]');
    await click('[data-testid=wizard-approve]');
    await click('[data-testid=wizard-next]');
    await click('[data-testid=wizard-create]');
    await wait('[data-testid=flexible-editor]');
    await saved();
    return current();
  }
  await page.goto({ url: origin, timeout: 30000 });
  let project = await create('UI BIM 20s', 'Elmekawy BIM', 'elmekawy-bim', 20);
  const originalId = project.id;
  assert.equal(project.targetDurationFrames, 600);
  checks.push({ name: 'creates-20s-BIM-via-wizard', passed: true });
  console.log('PASS: UI wizard created 20s BIM project.');
  const mediaId = project.scenes.find((scene) => scene.type === 'media-showcase')!.id;
  await click('[data-testid=flex-scene-select][data-scene-id="' + mediaId + '"]');
  await wait('[data-media-image]');
  await fill('[data-testid=image-width]', '75');
  await fill('[data-testid=image-zoom]', '125');
  await fill('[data-testid=image-fit]', 'contain');
  await fill('[data-testid=scene-caption]', 'صورة محفوظة من الواجهة');
  assert.equal(
    await page.evaluate(
      () => document.querySelector<HTMLElement>('[data-media-frame]')?.style.width,
    ),
    '75%',
  );
  await click('[data-testid=image-reset]');
  assert.equal(
    await page.evaluate(
      () => (document.querySelector('[data-testid=image-width]') as HTMLInputElement).value,
    ),
    '100',
  );
  await fill('[data-testid=image-width]', '75');
  await fill('[data-testid=image-zoom]', '125');
  await fill('[data-testid=image-fit]', 'contain');
  await click('[data-testid=scene-up]');
  await fill('[data-testid=scene-duration]', '138');
  await click('[data-testid=add-scene]');
  assert.equal(
    await page.evaluate(() => document.querySelectorAll('[data-testid=flex-scene-select]').length),
    6,
  );
  await click('[data-testid=delete-scene]');
  assert.equal(
    await page.evaluate(() => document.querySelectorAll('[data-testid=flex-scene-select]').length),
    5,
  );
  await fill('[data-testid=total-duration]', '20');
  await click('[data-testid=flex-save]');
  await saved();
  project = await current();
  assert.equal(project.scenes[1].id, mediaId);
  assert.equal(project.scenes[1].mediaBindings[0].frame.width, 0.75);
  assert.equal(project.scenes[1].mediaBindings[0].frame.height, 0.75);
  assert.equal(project.scenes[1].mediaBindings[0].transform.scale, 1.25);
  assert.equal(project.scenes[1].mediaBindings[0].fit, 'contain');
  checks.push({ name: 'live-image-controls-reset-reorder-retime-add-delete-save', passed: true });
  console.log('PASS: UI image transforms and scene edits persisted.');
  await page.goto({ url: origin, timeout: 30000 });
  await click(
    '[data-testid=flexible-project-card][data-project-id="' +
      originalId +
      '"] [data-testid=open-flexible-project]',
  );
  await saved();
  await click('[data-testid=flex-scene-select][data-scene-id="' + mediaId + '"]');
  await wait('[data-testid=image-controls]');
  assert.equal(
    await page.evaluate(
      () => (document.querySelector('[data-testid=image-width]') as HTMLInputElement).value,
    ),
    '75',
  );
  await page.evaluate(() =>
    document.querySelector('[data-testid=image-controls]')!.scrollIntoView({ block: 'center' }),
  );
  await screenshot('image-controls-and-preview');
  checks.push({ name: 'reload-and-reopen-preserves-transforms', passed: true });
  await click('[data-testid=flex-duplicate]');
  for (let attempt = 0; attempt < 100; attempt++) {
    const shown = await page.evaluate(() =>
      document.querySelector('[data-testid=flexible-editor]')?.getAttribute('data-project-id'),
    );
    if (shown && shown !== originalId) break;
    await pause(100);
  }
  await saved();
  const copy = await current();
  assert.notEqual(copy.id, originalId);
  assert.deepEqual(copy.scenes, project.scenes);
  checks.push({ name: 'duplicates-saved-project-from-editor', passed: true });
  const khatwa = await create('UI Khatwa 25s', 'Khatwa Designs', 'khatwa-designs', 25);
  assert.equal(khatwa.targetDurationFrames, 750);
  assert.equal(khatwa.brand.profileId, 'khatwa-designs');
  assert.notDeepEqual(khatwa.brand.colors, project.brand.colors);
  checks.push({ name: 'creates-25s-Khatwa-with-different-brand', passed: true });
  console.log('PASS: UI wizard created 25s Khatwa with a different brand.');
  await click('[data-testid=projects-nav]');
  await wait('[data-testid=flexible-project-card][data-project-id="' + originalId + '"]');
  await screenshot('project-list');
  await click(
    '[data-testid=flexible-project-card][data-project-id="' +
      originalId +
      '"] [data-testid=open-flexible-project]',
  );
  await saved();
  await click('[data-testid=flex-export]');
  let job: RenderJob | undefined;
  for (let attempt = 0; attempt < 2400; attempt++) {
    const list = (await (
      await fetch(origin + '/api/flexible/projects/' + originalId + '/renders')
    ).json()) as RenderJob[];
    job = list[0];
    if (job && ['completed', 'failed', 'cancelled', 'interrupted'].includes(job.state)) break;
    await pause(100);
  }
  assert.ok(job);
  const folder = path.join(directory, 'flexible-projects', originalId, 'renders', job.id);
  assert.equal(job.state, 'completed', await fs.readFile(path.join(folder, 'render.log'), 'utf8'));
  await wait('[data-testid=flex-download]');
  const snapshot = JSON.parse(
    await fs.readFile(path.join(folder, 'project.snapshot.json'), 'utf8'),
  ) as FlexibleProject;
  assert.equal(snapshot.scenes[1].mediaBindings[0].frame.width, 0.75);
  assert.equal(snapshot.scenes[1].mediaBindings[0].transform.scale, 1.25);
  const probe = JSON.parse(await fs.readFile(path.join(folder, 'probe.json'), 'utf8'));
  const video = probe.streams.find(
    (stream: { codec_type: string }) => stream.codec_type === 'video',
  );
  assert.equal(Number(video.nb_frames), 600);
  assert.equal(Number(video.duration), 20);
  await promisify(execFile)(
    path.join(root, 'node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe'),
    ['-v', 'error', '-i', path.join(folder, 'output.mp4'), '-c:v', 'rawvideo', '-f', 'null', '-'],
    { windowsHide: true },
  );
  checks.push({ name: 'UI-export-uses-saved-transforms-and-fully-decodes-20s-MP4', passed: true });
  console.log('PASS: UI export verified and decoded.');
  await fs.writeFile(
    path.join(directory, 'outputs.json'),
    JSON.stringify(
      {
        projectId: originalId,
        copyId: copy.id,
        khatwaId: khatwa.id,
        output: path.join(folder, 'output.mp4'),
        browserErrors,
      },
      null,
      2,
    ),
  );
  assert.equal(browserErrors.length, 0, 'Browser errors: ' + browserErrors.join('\n'));
} catch (error) {
  failure = error;
  process.exitCode = 1;
} finally {
  try {
    if (browser) await browser.close({ silent: true });
  } finally {
    if (host.exitCode === null) host.stdin.end('shutdown\n');
    await completion;
    await fs.writeFile(
      path.join(directory, 'report.json'),
      JSON.stringify(
        {
          createdAt: new Date().toISOString(),
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
