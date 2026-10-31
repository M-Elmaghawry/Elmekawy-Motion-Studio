import {seedProjects} from '../apps/server/src/projects.ts';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
await seedProjects();
const source=path.join(root,'elmekawy-bim-reel-V2/node_modules/.remotion/chrome-headless-shell');
const destination=path.join(root,'node_modules/.remotion/chrome-headless-shell');
try{await fs.access(path.join(destination,'win64/chrome-headless-shell-win64/chrome-headless-shell.exe'));}catch{console.log('Provisioning the existing local Chrome runtime into the central installation...');await fs.mkdir(path.dirname(destination),{recursive:true});await fs.cp(source,destination,{recursive:true,force:false,errorOnExist:true});}
console.log('Local projects, exact shared media/fonts, preserved output and browser are ready.');
