import fs from 'node:fs';
const file='packages/shared/src/flexible/editor.ts';let t=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
const change=(a,b)=>{if(!t.includes(a))throw Error(a);t=t.replaceAll(a,b);};
change("import { flexibleProjectSchema, FlexibleValidationError }", "import { flexibleProjectSchema, FlexibleValidationError, audioTimelineSchema, promptsSchema }");
change("import { sceneRegistry }", "import { sceneRegistry, outputProfiles, portraitProfile }");
change('FlexibleScene, ImplementedType, MediaBinding','FlexibleScene, SupportedSceneType as ImplementedType, MediaBinding');
change("  'kinetic-title': 'عنوان متحرك',", "  'ui-demo': 'واجهة تطبيق وموبايل',\n  'product-hero': 'عرض منتج',\n  'before-after': 'قبل وبعد',\n  'data-explainer': 'شرح بيانات',\n  'kinetic-title': 'عنوان متحرك',");
change('crf: number };', "crf: number; outputProfileId?: string; audio?: FlexibleProject['audio']; prompts?: FlexibleProject['prompts'] };");
change('export type FlexibleCreate = {', 'export type FlexibleCreate = {\n  outputProfileId?: string;');
change('const strict = (props: Record<string, unknown>) => ({','const strict = (props: Record<string, unknown>, required = Object.keys(props)) => ({');
change('required: Object.keys(props),','required,');
change("  crf: { type: 'integer', minimum: 0, maximum: 51 },\n});", "  crf: { type: 'integer', minimum: 0, maximum: 51 },\n  outputProfileId: {enum:outputProfiles.map(profile=>profile.id)},\n  audio: {oneOf:[{type:'object',additionalProperties:false,required:['mode'],properties:{mode:{const:'none'}}},audioTimelineSchema]},\n  prompts: promptsSchema,\n},['name','brief','scenes','targetDurationFrames','brand','crf']);");
// The create DTO has its own optional profile field, without audio/prompt ownership.
const start=t.indexOf('export const flexibleCreateSchema');const end=t.indexOf('const ajv =',start);
let create=t.slice(start,end).replace(/  audio: \{oneOf:.*\n  prompts: promptsSchema,\n/,'').replace("['name','brief','scenes','targetDurationFrames','brand','crf']","['name','client','objective','brandProfileId','displayName','colors','durationFrames','sceneTypes','libraryImageId','approveImage','crf']");
t=t.slice(0,start)+create+t.slice(end);
change('    name: project.name,',"    ...(project.schemaVersion==='2.1.0'?{outputProfileId:project.outputProfile.id,audio:structuredClone(project.audio),prompts:structuredClone(project.prompts??[])}:{}),\n    name: project.name,");
change('  return {\n    ...structuredClone(project),', "  if(project.schemaVersion==='2.0.0'&&(value.outputProfileId!==undefined||value.audio!==undefined||value.prompts!==undefined))throw new FlexibleValidationError(['FEATURE_UPGRADE_REQUIRED']);\n  const profile=value.outputProfileId?outputProfiles.find(profile=>profile.id===value.outputProfileId)!:project.outputProfile;\n  return {\n    ...structuredClone(project),\n    ...(project.schemaVersion==='2.1.0'?{audio:structuredClone(value.audio??project.audio),prompts:structuredClone(value.prompts??project.prompts??[])}:{}),");
change('brand: { ...structuredClone(project.brand), ...structuredClone(value.brand) },','brand: { ...structuredClone(project.brand), ...structuredClone(value.brand),...(profile.id!==project.outputProfile.id?{safeArea:safeAreaFor(profile.aspectRatio)}:{}) },');
change('outputProfile: { ...project.outputProfile, crf: value.crf }','outputProfile: { ...profile, crf: value.crf }');
change("    case 'media-showcase':",`    case 'ui-demo':
      if(!image)throw Error('MISSING_IMAGE');return {...base,type,content:{headline:'تجربة واضحة',appName:'اسم التطبيق',caption:'شرح الخطوات',actions:['افتح','اختر','ابدأ']},mediaBindings:[defaultBinding(image.id,image.sha256)]};
    case 'product-hero':
      if(!image)throw Error('MISSING_IMAGE');return {...base,type,content:{headline:'منتجك في المقدمة',tagline:'التفاصيل تصنع الفرق',badge:'جديد'},mediaBindings:[defaultBinding(image.id,image.sha256)]};
    case 'before-after':
      if(!image)throw Error('MISSING_IMAGE');return {...base,type,content:{headline:'شاهد الفرق',beforeLabel:'قبل',afterLabel:'بعد'},mediaBindings:[{...defaultBinding(image.id,image.sha256),slot:'before'},{...defaultBinding(image.id,image.sha256),slot:'after'}]};
    case 'data-explainer':
      return {...base,type,content:{headline:'الصورة في الأرقام',unit:'%',points:[{id:'point-1',label:'الأولى',value:40},{id:'point-2',label:'الثانية',value:70},{id:'point-3',label:'الثالثة',value:90}]}};
    case 'media-showcase':`);
t+=`\nexport function safeAreaFor(aspect: string){return aspect==='9:16'?{left:100,right:180,top:220,bottom:360}:{left:70,right:100,top:100,bottom:140};}
export function upgradeFlexibleDocument(project:FlexibleProject):FlexibleProject{return project.schemaVersion==='2.1.0'?structuredClone(project):{...structuredClone(project),schemaVersion:'2.1.0',template:{id:'flexible-reel',version:'1.1.0'},prompts:[]};}
`;
fs.writeFileSync(file,t);
