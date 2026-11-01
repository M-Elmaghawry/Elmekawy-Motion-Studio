import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {brand} from '@elmekawy/shared/theme';
import {templates,templateFor,defaultSceneContent} from '@elmekawy/shared';
import type {Project,Asset,TemplateId,Prompt,RenderJob} from '@elmekawy/shared';
import {workspace,sharedRoot,stateRoot,projectRoot,initialize,hashFile,atomicJson,stageProject,makeId,listProjects,safePath,projectFolder} from './storage.ts';
type Catalog={resources:Asset[];prompts:Prompt[]};
let catalog:Catalog|null=null;
export async function loadCatalog(){if(!catalog)catalog=JSON.parse(await fs.readFile(path.join(sharedRoot,'catalog.json'),'utf8')) as Catalog;return catalog;}
export async function prepareResources(){
  await initialize();const manualTarget=path.join(sharedRoot,'prompt-templates/bim-motion-study/1.0.0/manual.md');await fs.mkdir(path.dirname(manualTarget),{recursive:true});try{await fs.copyFile(path.join(workspace,'elmekawy-bim-reel-V2/prompts/V2_ASSET_PROMPTS.md'),manualTarget,fs.constants.COPYFILE_EXCL);}catch(error){if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;}try{await fs.access(path.join(sharedRoot,'catalog.json'));return;}catch{}
  const original=path.join(workspace,'elmekawy-bim-reel-V2');
  const resources:Asset[]=[];
  const entries:[string,string,string,Asset['kind'],string][]=[
    ['font-cairo','fonts/Cairo.ttf','fonts/cairo/1.0.0/Cairo.ttf','font','font-cairo'],
    ['font-inter','fonts/Inter.ttf','fonts/inter/1.0.0/Inter.ttf','font','font-inter'],
    ['logo','assets/logos/ME-Logo.png','brands/elmekawy-bim/1.0.0/ME-Logo.png','logo','logo'],
    ['infrastructure','assets/generated/bim-infrastructure.png','defaults/1.0.0/bim-infrastructure.png','image','infrastructure'],
    ['structural','assets/generated/structural-bim.png','defaults/1.0.0/structural-bim.png','image','structural'],
    ['technology','assets/generated/bim-technology.png','defaults/1.0.0/bim-technology.png','image','technology'],
    ['audio-track','assets/audio/bim-reel.mp3','defaults/1.0.0/bim-reel.mp3','audio','audio-track']
  ];
  for(const [id,mediaKey,target,kind,role] of entries){const source=path.join(original,'public',mediaKey),destination=await safePath(sharedRoot,target);await fs.mkdir(path.dirname(destination),{recursive:true});try{await fs.copyFile(source,destination,fs.constants.COPYFILE_EXCL);}catch(error){if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;}const sha256=await hashFile(source);if(await hashFile(destination)!==sha256)throw new Error('Shared resource hash mismatch');resources.push({id,role,mediaKey,kind,displayName:path.basename(source),state:'ready',storage:{scope:'shared',path:target},sha256,byteSize:(await fs.stat(source)).size,mimeType:kind==='font'?'font/ttf':kind==='audio'?'audio/mpeg':'image/png',originalFilename:path.basename(source),license:{status:kind==='font'?'documented':'unknown',...(kind==='font'?{note:'Original OFL license retained beside the exact TTF bytes.'}:{})}});}
  for(const family of ['Cairo','Inter']){const destination=await safePath(sharedRoot,'fonts/'+family.toLowerCase()+'/1.0.0/'+family+'-OFL.txt');try{await fs.copyFile(path.join(original,'public/fonts',family+'-OFL.txt'),destination,fs.constants.COPYFILE_EXCL);}catch(error){if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;}}
  const manual=await fs.readFile(path.join(original,'prompts/V2_ASSET_PROMPTS.md'),'utf8');
  const prompts:Prompt[]=['before','after'].map(part=>{const section=manual.split('## coordination-'+part)[1]?.split('\n## ')[0]??'';const text=section.match(/```text\r?\n([\s\S]*?)```/)?.[1].trim()??'';return {id:'prompt-'+part,title:'Coordination '+part,text,negativeConstraints:'No text, logos, watermark, real project identifiers or engineering verification claims.',sceneIds:['comparison'],status:'ready-to-copy'};});
  await atomicJson(path.join(sharedRoot,'catalog.json'),{resources,prompts});
  await atomicJson(path.join(sharedRoot,'brands/elmekawy-bim/1.0.0/brand.json'),{schemaVersion:'1.0.0',id:'elmekawy-bim',version:'1.0.0',colors:brand,resources:resources.filter(resource=>resource.kind==='font'||resource.kind==='logo')});
}
export async function createProject(name:string,client:string,objective:string,templateId:TemplateId,source?:string){
  const template=templateFor(templateId),catalog=await loadCatalog(),id=makeId(name),now=new Date().toISOString();
  const roles=templateId==='bim-personal-intro'?['font-cairo','font-inter','logo','infrastructure','structural','technology','audio-track']:['font-cairo','font-inter','logo','structural'];
  const assets:Asset[]=roles.map(role=>{const asset=structuredClone(catalog.resources.find(item=>item.role===role)!);if(role==='logo'&&templateId==='bim-personal-intro'){asset.role='portrait';asset.id='portrait';}if(asset.kind==='image'||asset.kind==='audio')asset.storage={scope:'project',path:'assets/'+(asset.kind==='audio'?'audio':'images')+'/'+asset.id+path.extname(asset.originalFilename!)};return asset;});
  if(templateId==='bim-motion-study')for(const side of ['before','after'])assets.push({id:'comparison-'+side,role:side,kind:'image',mediaKey:'assets/v2/coordination-'+side+'.png',displayName:'coordination-'+side+'.png',state:'missing',reason:'Not present in the protected V2 project; original schematic fallback is preserved.',license:{status:'unknown'}});
  const project:Project={schemaVersion:'1.0.0',id,revision:1,createdAt:now,updatedAt:now,name:name.trim(),status:'draft',brief:{client,objective,description:'',category:'engineering-brand',audience:'',platforms:['instagram-reels']},template:{id:templateId,version:template.version},video:{width:1080,height:1920,fps:30,durationFrames:template.durationFrames,aspectRatio:'9:16'},locale:{language:'ar-EG',direction:'rtl'},brand:{preset:{id:'elmekawy-bim',version:'1.0.0'},displayName:client||'Elmekawy BIM',colors:{navy:brand.navy,blue:brand.blue,cyan:brand.cyan,light:brand.light,ink:brand.ink,white:brand.white,muted:brand.muted},fonts:{arabic:{family:'Cairo',assetId:'font-cairo',weightMin:100,weightMax:900},latin:{family:'Inter',assetId:'font-inter',weightMin:100,weightMax:900}},logoAssetId:templateId==='bim-personal-intro'?'portrait':'logo',safeArea:{...brand.safe}},script:{text:'',notes:''},scenes:template.scenes.map((scene,i)=>({id:scene.id,type:templateId+'/'+scene.id,name:scene.name,description:'',startFrame:scene.from,durationFrames:scene.duration,outgoingExtensionFrames:templateId==='bim-personal-intro'&&i<5?12:0,content:defaultSceneContent(scene),assetBindings:{},promptIds:scene.id==='comparison'?['prompt-before','prompt-after']:[]})),assets,prompts:templateId==='bim-motion-study'?structuredClone(catalog.prompts):[],references:[],audio:templateId==='bim-personal-intro'?{mode:'track',assetId:'audio-track',volume:0.3}:{mode:'none'},output:{container:'mp4',codec:'h264',pixelFormat:'yuv420p',crf:18,presetId:'mp4-h264-v1',fileNameLabel:'video'},provenance:source?{kind:'legacy-import',source}:{kind:'created'}};
  return stageProject(project,async folder=>{for(const asset of assets){if(asset.storage?.scope==='project'){const original=catalog.resources.find(item=>item.mediaKey===asset.mediaKey)!;await fs.copyFile(await safePath(sharedRoot,original.storage!.path),path.join(folder,asset.storage.path));}}if(templateId==='bim-motion-study')await fs.copyFile(path.join(sharedRoot,'prompt-templates/bim-motion-study/1.0.0/manual.md'),path.join(folder,'prompts/V2_ASSET_PROMPTS.md'));});
}
export async function seedProjects(){
  await prepareResources();const existing=await listProjects();
  for(const [index,template] of templates.entries()){
    const source=index===0?'legacy-v1':'legacy-v2';let project=existing.projects.find(item=>item.provenance.kind==='legacy-import'&&item.provenance.source===source);
    if(!project){project=await createProject('Elmekawy BIM — '+(index===0?'V1':'V2'),'Elmekawy BIM','Preserved original composition',template.id,source);console.log('Imported '+project.name);}
    if(index===1){const marker=path.join(stateRoot,'legacy-output-import.json');try{await fs.access(marker);continue;}catch{}
      const jobId='job-'+randomUUID().replaceAll('-',''),folder=path.join(await projectFolder(project.id),'renders',jobId);await fs.mkdir(folder);const output=path.join(folder,'output.mp4');await fs.copyFile(path.join(workspace,'elmekawy-bim-reel-V2/out/elmekawy-bim-v2-motion-test.mp4'),output);await fs.cp(path.join(workspace,'elmekawy-bim-reel-V2/out/review'),path.join(folder,'legacy-review'),{recursive:true});
      const now=new Date().toISOString();const job:RenderJob={id:jobId,projectId:project.id,projectRevision:0,projectName:project.name,state:'completed',progress:1,createdAt:now,updatedAt:now,outputBytes:(await fs.stat(output)).size,outputSha256:await hashFile(output),downloadUrl:'/api/renders/'+jobId+'/download',legacyImport:true};
      await atomicJson(path.join(stateRoot,'jobs',jobId+'.json'),job);await atomicJson(path.join(folder,'render-manifest.json'),{kind:'legacy-import',source:'V2 original 12-second proof',sha256:job.outputSha256,originalInputRevision:'unknown',originalEngineRevision:'unknown'});await atomicJson(marker,{jobId,projectId:project.id});
    }
  }
}
