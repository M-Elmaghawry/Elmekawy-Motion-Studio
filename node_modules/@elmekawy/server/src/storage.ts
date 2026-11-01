import fs from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import Ajv from 'ajv';
import {editableSchema,projectSchema,projectIdPattern,semanticErrors,templateFor} from '@elmekawy/shared';
import type {Project,EditableProject,Asset,Descriptor} from '@elmekawy/shared';
export const workspace=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
export const dataRoot=process.env.STUDIO_DATA_ROOT?path.resolve(process.env.STUDIO_DATA_ROOT):workspace;
export const projectRoot=path.join(dataRoot,'projects');
export const sharedRoot=path.join(workspace,'shared-assets');
export const stateRoot=path.join(dataRoot,'.studio');
export class AppError extends Error{statusCode:number;code:string;issues?:unknown;constructor(status:number,code:string,message:string,issues?:unknown){super(message);this.statusCode=status;this.code=code;this.issues=issues;}}
const ajv=new Ajv({allErrors:true,coerceTypes:false,removeAdditional:false,useDefaults:false,strict:true});
const validateProject=ajv.compile(projectSchema);
const validateEditable=ajv.compile(editableSchema);
export function assertProject(value:unknown):asserts value is Project{
  if(!validateProject(value))throw new AppError(422,'INVALID_PROJECT','ملف المشروع لا يطابق مخطط البيانات.',validateProject.errors);
  const issues=semanticErrors(value as Project);if(issues.length)throw new AppError(422,'PROJECT_CONFLICT',issues[0],issues);
}
export function assertEditable(value:unknown):asserts value is EditableProject{if(!validateEditable(value))throw new AppError(400,'INVALID_INPUT','راجع حقول المشروع وقيم النصوص.',validateEditable.errors);if(!(value as EditableProject).name.trim())throw new AppError(400,'INVALID_NAME','اسم المشروع مطلوب.');}
export const hashFile=async(file:string)=>{const hash=createHash('sha256');for await(const chunk of createReadStream(file))hash.update(chunk);return hash.digest('hex');};
export const validId=(id:string)=>{if(id.length>82||!new RegExp(projectIdPattern).test(id))throw new AppError(400,'INVALID_ID','معرّف المشروع غير صالح.');return id;};
export async function safePath(base:string,relative:string){
  if(!relative||relative.includes('\\')||relative.includes(':')||relative.includes('\0')||path.isAbsolute(relative))throw new AppError(400,'UNSAFE_PATH','مسار ملف غير مسموح.');
  const parts=relative.split('/');if(parts.some(part=>!part||part==='.'||part==='..'||/[. ]$/.test(part)||/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part)))throw new AppError(400,'UNSAFE_PATH','اسم ملف غير مسموح.');
  const target=path.resolve(base,...parts),rel=path.relative(base,target);if(rel.startsWith('..')||path.isAbsolute(rel))throw new AppError(400,'UNSAFE_PATH','المسار خارج مساحة المشروع.');
  let current=base;const baseStat=await fs.lstat(base);if(baseStat.isSymbolicLink())throw new AppError(400,'LINK_DENIED','روابط نظام الملفات غير مسموحة.');
  const realBase=await fs.realpath(base);
  for(const part of parts){current=path.join(current,part);try{const stat=await fs.lstat(current);if(stat.isSymbolicLink())throw new AppError(400,'LINK_DENIED','روابط نظام الملفات غير مسموحة.');const real=await fs.realpath(current);const actual=path.relative(realBase,real);if(actual.startsWith('..')||path.isAbsolute(actual))throw new AppError(400,'UNSAFE_PATH','المسار خارج مساحة المشروع.');}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')break;throw error;}}
  return target;
}
export async function atomicJson(file:string,value:unknown){
  await fs.mkdir(path.dirname(file),{recursive:true});const temp=path.join(path.dirname(file),'.'+path.basename(file)+'.'+randomUUID()+'.tmp');
  const handle=await fs.open(temp,'wx');try{await handle.writeFile(JSON.stringify(value,null,2)+'\n','utf8');await handle.sync();}finally{await handle.close();}
  try{await fs.rename(temp,file);}catch(error){await fs.unlink(temp).catch(()=>{});throw error;}
}
const locks=new Map<string,Promise<void>>();
export async function withLock<T>(id:string,action:()=>Promise<T>):Promise<T>{const previous=locks.get(id)??Promise.resolve();let release!:()=>void;const next=new Promise<void>(resolve=>{release=resolve;});locks.set(id,next);await previous;try{return await action();}finally{release();if(locks.get(id)===next)locks.delete(id);}}
export async function initialize(){for(const dir of [projectRoot,sharedRoot,stateRoot,path.join(projectRoot,'.staging'),path.join(stateRoot,'staging'),path.join(stateRoot,'jobs')]){await fs.mkdir(dir,{recursive:true});if((await fs.lstat(dir)).isSymbolicLink())throw new Error('Managed roots cannot be filesystem links');}}
export async function readProject(id:string):Promise<Project>{
  const folder=await safePath(projectRoot,validId(id));let file:string;try{file=await safePath(folder,'project.json');}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')throw new AppError(404,'NOT_FOUND','المشروع غير موجود.');throw error;}let value:unknown;
  try{value=JSON.parse((await fs.readFile(file,'utf8')).replace(/^\uFEFF/,''));}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')throw new AppError(404,'NOT_FOUND','المشروع غير موجود.');throw new AppError(422,'PROJECT_UNREADABLE','تعذر قراءة ملف المشروع.');}
  assertProject(value);if(value.id!==id)throw new AppError(422,'IDENTITY_MISMATCH','هوية المشروع لا تطابق المجلد.');return value;
}
export async function listProjects(){const projects:Project[]=[],errors:{id:string;message:string}[]=[];for(const entry of await fs.readdir(projectRoot,{withFileTypes:true})){if(!entry.isDirectory()||entry.name.startsWith('.'))continue;try{projects.push(await readProject(entry.name));}catch(error){errors.push({id:entry.name,message:(error as Error).message});}}projects.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));return {projects,errors};}
export const makeId=(name:string)=>{const slug=name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48).replace(/-$/,'')||'project';return slug+'--'+randomUUID().replaceAll('-','');};
export async function projectFolder(id:string){return safePath(projectRoot,validId(id));}
export async function commitProject(project:Project){assertProject(project);const folder=await projectFolder(project.id);await atomicJson(await safePath(folder,'project.json'),project);}
export function applyEditable(project:Project,value:EditableProject):Project{assertEditable(value);const next=structuredClone(project);next.name=value.name.trim();next.brief=value.brief;next.script=value.script;next.prompts=value.prompts;next.output.crf=value.crf;if(project.template.version==='1.2.0')next.imageLayouts=structuredClone(value.imageLayouts??{});else if(value.imageLayouts!==undefined)throw new AppError(422,'LAYOUT_OPT_IN_REQUIRED','فعّل نسخة التحكم بالصور أولًا.');if(value.scenes.length!==next.scenes.length)throw new AppError(422,'INVALID_SCENES','لا يمكن حذف أو إعادة ترتيب مشاهد هذا القالب.');value.scenes.forEach((scene,i)=>{if(scene.id!==next.scenes[i].id)throw new AppError(422,'INVALID_SCENES','ترتيب المشاهد ثابت.');next.scenes[i].description=scene.description;next.scenes[i].content=scene.content;});assertProject(next);return next;}
export async function saveProject(id:string,value:EditableProject,revision:number){return withLock(id,async()=>{const current=await readProject(id);if(current.revision!==revision)throw new AppError(412,'STALE_REVISION','المشروع تغيّر. أعد تحميل الإصدار قبل الحفظ.');const next=applyEditable(current,value);next.revision++;next.updatedAt=new Date().toISOString();const folder=await projectFolder(id);await atomicJson(await safePath(folder,'history/revision-'+current.revision+'.json'),current);await commitProject(next);return next;});}
export async function assetPath(project:Project,asset:Asset){if(!asset.storage)throw new AppError(404,'MISSING_ASSET','ملف الوسائط غير متوفر.');if(asset.storage.scope==='project'&&!asset.storage.path.startsWith('assets/'))throw new AppError(400,'UNSAFE_MEDIA_PATH','الوسائط يجب أن تبقى داخل مجلد assets.');if(asset.storage.scope==='shared'){const catalog=JSON.parse(await fs.readFile(path.join(sharedRoot,'catalog.json'),'utf8')) as {resources:Asset[]};if(!catalog.resources.some(item=>item.storage?.path===asset.storage!.path&&item.sha256===asset.sha256))throw new AppError(400,'UNREGISTERED_SHARED_ASSET','أصل مشترك غير مسجل.');}return safePath(asset.storage.scope==='shared'?sharedRoot:await projectFolder(project.id),asset.storage.path);}
const verified=new Map<string,{size:number;mtime:number;sha:string}>();
export async function verifyAsset(project:Project,asset:Asset){const file=await assetPath(project,asset);let stat;try{stat=await fs.stat(file);}catch{throw new AppError(422,'MISSING_MEDIA','ملف وسائط مسجل غير موجود: '+asset.displayName);}
  if(!stat.isFile()||stat.size!==asset.byteSize)throw new AppError(422,'CHANGED_MEDIA','حجم الوسائط لا يطابق الملف المسجل.');const cached=verified.get(file);if(!cached||cached.size!==stat.size||cached.mtime!==stat.mtimeMs||cached.sha!==asset.sha256){const sha=await hashFile(file);if(sha!==asset.sha256)throw new AppError(422,'CHANGED_MEDIA','تغيّر ملف الوسائط المسجل.');verified.set(file,{size:stat.size,mtime:stat.mtimeMs,sha});}return file;}
export async function resolveProject(project:Project,origin:string):Promise<Descriptor>{assertProject(project);const media:Record<string,string>={},assets:Record<string,boolean>={};for(const asset of project.assets){if(asset.state==='retired')continue;assets[asset.role]=asset.state==='ready';if(asset.state==='ready'){await verifyAsset(project,asset);media[asset.mediaKey]=origin+'/media/projects/'+project.id+'/'+asset.id+'/'+asset.sha256;}}
  const template=templateFor(project.template.id,project.template.version),edits=Object.assign({},...project.scenes.map(scene=>scene.content));const warnings:string[]=[];
  if(template.id==='bim-motion-study'&&!(assets.before&&assets.after))warnings.push('صور قبل / بعد غير مكتملة؛ سيُستخدم البديل التخطيطي الأصلي للجانبين.');
  if(template.id==='bim-personal-intro')warnings.push('V1 يستخدم ملف الصوت الأصلي بمستوى 0.3، والشعار داخل خانة الصورة الشخصية.');
  return {projectRevision:project.revision,template:project.template,compositionId:template.compositionId,metadata:project.video,inputProps:{media,assets,edits,templateVersion:project.template.version,...(project.template.version==='1.2.0'?{imageLayouts:project.imageLayouts,imageKeys:Object.fromEntries(project.assets.map(asset=>[asset.id,asset.mediaKey]))}:{})},warnings};}
export async function stageProject(project:Project,copyMedia?:(folder:string)=>Promise<void>){assertProject(project);const stage=await safePath(projectRoot,'.staging/'+randomUUID());await fs.mkdir(stage);for(const dir of ['assets/images','assets/logos','assets/audio','assets/video','assets/fonts','assets/references','prompts','renders','history'])await fs.mkdir(path.join(stage,dir),{recursive:true});if(copyMedia)await copyMedia(stage);await atomicJson(path.join(stage,'project.json'),project);const final=await projectFolder(project.id);await fs.rename(stage,final);return project;}
export async function duplicateProject(id:string,name:string,expectedRevision?:number){return withLock(id,async()=>{const original=await readProject(id);if(expectedRevision!==undefined&&original.revision!==expectedRevision)throw new AppError(412,'STALE_REVISION','احفظ وأعد تحميل الإصدار الحالي.');const clone=structuredClone(original);clone.id=makeId(name);clone.name=name;clone.revision=1;clone.createdAt=clone.updatedAt=new Date().toISOString();clone.provenance={kind:'duplicate',source:original.id};clone.assets=clone.assets.filter(asset=>asset.state!=='retired');return stageProject(clone,async folder=>{for(const asset of clone.assets){if(asset.state==='ready'&&asset.storage?.scope==='project'){const source=await verifyAsset(original,asset);const destination=path.join(folder,asset.storage.path);await fs.mkdir(path.dirname(destination),{recursive:true});await fs.copyFile(source,destination);}}const prompts=path.join(await projectFolder(id),'prompts');for(const entry of await fs.readdir(prompts,{withFileTypes:true})){if(entry.isFile()&&/\.md$/i.test(entry.name)){const file=await safePath(prompts,entry.name);await fs.copyFile(file,path.join(folder,'prompts',entry.name));}}});});}
