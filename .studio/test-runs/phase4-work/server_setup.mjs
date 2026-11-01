import fs from 'node:fs';
let file='apps/server/src/flexible-projects.ts',t=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
const change=(a,b)=>{if(!t.includes(a))throw Error(a);t=t.replaceAll(a,b);};
change('  portraitProfile,','  portraitProfile,\n  outputProfiles,\n  safeAreaFor,\n  projectWarnings,\n  upgradeFlexibleDocument,');
change("schemaVersion: '2.0.0',","schemaVersion: '2.1.0',");
change("template: { id: 'flexible-reel', version: '1.0.0' }","template: { id: 'flexible-reel', version: '1.1.0' }");
change('safeArea: { left: 100, right: 180, top: 220, bottom: 360 }','safeArea: safeAreaFor((outputProfiles.find(profile=>profile.id===value.outputProfileId)??portraitProfile).aspectRatio)');
change('outputProfile: { ...portraitProfile, crf: value.crf }','outputProfile: { ...(outputProfiles.find(profile=>profile.id===value.outputProfileId)??portraitProfile), crf: value.crf }');
change("audio: { mode: 'none' },","audio: { mode: 'none' },\n    prompts: [],");
change('warnings: string[] = [];','warnings: string[] = projectWarnings(project);');
change("asset.id === assetId && asset.kind === 'image'", "asset.id === assetId && asset.kind !== 'font'");
change('    asset.sourceNote = note.trim();', "    asset.sourceNote = note.trim();\n    if(next.prompts)next.prompts=next.prompts.map(prompt=>prompt.assetId===assetId?{...prompt,status:approved?'approved':'uploaded'}:prompt);");
t+=`\nexport async function upgradeFlexible(id:string,revision:number){return flexibleLock(id,async()=>{const current=await readFlexible(id);assertRevision(current,revision);if(current.schemaVersion==='2.1.0')return current;return commitFlexible(current,upgradeFlexibleDocument(current));});}
export async function flexibleHistory(id:string){
  const folder=await flexibleFolder(id);const history=[];
  for(const entry of await fs.readdir(await safePath(folder,'history'))){if(!/^revision-\\d+\\.json$/.test(entry))continue;const previous=validateFlexible(JSON.parse(await fs.readFile(await safePath(folder,'history/'+entry),'utf8')));if(previous.id!==id)throw new AppError(422,'INVALID_HISTORY','هوية الإصدار التاريخي غير مطابقة.');history.push({revision:previous.revision,name:previous.name,updatedAt:previous.updatedAt});}
  return history.sort((a,b)=>b.revision-a.revision);
}
export async function restoreFlexible(id:string,revision:number,target:number){return flexibleLock(id,async()=>{
  const current=await readFlexible(id);assertRevision(current,revision);if(!Number.isSafeInteger(target)||target<1||target>=current.revision)throw new AppError(400,'INVALID_HISTORY','اختر إصدارًا سابقًا.');
  const next=validateFlexible(JSON.parse(await fs.readFile(await safePath(await flexibleFolder(id),'history/revision-'+target+'.json'),'utf8')));
  if(next.id!==id||next.revision!==target)throw new AppError(422,'INVALID_HISTORY','نسخة تاريخية غير متوافقة.');
  // Keep all registered files available to previous queued renders and future recovery.
  const assets=new Map([...current.assets,...next.assets].map(asset=>[asset.id,asset]));next.assets=[...assets.values()];
  for(const asset of next.assets)await flexibleAssetPath(current,asset);
  return commitFlexible(current,next);
});}
export {stageFlexible};
`;
fs.writeFileSync(file,t);
file='apps/server/src/flexible-routes.ts';t=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
t="import {uploadFlexibleMedia} from './flexible-media.ts';\n"+t;
t=t.replace('  libraryImage,','  libraryImage,\n  upgradeFlexible,\n  flexibleHistory,\n  restoreFlexible,');
t=t.replace('bodyLimit: 51 * 1024 * 1024','bodyLimit: 251 * 1024 * 1024');
t=t.replace('const project = await uploadFlexibleImage(\n        params(request).id,\n        params(request).sceneId,\n        expected,\n        part,\n      );',`const current=await readFlexible(params(request).id),query=request.query as {slot?:string;promptId?:string};
      const project = current.schemaVersion==='2.0.0'?await uploadFlexibleImage(current.id,params(request).sceneId,expected,part):await uploadFlexibleMedia(current.id,expected,part,params(request).sceneId,Number(query.slot??0),query.promptId);`);
const routes=`  server.post('/api/flexible/projects/:id/upgrade',async(request,reply)=>{const project=await upgradeFlexible(params(request).id,revision(request));etag(reply,project);return project;});
  server.get('/api/flexible/projects/:id/history',async(request)=>{await readFlexible(params(request).id);return flexibleHistory(params(request).id);});
  server.post('/api/flexible/projects/:id/restore',async(request,reply)=>{const value=body(request,['revision']);const project=await restoreFlexible(params(request).id,revision(request),value.revision as number);etag(reply,project);return project;});
  server.post('/api/flexible/projects/:id/media',{bodyLimit:251*1024*1024},async(request,reply)=>{const part=await request.file();if(!part)throw new AppError(400,'MISSING_UPLOAD','اختر ملفًا.');const project=await uploadFlexibleMedia(params(request).id,revision(request),part);etag(reply,project);return project;});
`;
t=t.replace("  server.get('/api/flexible/projects',",routes+"  server.get('/api/flexible/projects',");
fs.writeFileSync(file,t);
file='apps/server/src/index.ts';t=fs.readFileSync(file,'utf8').replace('fileSize:50*1024*1024','fileSize:250*1024*1024');fs.writeFileSync(file,t);
