import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {setTimeout as pause} from 'node:timers/promises';
import {editableOf,templates,legacyTemplates,defaultSceneContent,upgradeTextEditing} from '@elmekawy/shared';
import type {Project} from '@elmekawy/shared';
const workspace=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const testRoot=path.join(workspace,'.studio/test-runs',randomUUID());
await fs.mkdir(testRoot,{recursive:true});process.env.STUDIO_DATA_ROOT=testRoot;
const store:typeof import('../apps/server/src/storage.ts')=await import('../apps/server/src/storage.ts');
const projects=await import('../apps/server/src/projects.ts');
await store.initialize();
const baseProject=await projects.createProject('مشروع اختبار','Elmekawy BIM','اختبار الحفظ الحقيقي','bim-motion-study');
test('legacy text upgrades preserve saved values without changing repeated words elsewhere',async()=>{
  for(const spec of legacyTemplates){const original=await projects.createProject('Legacy edit fixture','Local','',spec.id);original.template.version='1.0.0';original.scenes.forEach((scene,i)=>{scene.content=defaultSceneContent(spec.scenes[i]);});
    if(spec.id==='bim-personal-intro')original.scenes[1].content['One coordinated vision.']='رؤية محفوظة من قبل';else original.scenes[0].content.BIM='SAVED BIM';store.assertProject(original);const before=structuredClone(original),upgraded=upgradeTextEditing(original);store.assertProject(upgraded);assert.deepEqual(original,before);assert.equal(upgraded.id,original.id);assert.deepEqual(upgraded.assets,original.assets);assert.equal(upgraded.revision,original.revision);assert.deepEqual(upgradeTextEditing(upgraded),upgraded);
    if(spec.id==='bim-personal-intro'){assert.equal(upgraded.scenes[1].content['infrastructure.caption2'],'رؤية محفوظة من قبل');assert.equal(upgraded.scenes[1].content['infrastructure.title3'],'BIM');}else{assert.equal(upgraded.scenes[0].content['hook.title3'],'SAVED BIM');assert.equal(upgraded.scenes[0].content['global.brandSuffix'],'BIM');assert.equal(upgraded.scenes[4].content['cta.brandSuffix'],'BIM');}
  }
});
test('editor exposes every scene field and persistent header field with a unique labeled input',async()=>{
  const requireStudio=createRequire(path.join(workspace,'apps/studio/package.json'));
  const requireRoot=createRequire(path.join(workspace,'package.json'));
  const ts=requireRoot('typescript');const React=requireStudio('react');const {renderToStaticMarkup}=requireStudio('react-dom/server');
  const source=await fs.readFile(path.join(workspace,'apps/studio/src/SceneTextEditor.tsx'),'utf8');const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const module={exports:{} as {SceneTextEditor?:unknown}};new Function('require','module','exports',compiled)(requireStudio,module,module.exports);const Component=module.exports.SceneTextEditor;
  for(const template of templates){const scenes=template.scenes.map(scene=>({id:scene.id,description:'',content:defaultSceneContent(scene)}));for(let index=0;index<scenes.length;index++){const html=renderToStaticMarkup(React.createElement(Component,{template,scenes,sceneIndex:index,disabled:false,onChange:()=>{}}));const inputs=[...html.matchAll(/data-text-field="([^"]+)"/g)].map(match=>match[1]);const expected=[...template.scenes[index].textFields!.filter(field=>field.group!=='global'),...template.scenes.flatMap(scene=>scene.textFields!.filter(field=>field.group==='global'))];assert.equal(inputs.length,new Set(inputs).size);assert.deepEqual([...inputs].sort(),expected.map(field=>field.id).sort());for(const field of expected)assert.ok(html.includes('for="text-'+field.id+'"'),field.id);}}
});
test('strict schema rejects unknown fields, timing drift, and invented content keys',()=>{
  const unknown={...editableOf(baseProject),assets:[]};assert.throws(()=>store.assertEditable(unknown));
  const timing=structuredClone(baseProject);timing.video.durationFrames=900;assert.throws(()=>store.assertProject(timing));
  const fields=structuredClone(baseProject);fields.scenes[0].content['<script>']='bad';assert.throws(()=>store.assertProject(fields));
  const newer={...baseProject,schemaVersion:'2.0.0'};assert.throws(()=>store.assertProject(newer));
});
test('safe Windows paths reject traversal, drive/UNC/ADS aliases and junctions',async t=>{
  for(const unsafe of ['../outside','assets\\secret','C:/Windows/file','//server/share','assets/file.png:secret','assets/CON.txt','assets/trailing.','assets/trailing ','assets/../project.json','./file'])await assert.rejects(()=>store.safePath(testRoot,unsafe));
  const junction=path.join(testRoot,'escape');try{await fs.symlink(store.sharedRoot,junction,'junction');}catch(error){if(['EPERM','EACCES'].includes((error as NodeJS.ErrnoException).code??'')){t.diagnostic('Junction creation unavailable; all lexical cases were verified.');return;}throw error;}
  await assert.rejects(()=>store.safePath(testRoot,'escape/catalog.json'));
});
test('saved Unicode content survives disk reload and concurrent stale updates cannot win',async()=>{
  const edit=editableOf(baseProject),key='hook.title1';edit.scenes[0].content[key]='نص محفوظ فعليًا';
  const saved=await store.saveProject(baseProject.id,edit,1);assert.equal(saved.revision,2);assert.equal((await store.readProject(saved.id)).scenes[0].content[key],'نص محفوظ فعليًا');
  const next=editableOf(saved);const outcomes=await Promise.allSettled([store.saveProject(saved.id,next,2),store.saveProject(saved.id,next,2)]);assert.equal(outcomes.filter(value=>value.status==='fulfilled').length,1);assert.equal(outcomes.filter(value=>value.status==='rejected').length,1);assert.equal((await store.readProject(saved.id)).revision,3);
  const history=JSON.parse(await fs.readFile(path.join(store.projectRoot,saved.id,'history/revision-1.json'),'utf8'));assert.equal(history.revision,1);assert.equal(history.scenes[0].content[key],'الموديل');
});
test('project duplication copies media independently without source or dependencies',async()=>{
  const original=await store.readProject(baseProject.id),copy=await store.duplicateProject(original.id,'نسخة اختبار');assert.notEqual(copy.id,original.id);assert.equal(copy.template.version,original.template.version);
  const files=await fs.readdir(await store.projectFolder(copy.id));assert.equal(files.includes('node_modules'),false);assert.equal(files.includes('src'),false);assert.equal(files.includes('package.json'),false);
  const asset=copy.assets.find(item=>item.role==='structural')!;const sourceAsset=original.assets.find(item=>item.role==='structural')!;const copiedFile=await store.assetPath(copy,asset),originalFile=await store.assetPath(original,sourceAsset);assert.notEqual(copiedFile,originalFile);assert.equal(await store.hashFile(copiedFile),await store.hashFile(originalFile));
  await fs.appendFile(copiedFile,'test corruption');assert.equal(await store.hashFile(originalFile),sourceAsset.sha256);await assert.rejects(()=>store.verifyAsset(copy,asset));
});
const port=14311;
const child=spawn(process.execPath,['apps/server/src/index.ts'],{cwd:workspace,env:{...process.env,STUDIO_DATA_ROOT:testRoot,STUDIO_PORT:String(port)},stdio:['ignore','pipe','pipe'],windowsHide:true});
let serverLog='';child.stdout.on('data',chunk=>{serverLog+=chunk;});child.stderr.on('data',chunk=>{serverLog+=chunk;});
let token='';const base='http://127.0.0.1:'+port;
for(let i=0;i<100;i++){try{const response=await fetch(base+'/api/session');if(response.ok){token=(await response.json()).token;break;}}catch{}await pause(100);}
if(!token){child.kill();throw new Error('Isolated API failed to start: '+serverLog);}
after(async()=>{child.kill();await new Promise<void>(resolve=>{if(child.exitCode!==null)resolve();else child.once('exit',()=>resolve());});await fs.writeFile(path.join(testRoot,'TEST_RUN.md'),'Isolated test data retained for diagnostics. No protected originals or active user projects were modified.\n');});
const headers={'Content-Type':'application/json','X-Studio-Token':token};
async function request(route:string,method='GET',body?:unknown,extra:Record<string,string>={}){return fetch(base+route,{method,headers:{...headers,...extra},...(body===undefined?{}:{body:JSON.stringify(body)})});}
let apiProject:Project;
test('local API enforces session/origin/strict input and creates safe distinct IDs',async()=>{
  assert.equal((await fetch(base+'/api/projects',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,403);
  assert.equal((await request('/api/health','GET',undefined,{Origin:'https://untrusted.example'})).status,403);
  assert.equal((await request('/api/projects','POST',{name:'test',client:'',objective:'',templateId:'unknown'})).status,400);
  const body={name:'مشروع API',client:'Local',objective:'Actual local storage',templateId:'bim-motion-study'};
  const first=await request('/api/projects','POST',body),second=await request('/api/projects','POST',body);assert.equal(first.status,201);assert.equal(second.status,201);apiProject=await first.json();assert.notEqual(apiProject.id,(await second.json()).id);assert.match(apiProject.id,/^api--[a-f0-9]{32}$/);assert.match(store.makeId('مشروع'),/^project--[a-f0-9]{32}$/);
  assert.equal((await request('/archive/manifest.json')).status,404);for(const unsafe of ['/api/projects/%2e%2e','/api/projects/%252e%252e','/api/projects/C%3A%5CWindows'])assert.ok([400,404].includes((await request(unsafe)).status));
});
test('API saves actually persist, while missing/stale revisions and managed asset edits fail',async()=>{
  const edit=editableOf(apiProject);edit.name='اسم محفوظ على القرص';
  assert.equal((await request('/api/projects/'+apiProject.id,'PUT',edit)).status,428);
  const saved=await request('/api/projects/'+apiProject.id,'PUT',edit,{'If-Match':'"r1"'});assert.equal(saved.status,200);apiProject=await saved.json();assert.equal(apiProject.revision,2);
  const reloaded=await request('/api/projects/'+apiProject.id);assert.equal((await reloaded.json()).name,'اسم محفوظ على القرص');assert.equal(reloaded.headers.get('etag'),'"r2"');
  assert.equal((await request('/api/projects/'+apiProject.id,'PUT',edit,{'If-Match':'"r1"'})).status,412);
  assert.equal((await request('/api/projects/'+apiProject.id,'PUT',{...edit,assets:[]},{'If-Match':'"r2"'})).status,400);
});
test('HEAD/GET MIME and byte lengths agree, range requests work, invalid media IDs fail',async()=>{
  const descriptor=await (await request('/api/projects/'+apiProject.id+'/resolve','POST',{})).json();const url=descriptor.inputProps.media['assets/generated/structural-bim.png'];
  const get=await fetch(url),head=await fetch(url,{method:'HEAD'});assert.equal(head.status,200);assert.equal(head.headers.get('content-length'),get.headers.get('content-length'));assert.equal(head.headers.get('content-type'),'image/png');await get.arrayBuffer();
  const loopback=await fetch(base+'/ui-fonts/Cairo.ttf',{method:'HEAD',headers:{Origin:'http://localhost:'+port}});assert.equal(loopback.status,200);assert.equal(loopback.headers.get('access-control-allow-origin'),'http://localhost:'+port);
  const range=await fetch(url,{headers:{Range:'bytes=0-3'}});assert.equal(range.status,206);assert.equal((await range.arrayBuffer()).byteLength,4);assert.match(range.headers.get('content-range')!,/^bytes 0-3\//);
  assert.equal((await fetch(url,{headers:{Range:'bytes=999999999-'}})).status,416);
  assert.equal((await request('/media/projects/'+apiProject.id+'/bad/badhash')).status,400);
});
test('manual image upload verifies bytes, persists a generated safe filename and keeps paired fallback',async()=>{
  let form=new FormData();form.append('file',new Blob(['this is not an image'],{type:'image/png'}),'fake.png');let response=await fetch(base+'/api/projects/'+apiProject.id+'/assets/before',{method:'POST',headers:{'X-Studio-Token':token,'If-Match':'"r2"'},body:form});assert.equal(response.status,415);
  const structural=(await projects.loadCatalog()).resources.find(asset=>asset.role==='structural')!;const bytes=await fs.readFile(path.join(store.sharedRoot,structural.storage!.path));form=new FormData();form.append('file',new Blob([bytes],{type:'image/png'}),'../../wrong-name.html');response=await fetch(base+'/api/projects/'+apiProject.id+'/assets/before',{method:'POST',headers:{'X-Studio-Token':token,'If-Match':'"r2"'},body:form});const result=await response.json();assert.equal(response.status,200,JSON.stringify(result));apiProject=result;
  const before=apiProject.assets.find(asset=>asset.role==='before'&&asset.state==='ready')!;assert.match(before.storage!.path,/^assets\/images\/asset-[a-f0-9]{32}\.png$/);assert.equal(apiProject.revision,3);
  const descriptor=await(await request('/api/projects/'+apiProject.id+'/resolve','POST',{})).json();assert.equal(descriptor.inputProps.assets.before,true);assert.equal(descriptor.inputProps.assets.after,false);assert.equal(descriptor.warnings.length,1);
});
test('queued render can be cancelled and cannot download a partial output',async()=>{
  const created=await request('/api/projects/'+apiProject.id+'/renders','POST',{revision:apiProject.revision});assert.equal(created.status,202);const job=await created.json();const cancelled=await request('/api/renders/'+job.id+'/cancel','POST',{});assert.equal(cancelled.status,200);assert.equal((await cancelled.json()).state,'cancelled');assert.equal((await request('/api/renders/'+job.id+'/download')).status,409);
  // Starting the worker must never replace the terminal cancellation state.
  await pause(100);assert.equal((await(await request('/api/renders/'+job.id)).json()).state,'cancelled');
  const persisted=JSON.parse(await fs.readFile(path.join(testRoot,'.studio/jobs',job.id+'.json'),'utf8'));assert.equal(persisted.state,'cancelled');
});
test('actual MP4 export freezes saved Unicode content while the next revision is edited',async()=>{
  const edit=editableOf(apiProject),key='hook.title1';edit.scenes[0].content[key]='تصدير محفوظ';
  let response=await request('/api/projects/'+apiProject.id,'PUT',edit,{'If-Match':'"r'+apiProject.revision+'"'});assert.equal(response.status,200);apiProject=await response.json();const frozenRevision=apiProject.revision;
  response=await request('/api/projects/'+apiProject.id+'/renders','POST',{revision:frozenRevision});assert.equal(response.status,202);let job=await response.json();
  const newer=editableOf(apiProject);newer.scenes[0].content[key]='تعديل لاحق لا يدخل التصدير الجاري';response=await request('/api/projects/'+apiProject.id,'PUT',newer,{'If-Match':'"r'+apiProject.revision+'"'});assert.equal(response.status,200);apiProject=await response.json();
  for(let i=0;i<1200;i++){job=await(await request('/api/renders/'+job.id)).json();if(['completed','failed','cancelled','interrupted'].includes(job.state))break;await pause(100);}
  const folder=path.join(testRoot,'projects',apiProject.id,'renders',job.id);if(job.state!=='completed'){const log=await fs.readFile(path.join(folder,'render.log'),'utf8');assert.fail('Render failed: '+log);}
  assert.equal(job.projectRevision,frozenRevision);assert.equal(job.state,'completed');const snapshot=JSON.parse(await fs.readFile(path.join(folder,'project.snapshot.json'),'utf8'));assert.equal(snapshot.scenes[0].content[key],'تصدير محفوظ');assert.equal((await store.readProject(apiProject.id)).scenes[0].content[key],'تعديل لاحق لا يدخل التصدير الجاري');
  const probe=JSON.parse(await fs.readFile(path.join(folder,'probe.json'),'utf8'));assert.equal(Number(probe.streams.find((stream:{codec_type:string})=>stream.codec_type==='video').nb_frames),360);const download=await request('/api/renders/'+job.id+'/download');assert.equal(download.status,200);assert.equal((await download.arrayBuffer()).byteLength,job.outputBytes);
});
