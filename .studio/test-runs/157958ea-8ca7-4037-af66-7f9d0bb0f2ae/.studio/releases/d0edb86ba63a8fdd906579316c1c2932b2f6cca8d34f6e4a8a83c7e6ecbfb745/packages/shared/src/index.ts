export type TemplateId='bim-personal-intro'|'bim-motion-study';
import {textCatalog} from './text-fields.ts';
import type {TextFieldSpec} from './text-fields.ts';
export type {TextFieldSpec} from './text-fields.ts';
export type TemplateVersion='1.0.0'|'1.1.0';
export const legacyAssetPaths={infrastructure:'assets/generated/bim-infrastructure.png',structural:'assets/generated/structural-bim.png',technology:'assets/generated/bim-technology.png',portrait:'assets/logos/ME-Logo.png'} as const;
export type LegacyAssetKey=keyof typeof legacyAssetPaths;
export type SceneSpec={id:string;name:string;from:number;duration:number;fields:string[];textFields?:TextFieldSpec[]};
export type TemplateSpec={id:TemplateId;version:TemplateVersion;name:string;compositionId:string;width:number;height:number;fps:number;durationFrames:number;scenes:SceneSpec[]};
export const legacyTemplates:TemplateSpec[]=[
  {id:'bim-personal-intro',version:'1.0.0',name:'BIM Personal Intro · V1',compositionId:'ElmekawyBIMIntro',width:1080,height:1920,fps:30,durationFrames:900,scenes:[
    {id:'hook',name:'BIM مش مجرد موديل 3D',from:0,duration:120,fields:['مش مجرد']},
    {id:'infrastructure',name:'المنشآت والبنية التحتية',from:120,duration:150,fields:['One coordinated vision.']},
    {id:'services',name:'خدمات BIM',from:270,duration:180,fields:['Precision.','At every stage.']},
    {id:'training',name:'Revit & BIM Training',from:450,duration:180,fields:['Build skills.','Work with confidence.']},
    {id:'brand',name:'Mahmoud Elmekawy',from:630,duration:150,fields:['Mahmoud','Elmekawy.']},
    {id:'cta',name:'Learn · Build · Coordinate',from:780,duration:120,fields:['Learn','Build','Coordinate']}]},
  {id:'bim-motion-study',version:'1.0.0',name:'BIM Motion Study · V2',compositionId:'ElmekawyBIMIntroV2',width:1080,height:1920,fps:30,durationFrames:360,scenes:[
    {id:'hook',name:'الموديل مش هو الـ BIM',from:0,duration:60,fields:['الموديل','مش هو الـ','BIM']},
    {id:'network',name:'شبكة تنسيق مترابطة',from:60,duration:75,fields:['من موديل','لشبكة تنسيق']},
    {id:'comparison',name:'قبل / بعد · مثال توضيحي',from:135,duration:90,fields:['نشوف التعارض','ونراجع المسار']},
    {id:'workflow',name:'من النمذجة إلى التسليم',from:225,duration:75,fields:['كل خطوة متصلة']},
    {id:'cta',name:'Elmekawy BIM · تواصل',from:300,duration:60,fields:['نربط التفاصيل','ونبني الصورة الكاملة']}]}];
export const templates:TemplateSpec[]=legacyTemplates.map(template=>({...template,version:'1.1.0',scenes:template.scenes.map(scene=>({...scene,textFields:textCatalog[template.id][scene.id],fields:textCatalog[template.id][scene.id].map(field=>field.id)}))}));
export const templateVersions=[...legacyTemplates,...templates];
export const templateFor=(id:string,version:TemplateVersion='1.1.0')=>{const template=templateVersions.find(item=>item.id===id&&item.version===version);if(!template)throw new Error('Unknown template');return template;};
export const defaultSceneContent=(scene:SceneSpec)=>Object.fromEntries(scene.fields.map(key=>[key,scene.textFields?.find(field=>field.id===key)?.defaultValue??key]));
export type Asset={id:string;kind:'image'|'logo'|'audio'|'font';role:string;mediaKey:string;displayName:string;state:'ready'|'missing'|'retired';storage?:{scope:'project'|'shared';path:string};sha256?:string;byteSize?:number;mimeType?:string;originalFilename?:string;reason?:string;license:{status:'unknown'|'documented';note?:string}};
export type Scene={id:string;type:string;name:string;description:string;startFrame:number;durationFrames:number;outgoingExtensionFrames:number;content:Record<string,string>;assetBindings:Record<string,string>;promptIds:string[]};
export type Prompt={id:string;title:string;text:string;negativeConstraints:string;sceneIds:string[];status:'draft'|'ready-to-copy'|'uploaded'|'approved'};
export type Project={
  schemaVersion:'1.0.0';id:string;revision:number;createdAt:string;updatedAt:string;name:string;status:'draft'|'ready';
  brief:{client:string;description:string;objective:string;category:string;audience:string;platforms:string[]};
  template:{id:TemplateId;version:TemplateVersion};video:{width:number;height:number;fps:number;durationFrames:number;aspectRatio:'9:16'};
  locale:{language:string;direction:'rtl'|'ltr'};brand:{preset:{id:string;version:string}|null;displayName:string;colors:Record<string,string>;fonts:{arabic:{family:string;assetId:string;weightMin:number;weightMax:number};latin:{family:string;assetId:string;weightMin:number;weightMax:number}};logoAssetId:string;safeArea:{left:number;right:number;top:number;bottom:number}};
  script:{text:string;notes:string};scenes:Scene[];assets:Asset[];prompts:Prompt[];references:string[];
  audio:{mode:'none'}|{mode:'track';assetId:string;volume:number};
  output:{container:'mp4';codec:'h264';pixelFormat:'yuv420p';crf:number;presetId:'mp4-h264-v1';fileNameLabel:string};
  provenance:{kind:'legacy-import'|'created'|'duplicate';source?:string};
};
export type EditableProject={name:string;brief:Project['brief'];script:Project['script'];scenes:{id:string;description:string;content:Record<string,string>}[];prompts:Prompt[];crf:number};
export const editableOf=(project:Project):EditableProject=>({name:project.name,brief:structuredClone(project.brief),script:structuredClone(project.script),scenes:project.scenes.map(({id,description,content})=>({id,description,content:{...content}})),prompts:structuredClone(project.prompts),crf:project.output.crf});
export type RuntimeProps={assets:Record<string,boolean>;media:Record<string,string>;edits:Record<string,string>;templateVersion?:TemplateVersion};
export type Descriptor={projectRevision:number;template:Project['template'];compositionId:string;metadata:Project['video'];inputProps:RuntimeProps;warnings:string[]};
export type RenderState='queued'|'bundling'|'resolving'|'rendering'|'verifying'|'completed'|'failed'|'cancelled'|'interrupted';
export type RenderJob={id:string;projectId:string;projectRevision:number;projectName:string;state:RenderState;progress:number;createdAt:string;updatedAt:string;error?:string;outputBytes?:number;outputSha256?:string;downloadUrl?:string;legacyImport?:boolean};
export const projectIdPattern='^[a-z0-9]+(?:-[a-z0-9]+)*--[a-f0-9]{32}$';
const text=(maxLength=10000)=>({type:'string',maxLength});
const strictObject=(properties:Record<string,unknown>,required=Object.keys(properties))=>({type:'object',additionalProperties:false,required,properties});
const contentSchema={type:'object',maxProperties:100,additionalProperties:text(200),propertyNames:{maxLength:200}};
const fontSchema=strictObject({family:text(64),assetId:text(64),weightMin:{type:'integer',minimum:1,maximum:1000},weightMax:{type:'integer',minimum:1,maximum:1000}});
export const promptSchema=strictObject({id:{type:'string',pattern:'^[a-z][a-z0-9_-]{0,63}$'},title:text(200),text:text(20000),negativeConstraints:text(5000),sceneIds:{type:'array',maxItems:100,items:text(64)},status:{enum:['draft','ready-to-copy','uploaded','approved']}});
export const editableSchema=strictObject({
  name:{type:'string',minLength:1,maxLength:120},brief:strictObject({client:text(120),description:text(),objective:text(),category:text(64),audience:text(1000),platforms:{type:'array',maxItems:10,items:text(64)}}),
  script:strictObject({text:text(50000),notes:text(10000)}),scenes:{type:'array',maxItems:100,items:strictObject({id:text(64),description:text(5000),content:contentSchema})},
  prompts:{type:'array',maxItems:200,items:promptSchema},crf:{type:'integer',minimum:0,maximum:51}
});
export const projectSchema={
  $schema:'http://json-schema.org/draft-07/schema#',$id:'urn:elmekawy:project:1.0.0',...strictObject({
    schemaVersion:{const:'1.0.0'},id:{type:'string',maxLength:82,pattern:projectIdPattern},revision:{type:'integer',minimum:1},createdAt:text(40),updatedAt:text(40),name:{type:'string',minLength:1,maxLength:120},status:{enum:['draft','ready']},
    brief:(editableSchema.properties as Record<string,unknown>).brief,
    template:strictObject({id:{enum:templates.map(t=>t.id)},version:{enum:['1.0.0','1.1.0']}}),video:strictObject({width:{const:1080},height:{const:1920},fps:{const:30},durationFrames:{enum:[360,900]},aspectRatio:{const:'9:16'}}),
    locale:strictObject({language:text(32),direction:{enum:['rtl','ltr']}}),
    brand:strictObject({preset:{oneOf:[{type:'null'},strictObject({id:text(64),version:text(32)})]},displayName:text(120),colors:{type:'object',minProperties:7,maxProperties:7,additionalProperties:{type:'string',pattern:'^#[0-9a-fA-F]{6}$'}},fonts:strictObject({arabic:fontSchema,latin:fontSchema}),logoAssetId:text(64),safeArea:strictObject({left:{const:100},right:{const:180},top:{const:220},bottom:{const:360}})}),
    script:(editableSchema.properties as Record<string,unknown>).script,
    scenes:{type:'array',minItems:5,maxItems:6,items:strictObject({id:text(64),type:text(120),name:text(120),description:text(5000),startFrame:{type:'integer',minimum:0},durationFrames:{type:'integer',minimum:1},outgoingExtensionFrames:{enum:[0,12]},content:contentSchema,assetBindings:{type:'object',additionalProperties:text(64)},promptIds:{type:'array',items:text(64)}})},
    assets:{type:'array',maxItems:500,items:strictObject({id:{type:'string',pattern:'^[a-z][a-z0-9_-]{0,63}$'},kind:{enum:['image','logo','audio','font']},role:text(64),mediaKey:text(250),displayName:text(250),state:{enum:['ready','missing','retired']},storage:strictObject({scope:{enum:['project','shared']},path:text(250)}),sha256:{type:'string',pattern:'^[a-f0-9]{64}$'},byteSize:{type:'integer',minimum:1},mimeType:text(100),originalFilename:text(250),reason:text(1000),license:strictObject({status:{enum:['unknown','documented']},note:text(1000)},['status'])},['id','kind','role','mediaKey','displayName','state','license'])},
    prompts:{type:'array',maxItems:200,items:promptSchema},references:{type:'array',maxItems:100,items:text(2000)},
    audio:{oneOf:[strictObject({mode:{const:'none'}}),strictObject({mode:{const:'track'},assetId:text(64),volume:{type:'number',minimum:0,maximum:1}})]},
    output:strictObject({container:{const:'mp4'},codec:{const:'h264'},pixelFormat:{const:'yuv420p'},crf:{type:'integer',minimum:0,maximum:51},presetId:{const:'mp4-h264-v1'},fileNameLabel:text(120)}),provenance:strictObject({kind:{enum:['legacy-import','created','duplicate']},source:text(250)},['kind'])
  })
};
export function semanticErrors(project:Project):string[]{
  const errors:string[]=[];const template=templateFor(project.template.id,project.template.version);
  if(project.video.durationFrames!==template.durationFrames||project.scenes.length!==template.scenes.length)errors.push('مدة المشروع أو عدد المشاهد لا يتطابق مع القالب.');
  for(const [i,spec] of template.scenes.entries()){
    const scene=project.scenes[i];if(!scene||scene.id!==spec.id||scene.startFrame!==spec.from||scene.durationFrames!==spec.duration||scene.outgoingExtensionFrames!==(template.id==='bim-personal-intro'&&i<5?12:0))errors.push('توقيت المشهد أو ترتيبه غير متوافق مع القالب.');
    if(scene&&(Object.keys(scene.content).some(key=>!spec.fields.includes(key))||spec.fields.some(key=>typeof scene.content[key]!=='string')))errors.push('حقول نصية غير معروفة أو ناقصة في المشهد.');
  }
  const ids=new Set<string>(),roles=new Set<string>();for(const asset of project.assets){if(ids.has(asset.id))errors.push('معرّف وسائط مكرر.');ids.add(asset.id);if(asset.state!=='retired'){if(roles.has(asset.role))errors.push('دور وسائط مكرر.');roles.add(asset.role);}if(asset.state!=='missing'&&(!asset.storage||!asset.sha256||!asset.byteSize||!asset.mimeType))errors.push('بيانات ملف الوسائط غير مكتملة.');if(asset.state==='missing'&&(asset.storage||asset.sha256))errors.push('لا يمكن إرفاق مسار بملف مفقود.');}
  if(new Set(project.prompts.map(p=>p.id)).size!==project.prompts.length)errors.push('معرّف Prompt مكرر.');
  if(project.audio.mode==='track'&&!ids.has(project.audio.assetId))errors.push('ملف الصوت غير موجود.');
  if(!ids.has(project.brand.logoAssetId)||!ids.has(project.brand.fonts.arabic.assetId)||!ids.has(project.brand.fonts.latin.assetId))errors.push('مرجع شعار أو خط غير صالح.');
  return errors;
}
export function upgradeTextEditing(project:Project):Project{
  if(project.template.version==='1.1.0')return structuredClone(project);
  const template=templateFor(project.template.id,'1.1.0'),next=structuredClone(project);
  next.template.version='1.1.0';
  next.scenes=next.scenes.map((scene,i)=>({...scene,content:Object.fromEntries(template.scenes[i].textFields!.map(field=>[field.id,field.legacySource&&Object.hasOwn(scene.content,field.legacySource)?scene.content[field.legacySource]:field.defaultValue]))}));
  return next;
}
