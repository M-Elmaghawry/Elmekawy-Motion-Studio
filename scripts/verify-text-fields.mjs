import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createHash,randomUUID} from 'node:crypto';
import {templates,defaultSceneContent} from '../packages/shared/src/index.ts';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const requireEngine=createRequire(path.join(root,'packages/motion-engine/package.json'));
const {openBrowser,getCompositions,renderStill}=requireEngine('@remotion/renderer');
const origin='http://127.0.0.1:4311';const qa=path.join(root,'.studio/qa/text-fields-'+randomUUID());await fs.mkdir(qa,{recursive:true});
const projects=(await(await fetch(origin+'/api/projects')).json()).projects;
const browser=await openBrowser('chrome',{browserExecutable:path.join(root,'node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe'),chromeMode:'headless-shell',logLevel:'error'});
const checks=[],cache=new Map();
const digest=buffer=>createHash('sha256').update(buffer).digest('hex');
const frames={
  'bim-personal-intro':{hook:80,infrastructure:200,services:420,training:560,brand:710,cta:870},
  'bim-motion-study':{hook:55,network:125,comparison:200,workflow:295,cta:350}
};
try{
  for(const template of templates){
    const project=projects.find(project=>project.template.id===template.id&&project.provenance.kind==='legacy-import');
    const jobs=await(await fetch(origin+'/api/projects/'+project.id+'/renders')).json();const job=jobs.find(job=>job.state==='completed'&&!job.legacyImport&&job.projectRevision===project.revision);
    if(!job)throw new Error('Wait for the current baseline render: '+template.id);
    const folder=path.join(root,'projects',project.id,'renders',job.id);const descriptor=JSON.parse(await fs.readFile(path.join(folder,'descriptor.runtime.json'),'utf8'));const manifest=JSON.parse(await fs.readFile(path.join(folder,'render-manifest.json'),'utf8'));
    const serveUrl=origin+'/engine/'+manifest.engineSourceSha256+'/index.html';
    const input={...descriptor.inputProps,templateVersion:'1.1.0',edits:Object.assign({},...template.scenes.map(defaultSceneContent))};
    const composition=(await getCompositions({serveUrl,inputProps:input,puppeteerInstance:browser,logLevel:'error'})).find(item=>item.id===template.compositionId);
    const capture=async(frame,runtime)=>{const result=await renderStill({serveUrl,composition:{...composition,props:runtime},inputProps:runtime,frame,imageFormat:'png',output:null,puppeteerInstance:browser,logLevel:'error'});return result.buffer;};
    for(const scene of template.scenes){
      for(const field of scene.textFields){
        let frame=frames[template.id][scene.id];let assets={...input.assets};
        if(field.group==='fallback'){
          if(template.id==='bim-personal-intro'){if(scene.id==='services')assets={...assets,structural:false,technology:false};else assets[scene.id==='brand'?'portrait':'infrastructure']=false;}
          else if(scene.id==='network')assets.structural=false;else if(scene.id==='cta')assets.logo=false;else{assets.before=false;assets.after=false;if(field.id.endsWith('.before'))frame=140;}
        }
        const baseline={...input,assets};const key=template.id+'|'+frame+'|'+JSON.stringify(assets);if(!cache.has(key))cache.set(key,await capture(frame,baseline));
        const original=cache.get(key);const changed=await capture(frame,{...baseline,edits:{...input.edits,[field.id]:'EDIT'}});const changedPixels=digest(changed)!==digest(original);checks.push({template:template.id,field:field.id,frame,changedPixels});
        if(!changedPixels||field.id==='infrastructure.title2'){await fs.writeFile(path.join(qa,template.id+'-'+field.id+'-baseline.png'),original);await fs.writeFile(path.join(qa,template.id+'-'+field.id+'-edited.png'),changed);}
        if(!changedPixels)console.log('NO PIXEL CHANGE: '+field.id);
      }
      console.log(template.id+' '+scene.id+': '+scene.textFields.length+' fields checked');
    }
    if(template.id==='bim-personal-intro'){
      const frame=200,base=await capture(frame,input),otherSceneEdit=await capture(frame,{...input,edits:{...input.edits,'hook.bim':'UNRELATED'}});checks.push({template:template.id,field:'repeated-word-isolation',frame,changedPixels:digest(base)===digest(otherSceneEdit)});
      if(digest(base)!==digest(otherSceneEdit))console.log('UNRELATED SCENE CHANGED');
    }
  }
}finally{await browser.close({silent:true});}
const failures=checks.filter(check=>!check.changedPixels);const report={createdAt:new Date().toISOString(),checks,passed:checks.length-failures.length,total:checks.length,failures};await fs.writeFile(path.join(qa,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,total:report.total,report:path.join(qa,'report.json')}));if(failures.length)process.exitCode=1;
