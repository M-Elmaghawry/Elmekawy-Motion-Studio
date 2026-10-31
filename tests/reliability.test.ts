import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));

test('documented launcher npm commands resolve to existing entry points', async () => {
  assert.equal(
    manifest.scripts['launcher:build'],
    'powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/build-launcher.ps1',
  );
  assert.equal(manifest.scripts['launcher:verify'], 'node scripts/verify-launcher.mjs');
  await fs.access(path.join(root, 'scripts/build-launcher.ps1'));
  await fs.access(path.join(root, 'scripts/verify-launcher.mjs'));
  const readme = await fs.readFile(path.join(root, 'README.md'), 'utf8');
  for (const command of ['launcher:build', 'launcher:verify']) {
    assert.ok(readme.includes('npm.cmd run ' + command));
  }
});

test('launcher verification help runs through the npm alias from another cwd', async () => {
  const npm = process.env.npm_execpath;
  assert.ok(npm, 'Run this suite through npm test or npm run test:cli.');
  const { stdout } = await run(
    process.execPath,
    [npm, '--prefix', root, 'run', 'launcher:verify', '--', '--help'],
    {
      cwd: path.join(root, 'docs'),
      windowsHide: true,
      timeout: 15000,
    },
  );
  assert.match(stdout, /Usage: npm\.cmd run launcher:verify/);
  assert.match(stdout, /Windows x64 only/);
  assert.match(stdout, /without browser\/tray UI/);
});

test('launcher verification rejects unknown arguments before running an EXE', async () => {
  await assert.rejects(
    () =>
      run(process.execPath, [path.join(root, 'scripts/verify-launcher.mjs'), '--invalid'], {
        cwd: path.join(root, 'docs'),
        windowsHide: true,
        timeout: 15000,
      }),
    (error: unknown) => {
      const failure = error as { code: number; stderr: string; stdout: string };
      assert.equal(failure.code, 1);
      assert.match(failure.stderr, /Unknown launcher verification argument/);
      assert.equal(failure.stdout, '');
      return true;
    },
  );
});
