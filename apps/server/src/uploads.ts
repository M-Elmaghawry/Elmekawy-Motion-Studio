import fs from 'node:fs/promises';
import {createWriteStream} from 'node:fs';
import path from 'node:path';
import {pipeline} from 'node:stream/promises';
import {randomUUID} from 'node:crypto';
import {openBrowser} from '@remotion/renderer';
import {browserPath} from '@elmekawy/motion-engine/server';
import type {MultipartFile} from '@fastify/multipart';
import type {Asset} from '@elmekawy/shared';
import {AppError,workspace,stateRoot,safePath,hashFile,withLock,readProject,projectFolder,atomicJson,commitProject} from './storage.ts';
const slots={
  'bim-personal-intro':['infrastructure','structural','technology','portrait'],
  'bim-motion-study':['structural','logo','before','after']
};
export async function uploadImage(projectId:string,role:string,revision:number,part:MultipartFile){
  const temp=await safePath(stateRoot,'staging/'+randomUUID()+'.upload');
  try{
    await pipeline(part.file,createWriteStream(temp,{flags:'wx'}));if(part.file.truncated)throw new AppError(413,'FILE_TOO_LARGE','أقصى حجم للصورة 50 ميجابايت.');
    const bytes=await fs.readFile(temp);let mime:string,extension:string;
    if(bytes.length>=24&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))){mime='image/png';extension='.png';}
    else if(bytes.length>=4&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255){mime='image/jpeg';extension='.jpg';}
    else if(bytes.length>=16&&bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP'){mime='image/webp';extension='.webp';}
    else throw new AppError(415,'UNSUPPORTED_IMAGE','ارفع صورة PNG أو JPEG أو WebP صحيحة.');
    const browser=await openBrowser('chrome',{browserExecutable:browserPath(workspace),chromeMode:'headless-shell',logLevel:'error'});
    try{const page=await browser.newPage({context:()=>null,logLevel:'error',indent:false,pageIndex:0,onBrowserLog:null,onLog:()=>{}});const dimensions=await page.evaluate(async(src:string)=>{const image=new Image();await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(new Error('Image cannot be decoded'));image.src=src;});return {width:image.naturalWidth,height:image.naturalHeight};},'data:'+mime+';base64,'+bytes.toString('base64'));
      if(dimensions.width<1||dimensions.height<1||dimensions.width>20000||dimensions.height>20000||dimensions.width*dimensions.height>100000000)throw new AppError(422,'IMAGE_DIMENSIONS','أبعاد الصورة تتجاوز الحد المسموح.');
    }catch(error){if(error instanceof AppError)throw error;throw new AppError(422,'CORRUPT_IMAGE','تعذر فك الصورة. جرّب ملفًا سليمًا.');}finally{await browser.close({silent:true});}
    const sha256=await hashFile(temp);
    return await withLock(projectId,async()=>{const current=await readProject(projectId);if(current.revision!==revision)throw new AppError(412,'STALE_REVISION','المشروع تغير أثناء الرفع؛ أعد تحميل الإصدار.');if(!slots[current.template.id].includes(role))throw new AppError(422,'INVALID_SLOT','هذه الخانة غير مدعومة في القالب.');if(current.assets.reduce((sum,asset)=>sum+(asset.byteSize??0),0)+bytes.length>2*1024**3)throw new AppError(413,'PROJECT_SIZE_LIMIT','حجم وسائط المشروع تجاوز 2 جيجابايت.');
      const assetId='asset-'+randomUUID().replaceAll('-',''),relative='assets/'+(['logo','portrait'].includes(role)?'logos':'images')+'/'+assetId+extension;const folder=await projectFolder(projectId);const destination=await safePath(folder,relative);await fs.rename(temp,destination);
      const previous=current.assets.find(asset=>asset.role===role&&asset.state!=='retired');if(previous?.state==='missing')current.assets=current.assets.filter(asset=>asset!==previous);else if(previous)previous.state='retired';
      const mediaKey=previous?.mediaKey??'';if(!mediaKey)throw new AppError(422,'INVALID_SLOT','لا يوجد ربط وسائط لهذه الخانة.');
      const asset:Asset={id:assetId,role,kind:['logo','portrait'].includes(role)?'logo':'image',mediaKey,displayName:part.filename.slice(0,250),originalFilename:part.filename.slice(0,250),state:'ready',storage:{scope:'project',path:relative},sha256,byteSize:bytes.length,mimeType:mime,license:{status:'unknown'}};
      await atomicJson(await safePath(folder,'history/revision-'+current.revision+'.json'),await readProject(projectId));current.assets.push(asset);if(['logo','portrait'].includes(role))current.brand.logoAssetId=assetId;current.revision++;current.updatedAt=new Date().toISOString();await commitProject(current);return current;
    });
  }finally{await fs.unlink(temp).catch(()=>{});}
}
