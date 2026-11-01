from pathlib import Path
import re
root=Path('D:/zz-CODING/Elmekawy-Motion-Studio')
def change(path, old, new):
    p=root/path
    t=p.read_text(encoding='utf-8-sig')
    assert old in t, (path,old[:90])
    p.write_text(t.replace(old,new),encoding='utf-8')
change('packages/shared/src/index.ts', "export type TemplateId=", "import {legacyImageLayoutsSchema,legacySceneImageRoles} from './image-layout.ts';\nimport type {LegacyImageLayouts} from './image-layout.ts';\nexport * from './image-layout.ts';\nexport type TemplateId=")
change('packages/shared/src/index.ts', "TemplateVersion='1.0.0'|'1.1.0'", "TemplateVersion='1.0.0'|'1.1.0'|'1.2.0'")
change('packages/shared/src/index.ts', 'export const templateVersions=[...legacyTemplates,...templates];', "export const imageTemplates:TemplateSpec[]=templates.map(template=>({...template,version:'1.2.0'}));\nexport const templateVersions=[...legacyTemplates,...templates,...imageTemplates];")
change('packages/shared/src/index.ts', "script:{text:string;notes:string};scenes:Scene[];", "imageLayouts?:LegacyImageLayouts;script:{text:string;notes:string};scenes:Scene[];")
change('packages/shared/src/index.ts', "export type EditableProject={name:string;", "export type EditableProject={imageLayouts?:LegacyImageLayouts;name:string;")
change('packages/shared/src/index.ts', "=>({name:project.name,brief:", "=>({... (project.template.version==='1.2.0'?{imageLayouts:structuredClone(project.imageLayouts??{})}:{}),name:project.name,brief:")
change('packages/shared/src/index.ts', 'templateVersion?:TemplateVersion}', 'templateVersion?:TemplateVersion;imageLayouts?:LegacyImageLayouts;imageKeys?:Record<string,string>}')
change('packages/shared/src/index.ts', "prompts:{type:'array',maxItems:200,items:promptSchema},crf:{type:'integer',minimum:0,maximum:51}\n});", "prompts:{type:'array',maxItems:200,items:promptSchema},crf:{type:'integer',minimum:0,maximum:51},imageLayouts:legacyImageLayoutsSchema\n},['name','brief','script','scenes','prompts','crf']);")
change('packages/shared/src/index.ts', "version:{enum:['1.0.0','1.1.0']}", "version:{enum:['1.0.0','1.1.0','1.2.0']}")
change('packages/shared/src/index.ts', "script:(editableSchema.properties as Record<string,unknown>).script,", "imageLayouts:legacyImageLayoutsSchema,script:(editableSchema.properties as Record<string,unknown>).script,")
change('packages/shared/src/index.ts', "  })\n};", "  },['schemaVersion','id','revision','createdAt','updatedAt','name','status','brief','template','video','locale','brand','script','scenes','assets','prompts','references','audio','output','provenance'])\n};")
change('packages/shared/src/index.ts', '  return errors;\n}', """  if(project.template.version!=='1.2.0'&&project.imageLayouts!==undefined)errors.push('Image controls require template 1.2.0');
  if(project.template.version==='1.2.0'&&!project.imageLayouts)errors.push('Missing image layouts');
  for(const [sceneId,layouts] of Object.entries(project.imageLayouts??{}))for(const assetId of Object.keys(layouts)){
    const asset=project.assets.find(item=>item.id===assetId&&item.state!=='retired');
    if(!asset||!legacySceneImageRoles[project.template.id][sceneId]?.includes(asset.role))errors.push('Unknown scene image binding');
  }
  return errors;
}""")
change('packages/shared/src/index.ts', "if(project.template.version==='1.1.0')return", "if(project.template.version!=='1.0.0')return")
change('apps/server/src/storage.ts', 'next.output.crf=value.crf;', "next.output.crf=value.crf;if(project.template.version==='1.2.0')next.imageLayouts=structuredClone(value.imageLayouts??{});else if(value.imageLayouts!==undefined)throw new AppError(422,'LAYOUT_OPT_IN_REQUIRED','فعّل نسخة التحكم بالصور أولًا.');")
change('apps/server/src/storage.ts', 'templateVersion:project.template.version}', "templateVersion:project.template.version,...(project.template.version==='1.2.0'?{imageLayouts:project.imageLayouts,imageKeys:Object.fromEntries(project.assets.map(asset=>[asset.id,asset.mediaKey]))}:{})}")
for name in ['bim-personal-intro','bim-motion-study']:
    source=root/f'packages/templates/src/{name}/1.1.0/Composition.tsx'
    t=source.read_text(encoding='utf-8-sig')
    t="import {LegacyImageScope} from '@elmekawy/motion-components/common/LegacyImageLayout.tsx';\n"+t
    t=re.sub(r'from "\./(scene-data|data|Scenes|scenes/[^\"]+)"',r'from "../1.1.0/\1"',t)
    if name=='bim-personal-intro':
        t=t.replace('<TextScope id={scene.id}><Scene assets={assets}/></TextScope>','<TextScope id={scene.id}><LegacyImageScope sceneId={scene.id}><Scene assets={assets}/></LegacyImageScope></TextScope>')
    else:
        t=re.sub(r'<TextScope id="([a-z]+)">(.+?)</TextScope>',r'<TextScope id="\1"><LegacyImageScope sceneId="\1">\2</LegacyImageScope></TextScope>',t)
    target=root/f'packages/templates/src/{name}/1.2.0/Composition.tsx'
    target.parent.mkdir(parents=True,exist_ok=True);target.write_text(t,encoding='utf-8')
with (root/'packages/templates/src/index.ts').open('a',encoding='utf-8') as f:
    f.write("\nexport {ElmekawyBIMIntro as ElmekawyBIMIntroImages} from './bim-personal-intro/1.2.0/Composition';\nexport {ElmekawyBIMIntroV2 as ElmekawyBIMIntroV2Images} from './bim-motion-study/1.2.0/Composition';\n")
p=root/'packages/motion-engine/src/client.tsx'
t=p.read_text(encoding='utf-8')
t=t.replace('ElmekawyBIMIntroV2Editable}', 'ElmekawyBIMIntroV2Editable,ElmekawyBIMIntroImages,ElmekawyBIMIntroV2Images}')
t="import {LegacyImageLayoutProvider} from '@elmekawy/motion-components/common/LegacyImageLayout.tsx';\n"+t
t=t.replace("const Video=props.templateVersion==='1.1.0'?ElmekawyBIMIntroEditable:ElmekawyBIMIntro;", "const Video=props.templateVersion==='1.2.0'?ElmekawyBIMIntroImages:props.templateVersion==='1.1.0'?ElmekawyBIMIntroEditable:ElmekawyBIMIntro;")
t=t.replace("const Video=props.templateVersion==='1.1.0'?ElmekawyBIMIntroV2Editable:ElmekawyBIMIntroV2;", "const Video=props.templateVersion==='1.2.0'?ElmekawyBIMIntroV2Images:props.templateVersion==='1.1.0'?ElmekawyBIMIntroV2Editable:ElmekawyBIMIntroV2;")
t=t.replace('<Video assets=', '<LegacyImageLayoutProvider value={{layouts:props.imageLayouts??{},media:props.media,keys:props.imageKeys??{}}}><Video assets=')
t=t.replace("['assets']}/></AbsoluteFill>","['assets']}/></LegacyImageLayoutProvider></AbsoluteFill>")
p.write_text(t,encoding='utf-8')
