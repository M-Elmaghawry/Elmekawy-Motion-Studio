import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const messages = args.filter((argument) => argument !== '--dry-run');
if (messages.length > 1 || messages.some((argument) => argument.startsWith('--'))) {
  throw new Error('Usage: npm.cmd run github:sync -- ["Commit message"] [--dry-run]');
}
const message = messages[0]?.trim() || 'Sync complete project workspace';
const capture = (arguments_) =>
  execFileSync('git', arguments_, {
    cwd: root,
    windowsHide: true,
    maxBuffer: 64 * 1024 * 1024,
  });
const run = (arguments_) =>
  execFileSync('git', arguments_, {
    cwd: root,
    windowsHide: true,
    stdio: 'inherit',
  });
const splitPaths = (buffer) => buffer.toString('utf8').split('\0').filter(Boolean);
const branch = capture(['symbolic-ref', '--quiet', '--short', 'HEAD']).toString('utf8').trim();
capture(['remote', 'get-url', 'origin']);
const newFiles = splitPaths(capture(['ls-files', '--others', '-z']));
const allFiles = [
  ...new Set([...splitPaths(capture(['ls-files', '--cached', '-z'])), ...newFiles]),
];
let totalBytes = 0;
const largeFiles = [];
for (const file of allFiles) {
  let stat;
  try {
    stat = fs.lstatSync(path.join(root, file));
  } catch (error) {
    if (error.code === 'ENOENT') continue;
    throw error;
  }
  if (!stat.isFile()) continue;
  totalBytes += stat.size;
  if (stat.size >= 50 * 1024 * 1024) {
    const attributes = splitPaths(capture(['check-attr', '-z', 'filter', '--', file]));
    if (attributes[2] !== 'lfs') largeFiles.push(file);
  }
}
console.log(
  JSON.stringify(
    {
      branch,
      dryRun,
      workspaceFiles: allFiles.length,
      newFiles: newFiles.length,
      workspaceGiB: Number((totalBytes / 1024 ** 3).toFixed(2)),
      filesNeedingLfs: largeFiles,
    },
    null,
    2,
  ),
);
if (!dryRun) {
  // Override machine-wide exclusions for this repository only; never alter global settings.
  run(['config', '--local', 'core.excludesFile', path.join(root, '.gitignore')]);
  if (process.platform === 'win32') run(['config', '--local', 'core.longpaths', 'true']);
  if (largeFiles.length) {
    run(['lfs', 'version']);
    for (const file of largeFiles) run(['lfs', 'track', '--filename', '--', file]);
  }
  console.log('Staging every workspace file, including ignored files...');
  run(['add', '--all', '--force']);
  const filesLeft = splitPaths(capture(['ls-files', '--others', '-z']));
  if (filesLeft.length) throw new Error(`Files remain outside the index: ${filesLeft.length}`);
  const staged = capture(['diff', '--cached', '--name-only', '-z']);
  if (staged.length) run(['commit', '--quiet', '-m', message]);
  else console.log('No new file changes to commit.');
  run(['push', '--set-upstream', 'origin', `HEAD:refs/heads/${branch}`]);
  const local = capture(['rev-parse', 'HEAD']).toString('utf8').trim();
  const remote = capture(['ls-remote', '--heads', 'origin', `refs/heads/${branch}`])
    .toString('utf8')
    .trim()
    .split(/\s+/)[0];
  if (remote !== local) throw new Error('Remote branch verification failed.');
  console.log(`Verified complete upload: ${branch} ${local}`);
}
