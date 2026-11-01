import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { bundle } from '@remotion/bundler';
import { openBrowser, selectComposition, renderStill, renderMedia } from '@remotion/renderer';
import {
  parseFlexibleProject,
  compileTimeline,
  renderReadinessErrors,
} from '@elmekawy/shared/flexible';
import type { FlexibleAsset } from '@elmekawy/shared/flexible';
import { browserPath, sourceFingerprint } from '@elmekawy/motion-engine/server';
import { inspectMedia } from '../apps/server/src/flexible-media.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
if (args.length === 1 && args[0] === '--help') {
  console.log(
    'Usage: npm.cmd run render:flexible -- [project.json] [--validate-only]\nDefault: packages/templates/src/flexible-reel/1.0.0/sample.json\nRendering requires Windows x64 and a seeded browser. Outputs use a new .studio/test-runs directory.',
  );
  process.exit(0);
}
assert.ok(
  args.every((arg) => !arg.startsWith('--') || arg === '--validate-only'),
  'Unknown argument. Use --help.',
);
const inputs = args.filter((arg) => arg !== '--validate-only');
assert.ok(
  inputs.length <= 1 && args.filter((arg) => arg === '--validate-only').length <= 1,
  'Supply one JSON file and at most one --validate-only.',
);
const input = path.resolve(
  inputs[0] ?? path.join(root, 'packages/templates/src/flexible-reel/1.0.0/sample.json'),
);
assert.ok((await fs.stat(input)).size <= 1024 ** 2, 'Project JSON exceeds 1 MiB.');
const project = parseFlexibleProject(
  JSON.parse((await fs.readFile(input, 'utf8')).replace(/^\uFEFF/, '')),
);
const timeline = compileTimeline(project.scenes);
if (args.includes('--validate-only')) {
  console.log(
    JSON.stringify({
      valid: true,
      template: project.template,
      durationFrames: timeline.durationFrames,
      seconds: timeline.durationFrames / project.outputProfile.fps,
      renderIssues: renderReadinessErrors(project),
    }),
  );
  process.exit(0);
}
assert.equal(process.platform, 'win32', 'Flexible rendering currently requires Windows x64.');
assert.equal(process.arch, 'x64');
assert.deepEqual(
  renderReadinessErrors(project),
  [],
  'Required assets must be approved before rendering.',
);
await fs.access(browserPath(root));
const run = promisify(execFile);
const hashFile = async (file: string) => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
};
const directory = path.join(root, '.studio/test-runs/flexible-' + randomUUID());
await fs.mkdir(path.join(directory, 'assets'), { recursive: true });
await fs.writeFile(path.join(directory, 'project.snapshot.json'), JSON.stringify(project, null, 2));
const files = new Map<string, { file: string; mime: string }>();
let server: http.Server | undefined, browser: Awaited<ReturnType<typeof openBrowser>> | undefined;
const checks: Record<string, unknown>[] = [];
let failure: unknown;
try {
  for (const asset of project.assets) {
    const base =
      asset.storage.scope === 'shared' ? path.join(root, 'shared-assets') : path.dirname(input);
    assert.equal((await fs.lstat(base)).isSymbolicLink(), false, 'Asset roots cannot be links.');
    let source = base;
    for (const part of asset.storage.path.split('/')) {
      source = path.join(source, part);
      assert.equal(
        (await fs.lstat(source)).isSymbolicLink(),
        false,
        'Asset paths cannot contain links.',
      );
    }
    const relative = path.relative(await fs.realpath(base), await fs.realpath(source));
    assert.ok(
      relative && !relative.startsWith('..') && !path.isAbsolute(relative),
      'Asset escaped its configured root.',
    );
    const stat = await fs.stat(source);
    assert.ok(
      stat.isFile() && stat.size === asset.byteSize,
      'Asset byte size mismatch: ' + asset.id,
    );
    assert.equal(await hashFile(source), asset.sha256, 'Asset hash mismatch: ' + asset.id);
    const snapshot = path.join(directory, 'assets', asset.id);
    await fs.copyFile(source, snapshot, fs.constants.COPYFILE_EXCL);
    assert.equal(
      await hashFile(snapshot),
      asset.sha256,
      'Asset changed during snapshot: ' + asset.id,
    );
    await checkSignature(snapshot, asset);
    files.set('/media/' + asset.id + '/' + asset.sha256, { file: snapshot, mime: asset.mimeType });
  }
  const bundleDirectory = path.join(directory, 'bundle');
  const source = await sourceFingerprint(root);
  await bundle({
    entryPoint: path.join(root, 'packages/motion-engine/src/index.ts'),
    outDir: bundleDirectory,
    rootDir: root,
    publicDir: null,
    rspack: true,
    enableCaching: false,
    askAIEnabled: false,
    interactivityEnabled: false,
  });
  async function registerBundle(folder: string) {
    for (const item of await fs.readdir(folder, { withFileTypes: true })) {
      const file = path.join(folder, item.name);
      if (item.isDirectory()) await registerBundle(file);
      else if (item.isFile()) {
        const mime = (
          {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.map': 'application/json',
            '.png': 'image/png',
            '.ico': 'image/x-icon',
          } as Record<string, string>
        )[path.extname(file)];
        if (mime)
          files.set('/engine/' + path.relative(bundleDirectory, file).replaceAll('\\', '/'), {
            file,
            mime,
          });
      }
    }
  }
  await registerBundle(bundleDirectory);
  server = http.createServer((request, response) => {
    const record = files.get((request.url ?? '').split('?')[0]);
    if (!record || !['GET', 'HEAD'].includes(request.method ?? '')) {
      response.writeHead(404);
      response.end();
      return;
    }
    void fs
      .stat(record.file)
      .then((stat) => {
        let start = 0,
          end = stat.size - 1,
          status = 200;
        if (request.headers.range) {
          const match = request.headers.range.match(/^bytes=(\d+)-(\d*)$/);
          if (!match || Number(match[1]) >= stat.size) {
            response.writeHead(416, { 'Content-Range': 'bytes */' + stat.size });
            response.end();
            return;
          }
          start = Number(match[1]);
          end = match[2] ? Math.min(end, Number(match[2])) : end;
          if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || end < start) {
            response.writeHead(416);
            response.end();
            return;
          }
          status = 206;
        }
        response.writeHead(status, {
          'Content-Type': record.mime,
          'Content-Length': end - start + 1,
          'Accept-Ranges': 'bytes',
          ...(status === 206 ? { 'Content-Range': `bytes ${start}-${end}/${stat.size}` } : {}),
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'no-store',
        });
        if (request.method === 'HEAD') response.end();
        else
          createReadStream(record.file, { start, end })
            .on('error', () => response.destroy())
            .pipe(response);
      })
      .catch(() => {
        response.writeHead(500);
        response.end();
      });
  });
  await new Promise<void>((resolve, reject) => {
    server!.once('error', reject);
    server!.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const origin = 'http://127.0.0.1:' + address.port;
  const media = Object.fromEntries(
    project.assets.map((asset) => [asset.id, origin + '/media/' + asset.id + '/' + asset.sha256]),
  );
  const inputProps = { project, media },
    serveUrl = origin + '/engine/index.html';
  browser = await openBrowser('chrome', {
    browserExecutable: browserPath(root),
    chromeMode: 'headless-shell',
    logLevel: 'error',
  });
  const common = { serveUrl, inputProps, puppeteerInstance: browser, logLevel: 'error' as const };
  const composition = await selectComposition({ ...common, id: 'FlexibleReel' });
  assert.equal(composition.durationInFrames, project.targetDurationFrames);
  assert.equal(composition.width, project.outputProfile.width);
  assert.equal(composition.height, project.outputProfile.height);
  assert.equal(composition.fps, project.outputProfile.fps);
  // Collect every cut/overlap edge plus a readable middle frame for each scene.
  const boundaryFrames = [
    ...new Set([
      0,
      timeline.durationFrames - 1,
      ...timeline.scenes.flatMap((scene) => [
        scene.startFrame - 1,
        scene.startFrame,
        scene.startFrame + scene.incomingFrames - 1,
        scene.startFrame + scene.incomingFrames,
        scene.startFrame + Math.floor(scene.durationFrames / 2),
        scene.endFrame - 1,
        scene.endFrame,
      ]),
    ]),
  ]
    .filter((frame) => frame >= 0 && frame < timeline.durationFrames)
    .sort((a, b) => a - b);
  const hashes = new Map<number, string>();
  for (const frame of boundaryFrames) {
    const still = await renderStill({
      ...common,
      composition,
      frame,
      imageFormat: 'png',
      output: path.join(directory, 'frame-' + String(frame).padStart(4, '0') + '.png'),
    });
    // A file output has no returned buffer; read the exact file for the comparison.
    void still;
    hashes.set(
      frame,
      await hashFile(path.join(directory, 'frame-' + String(frame).padStart(4, '0') + '.png')),
    );
  }
  for (const entry of [timeline.scenes[2], timeline.scenes[0]]) {
    const frame = entry.startFrame + Math.floor(entry.durationFrames / 2);
    const still = await renderStill({
      ...common,
      composition,
      frame,
      imageFormat: 'png',
      output: null,
    });
    assert.equal(
      createHash('sha256').update(still.buffer!).digest('hex'),
      hashes.get(frame),
      'Nonsequential seek changed rendered pixels.',
    );
  }
  checks.push({
    name: 'boundary-frames-and-repeat-seeks',
    passed: true,
    frames: boundaryFrames,
    hashes: Object.fromEntries(hashes),
  });
  const mediaEntry = timeline.scenes.find(
    (entry) => project.scenes[entry.index].type === 'media-showcase',
  );
  if (mediaEntry && project.schemaVersion === '2.0.0') {
    const variant = structuredClone(project),
      frame = mediaEntry.startFrame + Math.floor(mediaEntry.durationFrames / 2);
    const binding = variant.scenes[mediaEntry.index].mediaBindings[0];
    binding.frame = { x: 0.45, y: 0.5, width: 0.7, height: 0.75 };
    binding.transform = { scale: 1.2, offsetX: 0.05, offsetY: 0 };
    binding.fit = 'contain';
    const variantProps = { project: parseFlexibleProject(variant), media };
    const variantComposition = await selectComposition({
      ...common,
      inputProps: variantProps,
      id: 'FlexibleReel',
    });
    const transformed = await renderStill({
      ...common,
      inputProps: variantProps,
      composition: variantComposition,
      frame,
      imageFormat: 'png',
      output: null,
    });
    const transformedHash = createHash('sha256').update(transformed.buffer!).digest('hex');
    assert.notEqual(transformedHash, hashes.get(frame), 'Image transforms did not affect pixels.');
    await fs.writeFile(path.join(directory, 'image-transform-variant.png'), transformed.buffer!);
    const qaFile = path.join(directory, 'pixel-check.html');
    await fs.writeFile(
      qaFile,
      '<!doctype html><html><head><title>Local pixel verification</title></head><body></body></html>',
    );
    files.set('/qa/pixels.html', { file: qaFile, mime: 'text/html' });
    files.set('/qa/base.png', {
      file: path.join(directory, 'frame-' + String(frame).padStart(4, '0') + '.png'),
      mime: 'image/png',
    });
    files.set('/qa/variant.png', {
      file: path.join(directory, 'image-transform-variant.png'),
      mime: 'image/png',
    });
    const page = await browser.newPage({
      context: () => null,
      logLevel: 'error',
      indent: false,
      pageIndex: 0,
      onBrowserLog: null,
      onLog: () => {},
    });
    try {
      await page.goto({ url: origin + '/qa/pixels.html', timeout: 10000 });
      const headerHashes = await page.evaluate(async (width: number) => {
        const hashes: string[] = [];
        for (const src of ['/qa/base.png', '/qa/variant.png']) {
          const image = new Image();
          image.src = src;
          await image.decode();
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = 300;
          const context = canvas.getContext('2d')!;
          context.drawImage(image, 0, 0);
          const pixels = context.getImageData(0, 0, width, 300).data;
          const hash = await crypto.subtle.digest('SHA-256', pixels);
          hashes.push(
            Array.from(new Uint8Array(hash), (value) => value.toString(16).padStart(2, '0')).join(
              '',
            ),
          );
        }
        return hashes;
      }, project.outputProfile.width);
      assert.equal(
        headerHashes[0],
        headerHashes[1],
        'Image transforms changed the persistent brand header.',
      );
    } finally {
      await page.close();
    }
    const otherEntry = timeline.scenes.find(
      (entry) =>
        entry.index !== mediaEntry.index && project.scenes[entry.index].type !== 'media-showcase',
    );
    if (otherEntry) {
      const otherFrame = otherEntry.startFrame + Math.floor(otherEntry.durationFrames / 2);
      const isolated = await renderStill({
        ...common,
        inputProps: variantProps,
        composition: variantComposition,
        frame: otherFrame,
        imageFormat: 'png',
        output: null,
      });
      assert.equal(
        createHash('sha256').update(isolated.buffer!).digest('hex'),
        hashes.get(otherFrame),
        'Image transforms affected an unrelated scene.',
      );
    }
    checks.push({
      name: 'image-transform-changes-pixels-and-isolates-other-scenes',
      passed: true,
      frame,
      transformedHash,
    });
  }
  const titleIndex = project.scenes.findIndex((scene) => scene.type === 'kinetic-title');
  if (titleIndex >= 0 && project.schemaVersion === '2.0.0') {
    const overflow = structuredClone(project),
      scene = overflow.scenes[titleIndex];
    if (scene.type === 'kinetic-title') scene.content.headline = 'و'.repeat(200);
    const overflowProps = { project: parseFlexibleProject(overflow), media };
    const overflowComposition = await selectComposition({
      ...common,
      inputProps: overflowProps,
      id: 'FlexibleReel',
    });
    const entry = timeline.scenes[titleIndex];
    await assert.rejects(
      () =>
        renderStill({
          ...common,
          inputProps: overflowProps,
          composition: overflowComposition,
          frame: entry.startFrame + Math.floor(entry.durationFrames / 2),
          imageFormat: 'png',
          output: null,
        }),
      /UNSAFE_TEXT_OR_OVERFLOW/,
    );
    checks.push({ name: 'long-arabic-overflow-blocked-after-font-layout', passed: true });
  }
  const output = path.join(
    directory,
    'flexible-reel-' + timeline.durationFrames / project.outputProfile.fps + 's.mp4',
  );
  console.log(
    'Boundary frames and repeat seeks passed; rendering ' + timeline.durationFrames + ' frames.',
  );
  await renderMedia({
    ...common,
    composition,
    codec: 'h264',
    pixelFormat: 'yuv420p',
    crf: project.outputProfile.crf,
    imageFormat: 'jpeg',
    concurrency: 2,
    outputLocation: output,
    overwrite: false,
    onBrowserDownload: () => {
      throw new Error('Unexpected browser download.');
    },
  });
  const probeExecutable = path.join(
    root,
    'node_modules/@remotion/compositor-win32-x64-msvc/ffprobe.exe',
  );
  const { stdout } = await run(
    probeExecutable,
    ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', output],
    { windowsHide: true },
  );
  const probe = JSON.parse(stdout) as {
    streams: {
      codec_type: string;
      codec_name: string;
      width: number;
      height: number;
      nb_frames: string;
      r_frame_rate: string;
      duration: string;
    }[];
    format: { duration: string };
  };
  const video = probe.streams.find((stream) => stream.codec_type === 'video');
  assert.ok(video);
  assert.equal(video.codec_name, 'h264');
  assert.equal(video.width, project.outputProfile.width);
  assert.equal(video.height, project.outputProfile.height);
  assert.equal(video.r_frame_rate, project.outputProfile.fps + '/1');
  assert.equal(Number(video.nb_frames), timeline.durationFrames);
  assert.equal(Number(video.duration), timeline.durationFrames / project.outputProfile.fps);
  assert.equal(
    probe.streams.some((stream) => stream.codec_type === 'audio'),
    project.audio.mode === 'timeline' && project.audio.tracks.some((track) => track.volume > 0),
  );
  await fs.writeFile(path.join(directory, 'probe.json'), JSON.stringify(probe, null, 2));
  await run(
    path.join(root, 'node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe'),
    ['-v', 'error', '-i', output, '-c:v', 'rawvideo', '-c:a', 'pcm_s16le', '-f', 'null', '-'],
    { windowsHide: true, maxBuffer: 1024 ** 2 },
  );
  checks.push({ name: 'encoded-stream-metadata-and-full-decode', passed: true });
  assert.equal(
    (await sourceFingerprint(root)).sha256,
    source.sha256,
    'Source changed during the render.',
  );
  const commit = await run('git', ['rev-parse', 'HEAD'], { cwd: root, windowsHide: true }).then(
    (result) => result.stdout.trim(),
  );
  const runtime = await run(browserPath(root), ['--version'], { windowsHide: true });
  await fs.writeFile(
    path.join(directory, 'render-manifest.json'),
    JSON.stringify(
      {
        template: project.template,
        schemaVersion: project.schemaVersion,
        projectId: project.id,
        revision: project.revision,
        commit,
        workingTreeFingerprint: source.sha256,
        sourceFiles: source.files,
        node: process.version,
        remotion: '4.0.539',
        browser: runtime.stdout.trim(),
        browserSha256: await hashFile(browserPath(root)),
        inputSha256: await hashFile(path.join(directory, 'project.snapshot.json')),
        assetHashes: project.assets.map(({ id, sha256 }) => ({ id, sha256 })),
        outputProfile: project.outputProfile,
        outputSha256: await hashFile(output),
        settings: { imageFormat: 'jpeg', concurrency: 2 },
      },
      null,
      2,
    ),
  );
  console.log('PASS: ' + output);
} catch (error) {
  failure = error;
  process.exitCode = 1;
} finally {
  try {
    if (browser) await browser.close({ silent: true });
  } finally {
    if (server) await new Promise<void>((resolve) => server!.close(() => resolve()));
    await fs.writeFile(
      path.join(directory, 'report.json'),
      JSON.stringify(
        {
          createdAt: new Date().toISOString(),
          passed: !failure,
          checks,
          error: failure instanceof Error ? failure.stack : failure,
        },
        null,
        2,
      ),
    );
    console.log('Report: ' + path.join(directory, 'report.json'));
  }
}
if (failure) throw failure;

async function checkSignature(file: string, asset: FlexibleAsset) {
  if (asset.kind === 'video' || asset.kind === 'audio') {
    const info = await inspectMedia(file);
    assert.equal(info.kind, asset.kind);
    assert.equal(info.mimeType, asset.mimeType);
    assert.deepEqual(info.metadata, asset.metadata);
    return;
  }
  const handle = await fs.open(file, 'r');
  const bytes = Buffer.alloc(16);
  try {
    await handle.read(bytes, 0, bytes.length, 0);
  } finally {
    await handle.close();
  }
  const valid =
    asset.mimeType === 'image/png'
      ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : asset.mimeType === 'image/jpeg'
        ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        : asset.mimeType === 'image/webp'
          ? bytes.subarray(0, 4).toString() === 'RIFF' &&
            bytes.subarray(8, 12).toString() === 'WEBP'
          : bytes.readUInt32BE(0) === 0x00010000 || bytes.subarray(0, 4).toString() === 'OTTO';
  assert.ok(valid, 'Asset signature does not match its declared type: ' + asset.id);
}
