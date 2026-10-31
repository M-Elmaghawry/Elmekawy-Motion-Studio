import fs from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderMedia} from '@remotion/renderer';
import type {Descriptor,Project,RenderState} from '@elmekawy/shared';
const run=promisify(execFile);
const hash=async(file:string)=>{const digest=createHash('sha256');for await(const chunk of createReadStream(file))digest.update(chunk);return digest.digest('hex');};
export const browserPath=(root:string)=>path.join(root,'node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe');
export async function sourceFingerprint(root:string){
  const files:string[]=[];async function walk(dir:string){for(const entry of(await fs.readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name,'en'))){if(['node_modules','dist','.cache'].includes(entry.name))continue;const file=path.join(dir,entry.name);if(entry.isSymbolicLink())throw new Error('Source links are not supported in release snapshots');if(entry.isDirectory())await walk(file);else if(entry.isFile())files.push(file);}}
  await walk(path.join(root,'packages'));files.push(path.join(root,'package.json'),path.join(root,'package-lock.json'));
  const digest=createHash('sha256');const records=[];
  for(const file of files){const relative=path.relative(root,file).replaceAll('\\','/'),sha256=await hash(file);records.push({path:relative,sha256});digest.update(relative+'\0'+sha256+'\n');}
  return {sha256:digest.digest('hex'),files:records};
}
export async function renderProjectVideo(options:{root:string;stateRoot:string;folder:string;project:Project;descriptor:Descriptor;progress:(state:RenderState,progress:number)=>void}){
  const {root,stateRoot,folder,project,descriptor,progress}=options;
  const executable=browserPath(root);await fs.access(executable);
  progress('bundling',0);const source=await sourceFingerprint(root),release=path.join(stateRoot,'releases',source.sha256);await fs.mkdir(release,{recursive:true});
  for(const record of source.files){const target=path.join(release,record.path);await fs.mkdir(path.dirname(target),{recursive:true});try{await fs.copyFile(path.join(root,record.path),target,fs.constants.COPYFILE_EXCL);}catch(error){if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;}}
  const cache=path.join(stateRoot,'cache/bundles',source.sha256);
  try{await fs.access(path.join(cache,'READY'));await fs.access(path.join(cache,'index.html'));}catch{
    await bundle({entryPoint:path.join(root,'packages/motion-engine/src/index.ts'),outDir:cache,rootDir:root,publicDir:null,rspack:true,enableCaching:false,askAIEnabled:false,interactivityEnabled:false});
    await fs.writeFile(path.join(cache,'READY'),source.sha256);
  }
  const serveUrl=new URL('/engine/'+source.sha256+'/index.html',new URL(descriptor.inputProps.media['fonts/Cairo.ttf']).origin).toString();
  const browser=await openBrowser('chrome',{browserExecutable:executable,chromeMode:'headless-shell',logLevel:'error'});
  const partial=path.join(folder,'output.partial.mp4'),output=path.join(folder,'output.mp4');
  try{
    progress('resolving',0);const composition=await selectComposition({serveUrl,id:descriptor.compositionId,inputProps:descriptor.inputProps,puppeteerInstance:browser,logLevel:'error'});
    if(composition.width!==project.video.width||composition.height!==project.video.height||composition.fps!==project.video.fps||composition.durationInFrames!==project.video.durationFrames)throw new Error('Composition metadata differs from the saved project');
    await renderMedia({serveUrl,composition,inputProps:descriptor.inputProps,codec:'h264',pixelFormat:'yuv420p',crf:project.output.crf,imageFormat:'jpeg',outputLocation:partial,overwrite:false,concurrency:2,puppeteerInstance:browser,logLevel:'error',onBrowserDownload:()=>{throw new Error('Unexpected browser download is disabled');},onProgress:({progress:percent})=>progress('rendering',percent)});
    progress('verifying',1);
    const probeExecutable=path.join(root,'node_modules/@remotion/compositor-win32-x64-msvc/ffprobe.exe');
    const {stdout}=await run(probeExecutable,['-v','error','-show_entries','stream=codec_type,codec_name,width,height,pix_fmt,r_frame_rate,nb_frames,duration:format=duration,size','-of','json',partial],{windowsHide:true,maxBuffer:1024*1024});
    const probe=JSON.parse(stdout),video=probe.streams.find((stream:{codec_type:string})=>stream.codec_type==='video');
    const audio=probe.streams.some((stream:{codec_type:string})=>stream.codec_type==='audio');
    if(!video||video.codec_name!=='h264'||video.width!==project.video.width||video.height!==project.video.height||Number(video.nb_frames)!==project.video.durationFrames||audio!==(project.audio.mode==='track'))throw new Error('Encoded output did not pass metadata/audio validation');
    await fs.writeFile(path.join(folder,'probe.json'),JSON.stringify(probe,null,2));
    const runtime=await run(executable,['--version'],{windowsHide:true,maxBuffer:1024*1024}).then(result=>result.stdout.trim()).catch(()=> 'installed-local-runtime');
    await fs.rename(partial,output);const sha256=await hash(output),size=(await fs.stat(output)).size;
    const manifest={schemaVersion:'1.0.0',projectId:project.id,projectRevision:project.revision,template:project.template,compositionId:descriptor.compositionId,engineSourceSha256:source.sha256,rootLockSha256:await hash(path.join(root,'package-lock.json')),resources:project.assets.filter(asset=>asset.state==='ready').map(asset=>({id:asset.id,sha256:asset.sha256,byteSize:asset.byteSize})),effectiveSettings:{...project.video,...project.output,imageFormat:'jpeg',concurrency:2},environment:{node:process.version,platform:process.platform,architecture:process.arch,browser:runtime,remotion:'4.0.539'},warnings:descriptor.warnings,output:{file:'output.mp4',sha256,bytes:size},completedAt:new Date().toISOString()};
    await fs.writeFile(path.join(folder,'render-manifest.json'),JSON.stringify(manifest,null,2));return {sha256,size};
  }finally{await browser.close({silent:true});}
}
