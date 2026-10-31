import fs from 'node:fs/promises';
import path from 'node:path';
import {fork} from 'node:child_process';
import type {ChildProcess,ForkOptions} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import type {RenderJob,RenderState} from '@elmekawy/shared';
import {browserPath} from '@elmekawy/motion-engine/server';
import {AppError,workspace,stateRoot,atomicJson,readProject,resolveProject,projectFolder,safePath,withLock} from './storage.ts';
const jobs=new Map<string,RenderJob>();const queue:string[]=[];let active:{id:string;child:ChildProcess}|null=null;let closing=false;
const jobFile=(id:string)=>path.join(stateRoot,'jobs',id+'.json');
const assertJobId=(id:string)=>{if(!/^job-[a-f0-9]{32}$/.test(id))throw new AppError(400,'INVALID_JOB','معرّف تصدير غير صالح.');};
const pendingWrites=new Map<string,Promise<void>>();
async function persist(job:RenderJob){const previous=pendingWrites.get(job.id)??Promise.resolve();const copy=structuredClone(job);const write=previous.catch(()=>{}).then(()=>atomicJson(jobFile(job.id),copy));pendingWrites.set(job.id,write);await write;if(pendingWrites.get(job.id)===write)pendingWrites.delete(job.id);}
async function update(id:string,patch:Partial<RenderJob>){const job=jobs.get(id)!;Object.assign(job,patch,{updatedAt:new Date().toISOString()});await persist(job);}
export async function initializeJobs(){for(const entry of await fs.readdir(path.join(stateRoot,'jobs'))){if(!/^job-[a-f0-9]{32}\.json$/.test(entry))continue;try{const job=JSON.parse(await fs.readFile(path.join(stateRoot,'jobs',entry),'utf8')) as RenderJob;assertJobId(job.id);if(['queued','bundling','resolving','rendering','verifying'].includes(job.state)){job.state='interrupted';job.error='توقف الخادم قبل اكتمال هذا التصدير. أعد المحاولة كتصدير جديد.';await persist(job);}jobs.set(job.id,job);}catch{console.error('Unreadable render record: '+entry);}}}
export function getJob(id:string){assertJobId(id);const job=jobs.get(id);if(!job)throw new AppError(404,'JOB_NOT_FOUND','عملية التصدير غير موجودة.');return job;}
export const listJobs=(projectId:string)=>[...jobs.values()].filter(job=>job.projectId===projectId).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
export async function jobFolder(job:RenderJob){return safePath(await projectFolder(job.projectId),'renders/'+job.id);}
export async function enqueueRender(id:string,revision:number,origin:string){
  try{await fs.access(browserPath(workspace));}catch{throw new AppError(503,'BROWSER_UNAVAILABLE','محرك Chrome المحلي غير مجهّز. شغّل npm.cmd run seed.');}
  const job=await withLock(id,async()=>{const project=await readProject(id);if(project.revision!==revision)throw new AppError(412,'STALE_REVISION','احفظ الإصدار الحالي قبل التصدير.');const descriptor=await resolveProject(project,origin);const now=new Date().toISOString();const job:RenderJob={id:'job-'+randomUUID().replaceAll('-',''),projectId:id,projectRevision:revision,projectName:project.name,state:'queued',progress:0,createdAt:now,updatedAt:now};
    const folder=await safePath(await projectFolder(id),'renders/'+job.id);await fs.mkdir(folder);await atomicJson(path.join(folder,'project.snapshot.json'),project);await atomicJson(path.join(folder,'descriptor.runtime.json'),descriptor);await atomicJson(path.join(folder,'descriptor.json'),{...descriptor,inputProps:{...descriptor.inputProps,media:Object.fromEntries(project.assets.filter(asset=>asset.state==='ready').map(asset=>[asset.mediaKey,{id:asset.id,sha256:asset.sha256}]))}});await fs.writeFile(path.join(folder,'render.log'),'Local render queued at '+now+'\n');jobs.set(job.id,job);await persist(job);return job;});
  queue.push(job.id);void drain();return job;
}
async function drain(){if(active||closing)return;const id=queue.shift();if(!id)return;const job=jobs.get(id)!;if(job.state!=='queued'){void drain();return;}
  try{const folder=await jobFolder(job);const options:ForkOptions&{windowsHide:boolean}={cwd:workspace,stdio:['ignore','pipe','pipe','ipc'],windowsHide:true};const child=fork(fileURLToPath(new URL('./render-worker.ts',import.meta.url)),[folder],options);active={id,child};await update(id,{state:'bundling'});const log=async(data:Buffer)=>{await fs.appendFile(path.join(folder,'render.log'),data).catch(()=>{});};child.stdout?.on('data',log);child.stderr?.on('data',log);
    child.on('message',async raw=>{const message=raw as {kind:string;state:RenderState;progress:number;size:number;sha256:string;message:string};if(job.state==='cancelled'||job.state==='interrupted')return;try{if(message.kind==='progress')await update(id,{state:message.state,progress:message.progress});if(message.kind==='completed')await update(id,{state:'completed',progress:1,outputBytes:message.size,outputSha256:message.sha256,downloadUrl:'/api/renders/'+id+'/download'});if(message.kind==='failed')await update(id,{state:'failed',error:'تعذر إكمال التصدير. تفاصيل التشخيص محفوظة في render.log.'});}catch(error){console.error('Render state update failed',error);}});
    child.on('error',async()=>{await update(id,{state:'failed',error:'تعذر تشغيل عامل التصيير المحلي.'});});
    child.on('exit',async()=>{await pendingWrites.get(id)?.catch(()=>{});if(!['completed','failed','cancelled','interrupted'].includes(job.state))await update(id,{state:'failed',error:'توقف عامل التصيير قبل إكمال الفيديو.'});active=null;void drain();});
  }catch{active=null;await update(id,{state:'failed',error:'تعذر تجهيز مجلد أو عامل التصيير.'});void drain();}
}
export async function cancelRender(id:string){const job=getJob(id);if(['completed','failed','cancelled','interrupted'].includes(job.state))return job;await update(id,{state:'cancelled'});if(active?.id===id)active.child.kill();return job;}
export async function shutdownRenders(){closing=true;if(active){if(['queued','bundling','resolving','rendering','verifying'].includes(jobs.get(active.id)!.state))await update(active.id,{state:'interrupted',error:'تم إيقاف الخادم.'});active.child.kill();}await Promise.all([...pendingWrites.values()]);}
