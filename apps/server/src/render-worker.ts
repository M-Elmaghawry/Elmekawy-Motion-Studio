import fs from 'node:fs/promises';
import path from 'node:path';
import {renderProjectVideo} from '@elmekawy/motion-engine/server';
import {workspace,stateRoot} from './storage.ts';
import {parseFlexibleProject,compileTimeline} from '@elmekawy/shared/flexible';
const folder=process.argv[2];
if(!folder)throw new Error('Render job folder missing');
const project=JSON.parse(await fs.readFile(path.join(folder,'project.snapshot.json'),'utf8'));
const descriptor=JSON.parse(await fs.readFile(path.join(folder,'descriptor.runtime.json'),'utf8'));
const flexible=project.schemaVersion==='2.0.0'?parseFlexibleProject(project):null;
const renderInput=flexible?{id:flexible.id,revision:flexible.revision,template:flexible.template,video:{width:flexible.outputProfile.width,height:flexible.outputProfile.height,fps:flexible.outputProfile.fps,durationFrames:compileTimeline(flexible.scenes).durationFrames,aspectRatio:flexible.outputProfile.aspectRatio},output:{...flexible.outputProfile,presetId:flexible.outputProfile.id,fileNameLabel:'video'},assets:flexible.assets.map(asset=>({...asset,state:'ready'})),audio:flexible.audio}:project;
let lastState='',lastTime=0;
try{
  const result=await renderProjectVideo({root:workspace,stateRoot,folder,project:renderInput,descriptor,progress:(state,progress)=>{const now=Date.now();if(state!==lastState||now-lastTime>300||progress===1){lastState=state;lastTime=now;process.send?.({kind:'progress',state,progress});}}});
  process.send?.({kind:'completed',...result});
}catch(error){const message=(error as Error).message;await fs.appendFile(path.join(folder,'render.log'),String((error as Error).stack)+'\n');process.send?.({kind:'failed',message});process.exitCode=1;}
