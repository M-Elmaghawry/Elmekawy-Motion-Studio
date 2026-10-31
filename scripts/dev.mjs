import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const children=[spawn(process.execPath,['apps/server/src/index.ts'],{cwd:root,env:{...process.env,STUDIO_PORT:'4310'},stdio:'inherit',windowsHide:true}),spawn(process.execPath,['node_modules/vite/bin/vite.js','--config','apps/studio/vite.config.ts'],{cwd:root,stdio:'inherit',windowsHide:true})];
for(const child of children)child.on('exit',()=>{for(const other of children)if(other!==child)other.kill();});
process.on('SIGINT',()=>children.forEach(child=>child.kill()));process.on('SIGTERM',()=>children.forEach(child=>child.kill()));
