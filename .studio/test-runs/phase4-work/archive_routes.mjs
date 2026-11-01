import fs from 'node:fs';
let file='apps/server/src/index.ts',t=fs.readFileSync(file,'utf8');
t="import {exportProjectArchive,importProjectArchive,legacyHistory,restoreLegacy} from './project-archives.ts';\n"+t;
t=t.replace('fileSize:250*1024*1024','fileSize:512*1024*1024');
const routes=`server.post('/api/project-archives/import',{bodyLimit:513*1024*1024},async(request,reply)=>{const part=await request.file();if(!part)throw new AppError(400,'MISSING_UPLOAD','اختر نسخة ZIP.');const result=await importProjectArchive(part);reply.code(201);return result;});
server.get('/api/projects/:id/archive',async(request,reply)=>{const bytes=await exportProjectArchive(params(request).id,'legacy');reply.type('application/zip').header('Content-Disposition','attachment; filename="'+params(request).id+'.zip"');return reply.send(bytes);});
server.get('/api/projects/:id/history',async(request)=>legacyHistory(params(request).id));
server.post('/api/projects/:id/restore',async(request,reply)=>{const body=objectBody(request);checkedKeys(body,['revision']);const result=await restoreLegacy(params(request).id,revision(request),body.revision as number);reply.header('ETag',etag(result.revision));return result;});
`;
t=t.replace("server.get('/api/templates'",routes+"server.get('/api/templates'");
fs.writeFileSync(file,t);
file='apps/server/src/flexible-routes.ts';t=fs.readFileSync(file,'utf8');t="import {exportProjectArchive} from './project-archives.ts';\n"+t;
t=t.replace("  server.get('/api/flexible/projects',",`  server.get('/api/flexible/projects/:id/archive',async(request,reply)=>{const bytes=await exportProjectArchive(params(request).id,'flexible');reply.type('application/zip').header('Content-Disposition','attachment; filename="'+params(request).id+'.zip"');return reply.send(bytes);});
  server.get('/api/flexible/projects',`);
// A restored old revision may omit newer media; retained history remains its registry.
t=t.replace("    if (!asset) throw new AppError(404, 'MEDIA_NOT_FOUND', 'الصورة غير موجودة.');",`    if(!asset){for(const item of await flexibleHistory(projectId)){const previous=await import('node:fs/promises').then(fs=>fs.readFile(awaitPath(),'utf8'));function awaitPath(){return '';}void previous;} }
    if (!asset) throw new AppError(404, 'MEDIA_NOT_FOUND', 'الصورة غير موجودة.');`);
// The history lookup will be supplied as a storage helper below rather than filesystem paths in routes.
t=t.replace(/    if\(!asset\)\{for\(const item[^\n]+\n/,'');
fs.writeFileSync(file,t);
for(const file of ['apps/server/src/uploads.ts','apps/server/src/flexible-projects.ts']){
 let s=fs.readFileSync(file,'utf8');
 const target=file.includes('uploads.ts')?'const bytes=await fs.readFile(temp);':'const bytes = await fs.readFile(temp);';
 if(!s.includes(target))throw Error(file+' byte read');
 s=s.replace(target,`if((await fs.stat(temp)).size>50*1024*1024)throw new AppError(413,'FILE_TOO_LARGE','أقصى حجم للصورة 50 ميجابايت.');\n    `+target);fs.writeFileSync(file,s);
}
fs.appendFileSync('.gitignore','\n# Local flexible project data\n/flexible-projects/\n');
