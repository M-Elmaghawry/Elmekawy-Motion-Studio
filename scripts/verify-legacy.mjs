import fs from 'node:fs/promises';
import path from 'node:path';
import {createReadStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const archives=(await fs.readdir(path.join(root,'archive'))).sort().reverse();
let manifest;
for(const id of archives){try{const verify=JSON.parse(await fs.readFile(path.join(root,'archive',id,'verification.json'),'utf8'));if(verify.verified){manifest=JSON.parse(await fs.readFile(path.join(root,'archive',id,'manifest.json'),'utf8'));break;}}catch{}}
if(!manifest)throw new Error('No verified legacy backup found');
const expectedFiles=new Set(manifest.files.map(file=>file.path));const expectedDirectories=new Set(manifest.directories);
async function checkInventory(directory){for(const entry of await fs.readdir(directory,{withFileTypes:true})){const absolute=path.join(directory,entry.name),relative=path.relative(root,absolute).replaceAll('\\','/');if(entry.isSymbolicLink())throw new Error('New protected link: '+relative);if(entry.isDirectory()){if(!expectedDirectories.has(relative))throw new Error('New protected directory: '+relative);await checkInventory(absolute);}else if(!expectedFiles.has(relative))throw new Error('New protected file: '+relative);}}
for(const name of ['elmekawy-bim-reel','elmekawy-bim-reel-V2'])await checkInventory(path.join(root,name));
for(const file of manifest.files){const hash=createHash('sha256');for await(const chunk of createReadStream(path.join(root,file.path)))hash.update(chunk);if(hash.digest('hex')!==file.sha256)throw new Error('Changed protected original: '+file.path);}
console.log(`PASS: all ${manifest.files.length} protected original files match the verified backup.`);
