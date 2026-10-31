import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import net from 'node:net';
import {spawn} from 'node:child_process';
import {randomUUID,createHash} from 'node:crypto';
import {createInterface} from 'node:readline';
import {fileURLToPath} from 'node:url';
import {setTimeout as pause} from 'node:timers/promises';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const exe=path.join(root,'Elmekawy-Motion-Studio.exe');
const directory=path.join(root,'.studio/test-runs','launcher '+randomUUID()+' مساحة');
await fs.mkdir(directory,{recursive:true});
const reports=[],processes=[];
function run(file,args,options={}){
  const child=spawn(file,args,{cwd:directory,windowsHide:true,stdio:['pipe','pipe','pipe'],...options});
  processes.push(child);const lines=[],waiters=[];let stderr='';
  const reader=createInterface({input:child.stdout});reader.on('line',line=>{try{const value=JSON.parse(line);lines.push(value);for(const notify of [...waiters])notify();}catch{}});
  child.stderr.on('data',data=>{stderr+=data;});
  const completion=new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',code=>resolve(code));});
  completion.catch(()=>{});
  async function message(status){const deadline=Date.now()+35000;while(Date.now()<deadline){const found=lines.find(line=>line.status===status);if(found)return found;const failure=lines.find(line=>line.status==='error');if(failure)throw new Error(failure.message);if(child.exitCode!==null)throw new Error('Launcher exited: '+JSON.stringify({lines,stderr}));await pause(100);}throw new Error('Timed out waiting for '+status+': '+stderr);}
  async function finish(){const code=await Promise.race([completion,pause(20000,undefined,{ref:false}).then(()=>{throw new Error('Child did not exit: '+stderr);})]);return {code,lines,stderr};}
  return{child,completion,message,finish};
}
async function freePort(){const server=net.createServer();await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});const port=server.address().port;await new Promise(resolve=>server.close(resolve));return port;}
const argsFor=(port,dataRoot)=>['--headless','--port='+port,'--data-root='+dataRoot];
async function check(name,action){await action();reports.push({name,passed:true});console.log('PASS: '+name);}
const productionLock=await fs.readFile(path.join(root,'.studio/server.lock'),'utf8').catch(()=>null);
let fake;
try{
  await check('EXE validates the configured runtime without opening a browser',async()=>{
    const result=await run(exe,['--check']).finish();assert.equal(result.code,0,JSON.stringify(result));assert.equal(result.lines[0].status,'ready');assert.equal(path.normalize(result.lines[0].root),root);
  });
  await check('starts hidden server from another working directory, reuses it, and stops only its own process',async()=>{
    const port=await freePort(),dataRoot=path.join(directory,'owned server');const first=run(exe,argsFor(port,dataRoot));const started=await first.message('started');assert.equal(started.owned,true);
    const response=await fetch('http://127.0.0.1:'+port+'/api/health');assert.equal((await response.json()).ok,true);
    const second=await run(exe,argsFor(port,dataRoot)).finish();assert.equal(second.code,0,JSON.stringify(second));assert.equal(second.lines[0].status,'reused');assert.equal(second.lines[0].owned,false);
    assert.equal((await fetch('http://127.0.0.1:'+port+'/')).status,200);
    first.child.stdin.end('stop\n');assert.equal((await first.finish()).code,0);await assert.rejects(()=>fs.access(path.join(dataRoot,'.studio/server.lock')));
    await assert.rejects(()=>fetch('http://127.0.0.1:'+port+'/api/health'));
  });
  await check('reuses an externally started Studio without shutting it down',async()=>{
    const port=await freePort(),dataRoot=path.join(directory,'external server');
    const external=run(process.execPath,[path.join(root,'scripts/launcher-host.mjs')],{env:{...process.env,STUDIO_PORT:String(port),STUDIO_DATA_ROOT:dataRoot}});
    for(let i=0;i<150;i++){try{if((await fetch('http://127.0.0.1:'+port+'/api/health')).ok)break;}catch{}if(external.child.exitCode!==null)throw new Error('Host exited early');await pause(100);}
    const result=await run(exe,argsFor(port,dataRoot)).finish();assert.equal(result.code,0,JSON.stringify(result));assert.equal(result.lines[0].status,'reused');assert.equal((await fetch('http://127.0.0.1:'+port+'/api/health')).status,200);
    external.child.stdin.end('shutdown\n');assert.equal((await external.finish()).code,0);await assert.rejects(()=>fs.access(path.join(dataRoot,'.studio/server.lock')));
  });
  await check('rejects a busy port without stopping the unrelated listener',async()=>{
    fake=http.createServer((_request,response)=>{response.writeHead(200,{'Content-Type':'application/json'});response.end('{"ok":true,"mode":"another-app"}');});
    await new Promise(resolve=>fake.listen(0,'127.0.0.1',resolve));const port=fake.address().port;
    const result=await run(exe,argsFor(port,path.join(directory,'conflict'))).finish();assert.equal(result.code,1);assert.equal(result.lines[0].status,'error');assert.match(result.lines[0].message,/مستخدم/);assert.equal((await fetch('http://127.0.0.1:'+port)).status,200);
    await new Promise(resolve=>fake.close(resolve));fake=null;
  });
  await check('closing the launcher control pipe gracefully stops the private server host',async()=>{
    const port=await freePort(),dataRoot=path.join(directory,'closed pipe');
    const owned=run(exe,argsFor(port,dataRoot));await owned.message('started');owned.child.stdin.end();assert.equal((await owned.finish()).code,0);await assert.rejects(()=>fs.access(path.join(dataRoot,'.studio/server.lock')));
  });
  assert.equal(await fs.readFile(path.join(root,'.studio/server.lock'),'utf8').catch(()=>null),productionLock,'Production server ownership changed');
  const binary=await fs.readFile(exe);const report={createdAt:new Date().toISOString(),binaryBytes:binary.length,sha256:createHash('sha256').update(binary).digest('hex'),checks:reports,browserOpened:false,productionStoreChanged:false};
  const output=path.join(root,'.studio/qa/launcher-report.json');await fs.writeFile(output,JSON.stringify(report,null,2));console.log(JSON.stringify({passed:reports.length,total:reports.length,bytes:binary.length,report:output}));
}finally{
  if(fake)await new Promise(resolve=>fake.close(resolve));
  for(const child of processes){if(child.exitCode===null&&!child.stdin.destroyed)child.stdin.end('shutdown\n');}
}
