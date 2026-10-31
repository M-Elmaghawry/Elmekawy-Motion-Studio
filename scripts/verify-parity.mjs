import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const requireEngine=createRequire(path.join(root,'packages/motion-engine/package.json'));
const {openBrowser,getCompositions,renderStill}=requireEngine('@remotion/renderer');
const origin='http://127.0.0.1:4311';
const qa=path.join(root,'.studio/qa/parity-'+randomUUID());await fs.mkdir(qa,{recursive:true});
const projects=(await(await fetch(origin+'/api/projects')).json()).projects;
const cases=[
  {template:'bim-personal-intro',composition:'ElmekawyBIMIntro',frames:[0,45,119,120,131,132,269,270,281,282,449,450,461,462,629,630,641,642,779,780,791,792,899]},
  {template:'bim-motion-study',composition:'ElmekawyBIMIntroV2',frames:[0,45,59,60,110,134,135,165,200,224,225,245,285,299,300,345,359]}
];
const browser=await openBrowser('chrome',{browserExecutable:path.join(root,'node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe'),chromeMode:'headless-shell',logLevel:'error'});
const checks=[];
try{
  const legacy=await getCompositions({serveUrl:path.join(root,'elmekawy-bim-reel-V2/build'),inputProps:{},puppeteerInstance:browser,logLevel:'error'});
  for(const item of cases){
    const project=projects.find(project=>project.template.id===item.template&&project.provenance.kind==='legacy-import');
    const jobs=await(await fetch(origin+'/api/projects/'+project.id+'/renders')).json();const job=jobs.find(job=>job.state==='completed'&&!job.legacyImport);
    if(!job)throw new Error('A completed active render is required for '+item.template);
    const folder=path.join(root,'projects',project.id,'renders',job.id);const descriptor=JSON.parse(await fs.readFile(path.join(folder,'descriptor.runtime.json'),'utf8'));
    const manifest=JSON.parse(await fs.readFile(path.join(folder,'render-manifest.json'),'utf8'));const serveUrl=origin+'/engine/'+manifest.engineSourceSha256+'/index.html';
    const current=(await getCompositions({serveUrl,inputProps:descriptor.inputProps,puppeteerInstance:browser,logLevel:'error'})).find(comp=>comp.id===item.composition);
    const original=legacy.find(comp=>comp.id===item.composition);
    for(const frame of item.frames){
      const old=await renderStill({serveUrl:path.join(root,'elmekawy-bim-reel-V2/build'),composition:original,inputProps:{},puppeteerInstance:browser,imageFormat:'png',frame,output:null,logLevel:'error'});
      const next=await renderStill({serveUrl,composition:current,inputProps:descriptor.inputProps,puppeteerInstance:browser,imageFormat:'png',frame,output:null,logLevel:'error'});
      const oldHash=createHash('sha256').update(old.buffer).digest('hex'),newHash=createHash('sha256').update(next.buffer).digest('hex');
      const match=oldHash===newHash;checks.push({composition:item.composition,frame,match,original:oldHash,current:newHash});
      if(!match||[45,110,200,300,345].includes(frame)){await fs.writeFile(path.join(qa,item.composition+'-'+frame+'-original.png'),old.buffer);await fs.writeFile(path.join(qa,item.composition+'-'+frame+'-current.png'),next.buffer);}
      console.log(item.composition+' frame '+frame+': '+(match?'MATCH':'DIFFERENT'));
    }
  }
}finally{await browser.close({silent:true});}
const report={createdAt:new Date().toISOString(),checks,matched:checks.filter(check=>check.match).length,total:checks.length,qaDirectory:qa};await fs.writeFile(path.join(qa,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({matched:report.matched,total:report.total,report:path.join(qa,'report.json')}));if(report.matched!==report.total)process.exitCode=1;
