import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {basename, join} from 'node:path';

assert.equal(basename(process.cwd()), 'elmekawy-bim-reel-V2', 'Run from V2 only');
const git = (...args) => execFileSync('git', args, {encoding: 'utf8', maxBuffer: 16 * 1024 * 1024});
const prefix = git('rev-parse', '--show-prefix').trim();
const tracked = new Set(git('ls-files', '-z', '--cached', '--full-name', '--', '.')
  .split('\0').filter(Boolean).map((path) => path.slice(prefix.length)));
const files = [];
const walk = (directory) => {
  for (const entry of readdirSync(directory, {withFileTypes: true})) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else files.push(path.replaceAll('\\', '/'));
  }
};
walk('.');
const missing = files.filter((path) => !tracked.has(path));
assert.deepEqual(missing, [], 'Filesystem files missing from Git index');
const browser = 'node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe';
const pointer = git('show', `:${prefix}${browser}`);
const browserBytes = readFileSync(browser);
const digest = createHash('sha256').update(browserBytes).digest('hex');
assert.ok(pointer.startsWith('version https://git-lfs.github.com/spec/v1\n'));
assert.ok(pointer.includes(`oid sha256:${digest}\n`), 'LFS pointer hash mismatch');
assert.ok(pointer.includes(`size ${browserBytes.length}\n`), 'LFS size mismatch');
console.log(`PASS: all ${files.length} V2 files indexed; ${files.reduce((sum, path) => sum + statSync(path).size, 0)} bytes; LFS browser pointer matches local SHA256 and size.`);
