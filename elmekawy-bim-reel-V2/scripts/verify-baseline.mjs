import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve, basename} from 'node:path';

assert.equal(basename(process.cwd()), 'elmekawy-bim-reel-V2', 'Run from V2 only');
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const hash = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase();
const check = (snapshot, root, exceptions = []) => {
  const entries = readJson(snapshot).filter(({path}) => !exceptions.includes(path));
  for (const entry of entries) assert.equal(hash(resolve(root, entry.path)), entry.sha256, `Changed: ${root}/${entry.path}`);
  return entries.length;
};
const original = check('docs/V1_READONLY_HASHES.json', '../elmekawy-bim-reel');
const copied = check('docs/V2_BASELINE_HASHES.json', '.', ['src/Root.tsx', 'README.md']);
const rootV1 = readFileSync('../elmekawy-bim-reel/src/Root.tsx', 'utf8');
const rootV2 = readFileSync('src/Root.tsx', 'utf8');
const registration = (source) => source.slice(source.indexOf('<Composition'), source.indexOf('/>') + 2);
assert.equal(registration(rootV2), registration(rootV1), 'V1 composition registration changed');
console.log(`PASS: ${original} original V1 files; ${copied} copied baseline files; identical V1 registration.`);
