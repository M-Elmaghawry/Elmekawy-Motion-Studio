import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'elmekawy-bim-reel-V2/src');
const v1 = 'packages/templates/src/bim-personal-intro/1.0.0';
const v2 = 'packages/templates/src/bim-motion-study/1.0.0';
const components = 'packages/motion-components/src';
const write = async (target, text) => {const file=path.join(root,target);await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,text,{flag:'wx'});};
const common = text => text.replaceAll(/(["'])(?:\.\/|\.\.\/|\.\.\/\.\.\/)brand\/theme\1/g,'"@elmekawy/shared/theme"')
  .replaceAll(/"(?:\.\/|\.\.\/)components\/Fonts"/g,'"@elmekawy/motion-components/common/Fonts.tsx"')
  .replaceAll(/"(?:\.\/|\.\.\/)components\/Motion"/g,'"@elmekawy/motion-components/legacy-v1/Motion.tsx"')
  .replaceAll(/"\.\.\/components\/motion\/([^"/]+)"/g,'"@elmekawy/motion-components/motion-study-v1/$1.tsx"')
  .replaceAll('"../motion/presets"','"@elmekawy/motion-components/motion-study-v1/presets.ts"')
  .replaceAll('"../motion/tokens"','"@elmekawy/motion-components/motion-study-v1/tokens.ts"');
await write('packages/shared/src/themes/brand.ts',await fs.readFile(path.join(source,'brand/theme.ts'),'utf8'));
for (const file of ['Composition.tsx','scene-data.ts',...(await fs.readdir(path.join(source,'scenes'))).map(name=>'scenes/'+name)]) {
  let text=common(await fs.readFile(path.join(source,file),'utf8'));
  if(file==='Composition.tsx') text='import {useMedia} from "@elmekawy/motion-components/common/Runtime.tsx";\n'+text.replace('  staticFile,\n','').replace('= ({assets}) => {','= ({assets}) => {\n  const media = useMedia();').replace('staticFile("assets/audio/bim-reel.mp3")','media("assets/audio/bim-reel.mp3")');
  if(file.startsWith('scenes/')) {
    text='import {CopyText} from "@elmekawy/motion-components/common/Runtime.tsx";\n'+text;
    const replacements = {'HookScene.tsx':['مش مجرد'],'InfrastructureScene.tsx':['One coordinated vision.'],'ServicesScene.tsx':['Precision.','At every stage.'],'TrainingScene.tsx':['Build skills.','Work with confidence.'],'PersonalBrandScene.tsx':['Mahmoud','Elmekawy.']};
    for(const value of replacements[path.basename(file)]??[])text=text.replace('>'+value+'<','><CopyText text='+JSON.stringify(value)+'/><');
    if(file.endsWith('CtaScene.tsx'))text=text.replace('>{word}</Heading>','><CopyText text={word}/></Heading>');
  }
  await write(v1+'/'+file,text);
}
let motion=common(await fs.readFile(path.join(source,'components/Motion.tsx'),'utf8'));
motion='import {useMedia} from "../common/Runtime.tsx";\n'+motion.replace('spring, staticFile,','spring,').replace('import {assetPaths, type AssetKey} from "../scene-data";','import {legacyAssetPaths as assetPaths, type LegacyAssetKey as AssetKey} from "@elmekawy/shared";').replace('  const [failed, setFailed] = useState(false);','  const media = useMedia();\n  const [failed, setFailed] = useState(false);').replace('staticFile(assetPaths[asset])','media(assetPaths[asset])');
await write(components+'/legacy-v1/Motion.tsx',motion);
for(const file of ['Composition.tsx','data.ts','Scenes.tsx','Visuals.tsx']){
  let text=common(await fs.readFile(path.join(source,'v2',file),'utf8'));
  if(file==='Visuals.tsx')text='import {useMedia} from "@elmekawy/motion-components/common/Runtime.tsx";\n'+text.replace('interpolate, staticFile,','interpolate,').replace('  const [failed, setFailed] = useState(false);','  const media = useMedia();\n  const [failed, setFailed] = useState(false);').replace('staticFile(v2Assets[asset].path)','media(v2Assets[asset].path)');
  await write(v2+'/'+file,text);
}
for(const file of ['tokens.ts','presets.ts',...(await fs.readdir(path.join(source,'components/motion')))]){
  const original=file.endsWith('.ts')?'motion/'+file:'components/motion/'+file;
  let text=common(await fs.readFile(path.join(source,original),'utf8')).replaceAll('"../../motion/presets"','"./presets"').replaceAll('"../../motion/tokens"','"./tokens"');
  if(file==='ArabicWordReveal.tsx')text='import {useCopy} from "../common/Runtime.tsx";\n'+text.replace('({text, delay = 0,','({text: sourceText, delay = 0,').replace('  const frame = useCurrentFrame();','  const text = useCopy(sourceText);\n  const frame = useCurrentFrame();');
  await write(components+'/motion-study-v1/'+file,text);
}
console.log('Extracted original composition logic into the active packages; originals untouched.');
