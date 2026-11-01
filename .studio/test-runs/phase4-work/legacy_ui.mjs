import fs from 'node:fs';
function change(file,old,value){const t=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');if(!t.includes(old))throw Error(file+' '+old.slice(0,100));fs.writeFileSync(file,t.replaceAll(old,value));}
change('apps/server/src/storage.ts','duplicateProject(id:string,name:string)', 'duplicateProject(id:string,name:string,expectedRevision?:number)');
change('apps/server/src/storage.ts','const original=await readProject(id);const clone=',"const original=await readProject(id);if(expectedRevision!==undefined&&original.revision!==expectedRevision)throw new AppError(412,'STALE_REVISION','احفظ وأعد تحميل الإصدار الحالي.');const clone=");
change('apps/server/src/index.ts', "import {templates,templateFor}", "import {templates,templateFor,upgradeTextEditing}");
change('apps/server/src/index.ts','verifyAsset,safePath}', 'verifyAsset,safePath,atomicJson,commitProject,projectFolder}');
const route=`server.post('/api/projects/:id/image-editing-copy',async(request,reply)=>{
  const current=await readProject(params(request).id),expected=revision(request);
  const copy=await duplicateProject(current.id,current.name.slice(0,96)+' — تحرير الصور',expected);
  const next=upgradeTextEditing(copy);next.template.version='1.2.0';next.imageLayouts={};next.revision=copy.revision+1;next.updatedAt=new Date().toISOString();
  await atomicJson(await safePath(await projectFolder(copy.id),'history/revision-'+copy.revision+'.json'),copy);await commitProject(next);
  reply.code(201).header('ETag',etag(next.revision));return next;
});\n`;
change('apps/server/src/index.ts', "server.post('/api/projects/:id/duplicate'", route+"server.post('/api/projects/:id/duplicate'");
change('apps/studio/src/main.tsx',"import {SceneTextEditor}","import {LegacyImageControls} from './LegacyImageControls';\nimport {SceneTextEditor}");
change('apps/studio/src/main.tsx','media,edits', 'media,edits'); // no-op guard omitted below
