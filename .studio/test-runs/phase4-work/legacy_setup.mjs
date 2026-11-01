import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
function change(file,old,value){const p=path.join(root,file),text=fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n');if(!text.includes(old))throw Error(file+' missing '+old.slice(0,80));fs.writeFileSync(p,text.replaceAll(old,value));}
change('packages/shared/src/index.ts', 'export type TemplateId=', "import {legacyImageLayoutsSchema,legacySceneImageRoles} from './image-layout.ts';\nimport type {LegacyImageLayouts} from './image-layout.ts';\nexport * from './image-layout.ts';\nexport type TemplateId=");
change('packages/shared/src/index.ts', "TemplateVersion='1.0.0'|'1.1.0'", "TemplateVersion='1.0.0'|'1.1.0'|'1.2.0'");
change('packages/shared/src/index.ts', 'export const templateVersions=[...legacyTemplates,...templates];', "export const imageTemplates:TemplateSpec[]=templates.map(template=>({...template,version:'1.2.0'}));\nexport const templateVersions=[...legacyTemplates,...templates,...imageTemplates];");
change('packages/shared/src/index.ts', 'script:{text:string;notes:string};scenes:Scene[];', 'imageLayouts?:LegacyImageLayouts;script:{text:string;notes:string};scenes:Scene[];');
change('packages/shared/src/index.ts', 'export type EditableProject={name:string;', 'export type EditableProject={imageLayouts?:LegacyImageLayouts;name:string;');
change('packages/shared/src/index.ts', '=>({name:project.name,brief:', "=>({... (project.template.version==='1.2.0'?{imageLayouts:structuredClone(project.imageLayouts??{})}:{}),name:project.name,brief:");
change('packages/shared/src/index.ts', 'templateVersion?:TemplateVersion}', 'templateVersion?:TemplateVersion;imageLayouts?:LegacyImageLayouts;imageKeys?:Record<string,string>}');
change('packages/shared/src/index.ts', "prompts:{type:'array',maxItems:200,items:promptSchema},crf:{type:'integer',minimum:0,maximum:51}\n});", "prompts:{type:'array',maxItems:200,items:promptSchema},crf:{type:'integer',minimum:0,maximum:51},imageLayouts:legacyImageLayoutsSchema\n},['name','brief','script','scenes','prompts','crf']);");
change('packages/shared/src/index.ts', "version:{enum:['1.0.0','1.1.0']}", "version:{enum:['1.0.0','1.1.0','1.2.0']}");
change('packages/shared/src/index.ts', 'script:(editableSchema.properties as Record<string,unknown>).script,', 'imageLayouts:legacyImageLayoutsSchema,script:(editableSchema.properties as Record<string,unknown>).script,');
change('packages/shared/src/index.ts', '  })\n};', "  },['schemaVersion','id','revision','createdAt','updatedAt','name','status','brief','template','video','locale','brand','script','scenes','assets','prompts','references','audio','output','provenance'])\n};");
change('packages/shared/src/index.ts', '  return errors;\n}', `  if(project.template.version!=='1.2.0'&&project.imageLayouts!==undefined)errors.push('Image controls require template 1.2.0');
  if(project.template.version==='1.2.0'&&!project.imageLayouts)errors.push('Missing image layouts');
  for(const [sceneId,layouts] of Object.entries(project.imageLayouts??{}))for(const assetId of Object.keys(layouts)){
    const asset=project.assets.find(item=>item.id===assetId&&item.state!=='retired');
    if(!asset||!legacySceneImageRoles[project.template.id][sceneId]?.includes(asset.role))errors.push('Unknown scene image binding');
  }
  return errors;
}`);
change('packages/shared/src/index.ts', "if(project.template.version==='1.1.0')return", "if(project.template.version!=='1.0.0')return");
change('apps/server/src/storage.ts', 'next.output.crf=value.crf;', "next.output.crf=value.crf;if(project.template.version==='1.2.0')next.imageLayouts=structuredClone(value.imageLayouts??{});else if(value.imageLayouts!==undefined)throw new AppError(422,'LAYOUT_OPT_IN_REQUIRED','فعّل نسخة التحكم بالصور أولًا.');");
change('apps/server/src/storage.ts', 'templateVersion:project.template.version}', "templateVersion:project.template.version,...(project.template.version==='1.2.0'?{imageLayouts:project.imageLayouts,imageKeys:Object.fromEntries(project.assets.map(asset=>[asset.id,asset.mediaKey]))}:{})}");
for(const name of ['bim-personal-intro','bim-motion-study']){
 let text=fs.readFileSync(`packages/templates/src/${name}/1.1.0/Composition.tsx`,'utf8');
 text="import {LegacyImageScope} from '@elmekawy/motion-components/common/LegacyImageLayout.tsx';\n"+text;
 text=text.replace(/from "\.\/(scene-data|data|Scenes|scenes\/[^"]+)"/g,'from "../1.1.0/$1"');
 if(name==='bim-personal-intro')text=text.replace('<TextScope id={scene.id}><Scene assets={assets}/></TextScope>','<TextScope id={scene.id}><LegacyImageScope sceneId={scene.id}><Scene assets={assets}/></LegacyImageScope></TextScope>');
 else text=text.replace(/<TextScope id="([a-z]+)">(.+?)<\/TextScope>/g,'<TextScope id="$1"><LegacyImageScope sceneId="$1">$2</LegacyImageScope></TextScope>');
 const target=`packages/templates/src/${name}/1.2.0/Composition.tsx`;fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,text);
}
fs.appendFileSync('packages/templates/src/index.ts',"\nexport {ElmekawyBIMIntro as ElmekawyBIMIntroImages} from './bim-personal-intro/1.2.0/Composition';\nexport {ElmekawyBIMIntroV2 as ElmekawyBIMIntroV2Images} from './bim-motion-study/1.2.0/Composition';\n");
let text=fs.readFileSync('packages/motion-engine/src/client.tsx','utf8');
text=text.replace('ElmekawyBIMIntroV2Editable}', 'ElmekawyBIMIntroV2Editable,ElmekawyBIMIntroImages,ElmekawyBIMIntroV2Images}');
text="import {LegacyImageLayoutProvider} from '@elmekawy/motion-components/common/LegacyImageLayout.tsx';\n"+text;
text=text.replace("const Video=props.templateVersion==='1.1.0'?ElmekawyBIMIntroEditable:ElmekawyBIMIntro;", "const Video=props.templateVersion==='1.2.0'?ElmekawyBIMIntroImages:props.templateVersion==='1.1.0'?ElmekawyBIMIntroEditable:ElmekawyBIMIntro;");
text=text.replace("const Video=props.templateVersion==='1.1.0'?ElmekawyBIMIntroV2Editable:ElmekawyBIMIntroV2;", "const Video=props.templateVersion==='1.2.0'?ElmekawyBIMIntroV2Images:props.templateVersion==='1.1.0'?ElmekawyBIMIntroV2Editable:ElmekawyBIMIntroV2;");
text=text.replaceAll('<Video assets=', '<LegacyImageLayoutProvider value={{layouts:props.imageLayouts??{},media:props.media,keys:props.imageKeys??{}}}><Video assets=');
text=text.replaceAll("['assets']}/></AbsoluteFill>","['assets']}/></LegacyImageLayoutProvider></AbsoluteFill>");
fs.writeFileSync('packages/motion-engine/src/client.tsx',text);
