import fs from 'node:fs';
const manifest='packages/shared/src/flexible/manifest.ts',schema='packages/shared/src/flexible/schema.ts';
fs.copyFileSync(manifest,'packages/shared/src/flexible/manifest-v2.ts');
let old=fs.readFileSync(schema,'utf8').replace("'./manifest.ts'","'./manifest-v2.ts'");
// Keep the original format validator independent of the new scene registry.
fs.writeFileSync('packages/shared/src/flexible/schema-v2.ts',old);
let m=fs.readFileSync(manifest,'utf8');
m=m.replace('SceneRegistry, TemplateManifest','SceneRegistry, SupportedSceneType, TemplateManifest');
m=m.replace('export const sceneRegistry: SceneRegistry = {','export const sceneRegistry: SceneRegistry & Record<Exclude<SupportedSceneType,keyof SceneRegistry>, {type: SupportedSceneType;version:"1.0.0";contentSchemaId:string;motionPresetIds:["pan"]|["step-reveal"];mediaSlots:{name:"image"|"before"|"after";kinds:["image"]|["image","video"];required:boolean}[]}> = {');
m=m.replace("export const flexibleManifest: TemplateManifest = {",`Object.assign(sceneRegistry, {});
export const squareProfile: OutputProfile = {...portraitProfile,id:'square-1080p30-h264-v1',width:1080,height:1080,aspectRatio:'1:1'};
export const landscapeProfile: OutputProfile = {...portraitProfile,id:'landscape-1080p30-h264-v1',width:1920,height:1080,aspectRatio:'16:9'};
export const outputProfiles=[portraitProfile,squareProfile,landscapeProfile];
export const flexibleManifest: TemplateManifest = {`);
m=m.replace("  'kinetic-title': {",`  'ui-demo': {type:'ui-demo',version:'1.0.0',contentSchemaId:'urn:elmekawy:ui-demo:1.0.0',motionPresetIds:['pan'],mediaSlots:[{name:'image',kinds:['image'],required:true}]},
  'product-hero': {type:'product-hero',version:'1.0.0',contentSchemaId:'urn:elmekawy:product-hero:1.0.0',motionPresetIds:['pan'],mediaSlots:[{name:'image',kinds:['image'],required:true}]},
  'before-after': {type:'before-after',version:'1.0.0',contentSchemaId:'urn:elmekawy:before-after:1.0.0',motionPresetIds:['pan'],mediaSlots:[{name:'before',kinds:['image'],required:true},{name:'after',kinds:['image'],required:true}]},
  'data-explainer': {type:'data-explainer',version:'1.0.0',contentSchemaId:'urn:elmekawy:data-explainer:1.0.0',motionPresetIds:['step-reveal'],mediaSlots:[]},
  'kinetic-title': {`);
// Media showcase accepts video in 1.1.0; old format keeps its own frozen registry.
m=m.replace("  version: '1.0.0',\n  projectSchemaVersion: '2.0.0',","  version: '1.1.0',\n  projectSchemaVersion: '2.1.0',");
m=m.replace('outputProfiles: [portraitProfile]','outputProfiles');
m=m.replace('supportedSceneTypes: Object.keys(sceneRegistry) as (keyof SceneRegistry)[]','supportedSceneTypes: Object.keys(sceneRegistry) as SupportedSceneType[]');
fs.writeFileSync(manifest,m);
