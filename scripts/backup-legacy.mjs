import {createHash, randomUUID} from 'node:crypto';
import fs from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const names = ['elmekawy-bim-reel', 'elmekawy-bim-reel-V2'];
const archive = path.join(root, 'archive');
const id = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-') + '-' + randomUUID().slice(0, 8);
const destination = path.join(archive, id);
const inside = (base, target) => {const relative = path.relative(base, target); return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);};
if (!inside(root, destination) || names.some(name => inside(path.join(root, name), destination))) throw new Error('Unsafe backup destination');
const digest = async file => {const hash = createHash('sha256');for await (const chunk of createReadStream(file)) hash.update(chunk);return hash.digest('hex');};
const records = [];
const directories = [];
async function inventory(base, relative = '') {
  for (const entry of (await fs.readdir(path.join(base, relative), {withFileTypes: true})).sort((a,b) => a.name.localeCompare(b.name, 'en'))) {
    const rel = path.join(relative, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Backup requires explicit handling of link: ${rel}`);
    if (entry.isDirectory()) {directories.push(path.relative(root, path.join(base, rel)).replaceAll('\\', '/'));await inventory(base, rel);}
    else if (entry.isFile()) {
      const absolute = path.join(base, rel);
      const stat = await fs.stat(absolute);
      records.push({path:path.relative(root, absolute).replaceAll('\\','/'), bytes:stat.size, sha256:await digest(absolute)});
    } else throw new Error(`Unsupported filesystem entry: ${rel}`);
  }
}
await fs.mkdir(destination, {recursive: true});
await fs.writeFile(path.join(destination, 'INCOMPLETE'), 'Backup verification has not finished.\n', {flag:'wx'});
console.log('Inventorying protected originals...');
for (const name of names) await inventory(path.join(root, name));
let gitHead = null;
try {gitHead = execFileSync('git', ['rev-parse', 'HEAD'], {cwd:root,encoding:'utf8'}).trim();} catch {}
const manifest = {schemaVersion:'1.0.0',id,createdAt:new Date().toISOString(),sourceRoot:root,gitHead,directories,files:records};
await fs.writeFile(path.join(destination, 'manifest.json'), JSON.stringify(manifest,null,2));
for (const name of names) {
  console.log(`Copying ${name}...`);
  await fs.cp(path.join(root,name), path.join(destination,'originals',name), {recursive:true,errorOnExist:true,force:false,preserveTimestamps:true});
}
await fs.copyFile(path.join(root,'README.md'),path.join(destination,'ROOT_README.md'));
console.log('Verifying every copied file and source stability...');
for (const record of records) {
  const copied = path.join(destination,'originals',record.path);
  const stat = await fs.stat(copied);
  if (stat.size !== record.bytes || await digest(copied) !== record.sha256 || await digest(path.join(root,record.path)) !== record.sha256) throw new Error(`Backup mismatch: ${record.path}`);
}
const sample = 'elmekawy-bim-reel-V2/out/elmekawy-bim-v2-motion-test.mp4';
await fs.mkdir(path.join(destination,'restore-proof'));
await fs.copyFile(path.join(destination,'originals',sample),path.join(destination,'restore-proof','output.mp4'));
if (await digest(path.join(destination,'restore-proof','output.mp4')) !== records.find(record=>record.path===sample).sha256) throw new Error('Restore sample mismatch');
await fs.writeFile(path.join(destination,'RESTORE.md'), '# Recovery\n\nOriginals remain in place. Restore a verified copy from originals/ into a NEW recovery directory; never overwrite the protected originals. Verify all files against manifest.json before running the recovered copy. This snapshot includes installed dependencies, fonts, assets, original renders, and the actual local browser binary. The archive is never served by the application.\n');
await fs.writeFile(path.join(destination,'verification.json'),JSON.stringify({verified:true,files:records.length,bytes:records.reduce((sum,r)=>sum+r.bytes,0),sourceStable:true,restoreSample:sample,finishedAt:new Date().toISOString()},null,2));
await fs.writeFile(path.join(destination,'INCOMPLETE'),'Verified: destination files and protected sources match manifest.json; restore sample passed.\n');
await fs.rename(path.join(destination,'INCOMPLETE'),path.join(destination,'VERIFIED'));
console.log(JSON.stringify({backup:destination,verified:true,files:records.length,bytes:records.reduce((sum,r)=>sum+r.bytes,0)}));
