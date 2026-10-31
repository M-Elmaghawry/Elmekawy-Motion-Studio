import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import fs from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import type {FastifyReply,FastifyRequest} from 'fastify';
import {templates,templateFor} from '@elmekawy/shared';
import type {EditableProject} from '@elmekawy/shared';
import {AppError,workspace,stateRoot,sharedRoot,initialize,listProjects,readProject,saveProject,resolveProject,applyEditable,duplicateProject,verifyAsset,safePath} from './storage.ts';
import {createProject,loadCatalog} from './projects.ts';
import {uploadImage} from './uploads.ts';
import {initializeJobs,getJob,listJobs,enqueueRender,cancelRender,jobFolder,shutdownRenders} from './renders.ts';
const port=Number(process.env.STUDIO_PORT??4311);const origin='http://127.0.0.1:'+port;
const trustedOrigins=new Set([origin,'http://localhost:'+port,'http://127.0.0.1:5173']);
const token=randomBytes(32).toString('hex');
const server=Fastify({logger:false,bodyLimit:1024*1024});
await initialize();await loadCatalog();await initializeJobs();
const lock=path.join(stateRoot,'server.lock');
try{const handle=await fs.open(lock,'wx');await handle.writeFile(JSON.stringify({pid:process.pid,port}));await handle.close();}catch(error){if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;const previous=JSON.parse(await fs.readFile(lock,'utf8'));let running=true;try{process.kill(previous.pid,0);}catch{running=false;}if(running)throw new Error('A Studio process already owns this local port');await fs.unlink(lock);await fs.writeFile(lock,JSON.stringify({pid:process.pid,port}),{flag:'wx'});}
await server.register(multipart,{limits:{fileSize:50*1024*1024,files:1,fields:0,parts:1}});
server.addHook('onRequest',async request=>{
  if(!['127.0.0.1:'+port,'localhost:'+port].includes(request.headers.host??''))throw new AppError(400,'INVALID_HOST','اسم المضيف غير مسموح.');
  const requestOrigin=request.headers.origin;if(requestOrigin&&!trustedOrigins.has(requestOrigin))throw new AppError(403,'INVALID_ORIGIN','مصدر الطلب غير مسموح.');
  if(!['GET','HEAD','OPTIONS'].includes(request.method)){const supplied=request.headers['x-studio-token'];if(typeof supplied!=='string'||supplied.length!==token.length||!timingSafeEqual(Buffer.from(supplied),Buffer.from(token)))throw new AppError(403,'INVALID_SESSION','حدّث الصفحة لتجديد جلسة الاستوديو.');}
});
server.addHook('onSend',async(_request,reply,payload)=>{reply.header('X-Content-Type-Options','nosniff').header('Vary','Origin');if(_request.headers.origin&&trustedOrigins.has(_request.headers.origin))reply.header('Access-Control-Allow-Origin',_request.headers.origin);return payload;});
server.setErrorHandler((error,_request,reply)=>{const item=error as Error&{statusCode?:number;code?:string;issues?:unknown};let status=item.statusCode??500;if(item.code==='ENOSPC')status=507;reply.code(status).send({error:{code:item.code??'INTERNAL_ERROR',message:item instanceof AppError?item.message:status===413?'الملف أو الطلب أكبر من الحد المسموح.':status<500?item.message:'تعذر إكمال العملية المحلية. راجع سجل الخادم.',...(item instanceof AppError&&item.issues?{issues:item.issues}:{}),requestId:_request.id}});if(status>=500)console.error(item);});
const etag=(revision:number)=>'"r'+revision+'"';
function revision(request:FastifyRequest){const match=request.headers['if-match']?.match(/^"r(\d+)"$/);if(!match)throw new AppError(428,'REVISION_REQUIRED','الحفظ يتطلب رقم الإصدار الحالي.');return Number(match[1]);}
function params(request:FastifyRequest){return request.params as Record<string,string>;}
function objectBody(request:FastifyRequest){if(!request.body||typeof request.body!=='object'||Array.isArray(request.body))throw new AppError(400,'INVALID_BODY','صيغة الطلب غير صالحة.');return request.body as Record<string,unknown>;}
const checkedKeys=(body:Record<string,unknown>,keys:string[])=>{if(Object.keys(body).some(key=>!keys.includes(key)))throw new AppError(400,'UNKNOWN_FIELD','الطلب يحتوي حقولًا غير مدعومة.');};
server.get('/api/session',async()=>({token}));
server.get('/api/health',async()=>({ok:true,mode:'local',remotion:'4.0.539'}));
server.get('/api/templates',async()=>templates);
server.get('/api/projects',async()=>listProjects());
server.post('/api/projects',async(request,reply)=>{const body=objectBody(request);checkedKeys(body,['name','client','objective','templateId']);if(typeof body.name!=='string'||!body.name.trim()||body.name.length>120||typeof body.client!=='string'||body.client.length>120||typeof body.objective!=='string'||body.objective.length>10000||typeof body.templateId!=='string')throw new AppError(400,'INVALID_PROJECT_INPUT','راجع اسم المشروع والعلامة والهدف.');const template=templates.find(item=>item.id===body.templateId);if(!template)throw new AppError(400,'UNKNOWN_TEMPLATE','القالب المطلوب غير متوفر.');const project=await createProject(body.name,body.client,body.objective,template.id);reply.code(201).header('ETag',etag(project.revision)).header('Location','/api/projects/'+project.id);return project;});
server.get('/api/projects/:id',async(request,reply)=>{const project=await readProject(params(request).id);reply.header('ETag',etag(project.revision));return project;});
server.put('/api/projects/:id',async(request,reply)=>{const project=await saveProject(params(request).id,request.body as EditableProject,revision(request));reply.header('ETag',etag(project.revision));return project;});
server.post('/api/projects/:id/duplicate',async(request,reply)=>{const body=objectBody(request);checkedKeys(body,['name']);if(typeof body.name!=='string'||!body.name.trim()||body.name.length>120)throw new AppError(400,'INVALID_NAME','اسم النسخة مطلوب.');const project=await duplicateProject(params(request).id,body.name.trim());reply.code(201).header('ETag',etag(project.revision));return project;});
server.post('/api/projects/:id/resolve',async request=>{let project=await readProject(params(request).id);const body=objectBody(request);checkedKeys(body,['baseRevision','editableDraft']);if(body.baseRevision!==undefined&&body.baseRevision!==project.revision)throw new AppError(412,'STALE_REVISION','المشروع تغير منذ فتحه.');if(body.editableDraft)project=applyEditable(project,body.editableDraft as EditableProject);return resolveProject(project,origin);});
server.post('/api/projects/:id/assets/:role',{bodyLimit:51*1024*1024},async(request,reply)=>{const expectedRevision=revision(request);const {id,role}=params(request);await readProject(id);if(!/^[a-z-]+$/.test(role))throw new AppError(400,'INVALID_SLOT','خانة وسائط غير صالحة.');const part=await request.file();if(!part)throw new AppError(400,'MISSING_UPLOAD','اختر ملف صورة.');const project=await uploadImage(id,role,expectedRevision,part);reply.header('ETag',etag(project.revision));return project;});
server.post('/api/projects/:id/renders',async(request,reply)=>{const body=objectBody(request);checkedKeys(body,['revision']);if(!Number.isSafeInteger(body.revision))throw new AppError(400,'INVALID_REVISION','رقم الإصدار مطلوب.');const job=await enqueueRender(params(request).id,body.revision as number,origin);reply.code(202);return job;});
server.get('/api/projects/:id/renders',async request=>{await readProject(params(request).id);return listJobs(params(request).id);});
server.get('/api/renders/:id',async request=>getJob(params(request).id));
server.post('/api/renders/:id/cancel',async request=>cancelRender(params(request).id));
async function streamFile(request:FastifyRequest,reply:FastifyReply,file:string,mime:string,immutable=false){
  const stat=await fs.stat(file);if(!stat.isFile())throw new AppError(404,'FILE_NOT_FOUND','الملف غير موجود.');let start=0,end=stat.size-1;const range=request.headers.range;
  reply.type(mime).header('Accept-Ranges','bytes').header('Cache-Control',immutable?'public, max-age=31536000, immutable':'no-store');
  if(range){const match=range.match(/^bytes=(\d*)-(\d*)$/);if(!match||(!match[1]&&!match[2])){reply.code(416).header('Content-Range','bytes */'+stat.size);return reply.send();}if(!match[1])start=Math.max(0,stat.size-Number(match[2]));else start=Number(match[1]);if(match[1]&&match[2])end=Math.min(end,Number(match[2]));if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=stat.size){reply.code(416).header('Content-Range','bytes */'+stat.size);return reply.send();}reply.code(206).header('Content-Range',`bytes ${start}-${end}/${stat.size}`);}
  reply.header('Content-Length',end-start+1);return reply.send(createReadStream(file,{start,end}));
}
server.get('/media/projects/:projectId/:assetId/:hash',async(request,reply)=>{const {projectId,assetId,hash}=params(request);if(!/^[a-z][a-z0-9_-]{0,63}$/.test(assetId)||!/^[a-f0-9]{64}$/.test(hash))throw new AppError(400,'INVALID_MEDIA','مرجع وسائط غير صالح.');const project=await readProject(projectId),asset=project.assets.find(item=>item.id===assetId&&item.sha256===hash&&item.state!=='missing');if(!asset)throw new AppError(404,'MEDIA_NOT_FOUND','ملف الوسائط غير موجود.');return streamFile(request,reply,await verifyAsset(project,asset),asset.mimeType!,true);});
server.get('/api/renders/:id/download',async(request,reply)=>{const job=getJob(params(request).id);if(job.state!=='completed')throw new AppError(409,'RENDER_INCOMPLETE','الفيديو لم يكتمل بعد.');reply.header('Content-Disposition','attachment; filename="'+job.id+'.mp4"');return streamFile(request,reply,path.join(await jobFolder(job),'output.mp4'),'video/mp4');});
server.get('/ui-fonts/:family',async(request,reply)=>{const family=params(request).family;if(!['Cairo.ttf','Inter.ttf'].includes(family))throw new AppError(404,'FONT_NOT_FOUND','خط غير معروف.');const resource=(await loadCatalog()).resources.find(asset=>asset.originalFilename===family)!;const file=await safePath(sharedRoot,resource.storage!.path);return streamFile(request,reply,file,'font/ttf',true);});
const ui=path.join(workspace,'apps/studio/dist');
server.get('/engine/:hash/*',async(request,reply)=>{const {hash}=params(request);let relative:string;try{relative=decodeURIComponent(params(request)['*']);}catch{throw new AppError(400,'INVALID_URL','عنوان غير صالح.');}if(!/^[a-f0-9]{64}$/.test(hash)||!['.html','.js','.map','.ico','.png'].includes(path.extname(relative)))throw new AppError(404,'ENGINE_FILE_NOT_FOUND','ملف محرك غير مسموح.');const base=path.join(stateRoot,'cache/bundles',hash);const file=await safePath(base,relative);const mime:Record<string,string>={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.map':'application/json','.ico':'image/x-icon','.png':'image/png'};return streamFile(request,reply,file,mime[path.extname(file)]);});
server.get('/*',async(request,reply)=>{let relative;try{relative=decodeURIComponent((request.url.split('?')[0]).slice(1))||'index.html';}catch{throw new AppError(400,'INVALID_URL','عنوان غير صالح.');}if(relative!=='index.html'&&!relative.startsWith('assets/'))throw new AppError(404,'NOT_FOUND','المسار غير موجود.');const file=await safePath(ui,relative);try{await fs.access(file);}catch{throw new AppError(404,'NOT_FOUND','الملف غير موجود.');}const extension=path.extname(file);const mime:Record<string,string>={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ttf':'font/ttf'};return streamFile(request,reply,file,mime[extension]??'application/octet-stream');});
let stopping=false;async function stop(){if(stopping)return;stopping=true;await shutdownRenders();await server.close();await fs.unlink(lock).catch(()=>{});}
process.on('SIGINT',()=>{void stop().then(()=>process.exit(0));});process.on('SIGTERM',()=>{void stop().then(()=>process.exit(0));});
try{await server.listen({host:'127.0.0.1',port});console.log('Elmekawy Motion Studio: '+origin);}catch(error){await fs.unlink(lock).catch(()=>{});throw error;}
