import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import { randomUUID, createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { setTimeout as pause } from 'node:timers/promises';
import { bundle } from '@remotion/bundler';
import { openBrowser, selectComposition, renderStill } from '@remotion/renderer';
import { browserPath, sourceFingerprint } from '@elmekawy/motion-engine/server';
import { brandProfiles, outputProfiles, compileTimeline } from '@elmekawy/shared/flexible';
import type {
  FlexibleProject,
  FlexibleDescriptor,
  SupportedSceneType,
} from '@elmekawy/shared/flexible';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
  directory = path.join(root, '.studio/test-runs/scene-matrix-' + randomUUID());
await fs.mkdir(directory, { recursive: true });
const socket = net.createServer();
await new Promise<void>((resolve) => socket.listen(0, '127.0.0.1', resolve));
const address = socket.address();
assert.ok(address && typeof address !== 'string');
const port = address.port;
await new Promise<void>((resolve) => socket.close(() => resolve()));
const origin = 'http://127.0.0.1:' + port;
const host = spawn(process.execPath, ['scripts/launcher-host.mjs'], {
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
const checks: { profile: string; scene: string; file: string; sha256: string }[] = [];
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
  const fingerprint = await sourceFingerprint(root),
    outDir = path.join(directory, '.studio/cache/bundles', fingerprint.sha256);
  await bundle({
    entryPoint: path.join(root, 'packages/motion-engine/src/index.ts'),
    rootDir: root,
    outDir,
    publicDir: null,
    rspack: true,
    enableCaching: false,
    askAIEnabled: false,
    interactivityEnabled: false,
  });
  browser = await openBrowser('chrome', {
    browserExecutable: browserPath(root),
    chromeMode: 'headless-shell',
    logLevel: 'error',
  });
  const serveUrl = origin + '/engine/' + fingerprint.sha256 + '/index.html';
  for (const profile of outputProfiles) {
    for (const sceneTypes of [
      [
        'ui-demo',
        'product-hero',
        'before-after',
        'data-explainer',
        'kinetic-title',
        'stat-proof',
        'process-flow',
        'offer-cta',
      ],
      ['kinetic-title', 'media-showcase', 'offer-cta'],
    ] as SupportedSceneType[][]) {
      const project = await post<FlexibleProject>('/api/flexible/projects', {
        name: 'Scene matrix ' + profile.aspectRatio,
        client: 'Local QA',
        objective: 'مراجعة بصرية',
        brandProfileId: brandProfiles[0].profileId,
        displayName: 'LOCAL QA',
        colors: brandProfiles[0].colors,
        durationFrames: 900,
        sceneTypes,
        libraryImageId: 'structural',
        approveImage: true,
        crf: 24,
        outputProfileId: profile.id,
      });
      const descriptor = await post<FlexibleDescriptor>(
          '/api/flexible/projects/' + project.id + '/resolve',
          {},
        ),
        inputProps = descriptor.inputProps;
      const composition = await selectComposition({
        serveUrl,
        id: 'FlexibleReel',
        inputProps,
        puppeteerInstance: browser,
        logLevel: 'error',
      });
      for (const entry of compileTimeline(project.scenes).scenes) {
        const scene = project.scenes[entry.index];
        if (checks.some((check) => check.profile === profile.id && check.scene === scene.type))
          continue;
        const frame = entry.startFrame + Math.floor(entry.durationFrames / 2),
          file = profile.aspectRatio.replace(':', '-') + '-' + scene.type + '.png';
        await renderStill({
          serveUrl,
          composition,
          inputProps,
          frame,
          imageFormat: 'png',
          output: path.join(directory, file),
          puppeteerInstance: browser,
          logLevel: 'error',
        });
        checks.push({
          profile: profile.id,
          scene: scene.type,
          file,
          sha256: createHash('sha256')
            .update(await fs.readFile(path.join(directory, file)))
            .digest('hex'),
        });
      }
    }
    console.log('PASS: nine scenes rendered in ' + profile.aspectRatio);
  }
  assert.equal(checks.length, 27);
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
