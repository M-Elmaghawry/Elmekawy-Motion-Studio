import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import { randomUUID, createHash } from 'node:crypto';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { setTimeout as pause } from 'node:timers/promises';
import { bundle } from '@remotion/bundler';
import { openBrowser, getCompositions, renderStill, renderMedia } from '@remotion/renderer';

// A real, isolated smoke check. This never starts or changes the production store.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
assert.equal(process.platform, 'win32', 'Render smoke currently requires Windows x64.');
assert.equal(process.arch, 'x64');
assert.equal(process.argv.length, 2, 'Render smoke does not accept arguments.');
const directory = path.join(root, '.studio/test-runs/render-smoke-' + randomUUID());
await fs.mkdir(directory, { recursive: true });
const listener = net.createServer();
await new Promise((resolve, reject) => {
  listener.once('error', reject);
  listener.listen(0, '127.0.0.1', resolve);
});
const port = listener.address().port;
await new Promise((resolve) => listener.close(resolve));
const origin = 'http://127.0.0.1:' + port;
const host = spawn(process.execPath, [path.join(root, 'scripts/launcher-host.mjs')], {
  cwd: root,
  env: { ...process.env, STUDIO_DATA_ROOT: directory, STUDIO_PORT: String(port) },
  windowsHide: true,
  stdio: ['pipe', 'pipe', 'pipe'],
});
let serverLog = '';
let hostError;
host.on('error', (error) => {
  hostError = error;
});
host.stdout.on('data', (chunk) => {
  serverLog += chunk;
});
host.stderr.on('data', (chunk) => {
  serverLog += chunk;
});
const completion = new Promise((resolve) => host.once('close', resolve));
let browser;
const checks = [];
let failure;
try {
  let token;
  for (let attempt = 0; attempt < 150; attempt++) {
    if (hostError) throw hostError;
    assert.equal(host.exitCode, null, serverLog);
    try {
      const response = await fetch(origin + '/api/session');
      if (response.ok) {
        token = (await response.json()).token;
        break;
      }
    } catch {
      /* Wait for the isolated host. */
    }
    await pause(100);
  }
  assert.ok(token, 'Isolated server did not start: ' + serverLog);
  async function post(route, body) {
    const response = await fetch(origin + route, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Studio-Token': token },
      body: JSON.stringify(body),
    });
    const value = await response.json();
    assert.ok(response.ok, JSON.stringify(value));
    return value;
  }
  const bundleHash = createHash('sha256').update('isolated-render-smoke').digest('hex');
  await bundle({
    entryPoint: path.join(root, 'packages/motion-engine/src/index.ts'),
    outDir: path.join(directory, '.studio/cache/bundles', bundleHash),
    rootDir: root,
    publicDir: null,
    rspack: true,
    enableCaching: false,
    askAIEnabled: false,
    interactivityEnabled: false,
  });
  const serveUrl = origin + '/engine/' + bundleHash + '/index.html';
  browser = await openBrowser('chrome', {
    browserExecutable: path.join(
      root,
      'node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe',
    ),
    chromeMode: 'headless-shell',
    logLevel: 'error',
  });
  const common = { puppeteerInstance: browser, logLevel: 'error' };
  const originalUrl = path.join(root, 'elmekawy-bim-reel-V2/build');
  const originals = await getCompositions({ ...common, serveUrl: originalUrl, inputProps: {} });
  const cases = [
    {
      template: 'bim-personal-intro',
      id: 'ElmekawyBIMIntro',
      frames: [45, 119, 120, 131, 132, 899],
      audio: true,
    },
    {
      template: 'bim-motion-study',
      id: 'ElmekawyBIMIntroV2',
      frames: [45, 134, 135, 224, 225, 359],
      audio: false,
    },
  ];
  for (const item of cases) {
    const project = await post('/api/projects', {
      name: 'Smoke ' + item.id,
      client: 'Local fixture',
      objective: 'Legacy compatibility smoke',
      templateId: item.template,
    });
    const descriptor = await post('/api/projects/' + project.id + '/resolve', {});
    const original = originals.find((composition) => composition.id === item.id);
    assert.ok(original, 'Missing original composition ' + item.id);
    const expected = new Map();
    for (const frame of item.frames) {
      const still = await renderStill({
        ...common,
        serveUrl: originalUrl,
        composition: original,
        inputProps: {},
        frame,
        imageFormat: 'png',
        output: null,
      });
      expected.set(frame, createHash('sha256').update(still.buffer).digest('hex'));
    }
    for (const version of ['1.0.0', '1.1.0', '1.2.0']) {
      // Default 1.1.0 edits must not be applied to the frozen 1.0.0 text keys.
      const inputProps = {
        ...descriptor.inputProps,
        templateVersion: version,
        ...(version === '1.2.0'
          ? {
              imageLayouts: {},
              imageKeys: Object.fromEntries(
                project.assets.map((asset) => [asset.id, asset.mediaKey]),
              ),
            }
          : {}),
        ...(version === '1.0.0' ? { edits: {} } : {}),
      };
      const composition = (await getCompositions({ ...common, serveUrl, inputProps })).find(
        (entry) => entry.id === item.id,
      );
      assert.ok(composition);
      for (const frame of item.frames) {
        const still = await renderStill({
          ...common,
          serveUrl,
          composition,
          inputProps,
          frame,
          imageFormat: 'png',
          output: null,
        });
        const hash = createHash('sha256').update(still.buffer).digest('hex');
        const match = hash === expected.get(frame);
        checks.push({
          composition: item.id,
          version,
          frame,
          match,
          original: expected.get(frame),
          current: hash,
        });
        assert.ok(match, item.id + '@' + version + ' frame ' + frame + ' differs');
      }
      if (version === '1.2.0') {
        const asset = project.assets.find(
          (asset) =>
            asset.role ===
            (item.template === 'bim-personal-intro' ? 'infrastructure' : 'structural'),
        );
        assert.ok(asset);
        const scene = item.template === 'bim-personal-intro' ? 'infrastructure' : 'network';
        const variant = {
          ...inputProps,
          imageLayouts: {
            [scene]: {
              [asset.id]: {
                fit: 'contain',
                focalPoint: { x: 0.5, y: 0.5 },
                frame: { x: 0.4, y: 0.55, width: 0.75, height: 0.75 },
                transform: { scale: 1.2, offsetX: 0.1, offsetY: 0 },
              },
            },
          },
        };
        const changedFrame = item.template === 'bim-personal-intro' ? 132 : 134;
        const changed = await renderStill({
          ...common,
          serveUrl,
          composition: { ...composition, props: variant },
          inputProps: variant,
          frame: changedFrame,
          imageFormat: 'png',
          output: null,
        });
        assert.notEqual(
          createHash('sha256').update(changed.buffer).digest('hex'),
          expected.get(changedFrame),
          'Image transform must change its scene pixels',
        );
        const unrelated = await renderStill({
          ...common,
          serveUrl,
          composition: { ...composition, props: variant },
          inputProps: variant,
          frame: 45,
          imageFormat: 'png',
          output: null,
        });
        assert.equal(
          createHash('sha256').update(unrelated.buffer).digest('hex'),
          expected.get(45),
          'Image transform must not change another scene',
        );
        checks.push({
          kind: 'scene-local-image-transform',
          composition: item.id,
          version,
          passed: true,
        });
      }
      if (version !== '1.1.0') continue;
      const output = path.join(directory, item.id + '-30-frames.mp4');
      await renderMedia({
        ...common,
        serveUrl,
        composition,
        inputProps,
        codec: 'h264',
        pixelFormat: 'yuv420p',
        crf: 18,
        imageFormat: 'jpeg',
        concurrency: 2,
        frameRange: [0, 29],
        outputLocation: output,
        overwrite: false,
        onBrowserDownload: () => {
          throw new Error('Implicit browser downloads are disabled.');
        },
      });
      const { stdout } = await promisify(execFile)(
        path.join(root, 'node_modules/@remotion/compositor-win32-x64-msvc/ffprobe.exe'),
        ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', output],
        { windowsHide: true },
      );
      const probe = JSON.parse(stdout);
      const video = probe.streams.find((stream) => stream.codec_type === 'video');
      assert.equal(video.codec_name, 'h264');
      assert.equal(video.width, 1080);
      assert.equal(video.height, 1920);
      assert.equal(video.r_frame_rate, '30/1');
      assert.equal(Number(video.nb_frames), 30);
      assert.equal(
        probe.streams.some((stream) => stream.codec_type === 'audio'),
        item.audio,
      );
      await promisify(execFile)(
        path.join(root, 'node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe'),
        ['-v', 'error', '-i', output, '-c:v', 'rawvideo', '-c:a', 'pcm_s16le', '-f', 'null', '-'],
        { windowsHide: true },
      );
      await fs.writeFile(output + '.probe.json', JSON.stringify(probe, null, 2));
      checks.push({
        composition: item.id,
        version,
        smokeFrames: 30,
        audio: item.audio,
        passed: true,
      });
    }
    console.log(
      'PASS: ' +
        item.id +
        ' boundary pixels (all three versions) and scene-local image transforms and 30-frame H.264/audio smoke',
    );
  }
} catch (error) {
  failure = error;
  process.exitCode = 1;
} finally {
  try {
    if (browser) await browser.close({ silent: true });
  } finally {
    if (host.exitCode === null && !host.stdin.destroyed) host.stdin.end('shutdown\n');
    const exited = await Promise.race([
      completion.then(() => true),
      pause(20000, false, { ref: false }),
    ]);
    if (!exited) {
      host.kill();
      await completion;
    }
    const report = path.join(directory, 'report.json');
    await fs.writeFile(
      report,
      JSON.stringify(
        {
          createdAt: new Date().toISOString(),
          passed: !failure,
          checks,
          error: failure?.stack,
          serverLog,
        },
        null,
        2,
      ),
    );
    console.log('Report: ' + report);
  }
}
if (failure) throw failure;
