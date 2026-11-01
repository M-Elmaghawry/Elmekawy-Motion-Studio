import fs from 'node:fs';
let file='packages/shared/src/flexible/manifest.ts',t=fs.readFileSync(file,'utf8');
t=t.replace('SceneRegistry, SupportedSceneType','ExtendedSceneRegistry, SupportedSceneType');
t=t.replace(/export const sceneRegistry: SceneRegistry & Record<[^\n]+ = \{/,'export const sceneRegistry: ExtendedSceneRegistry = {');
t=t.replace("mediaSlots: [{ name: 'image', kinds: ['image'], required: true }]", "mediaSlots: [{ name: 'image', kinds: ['image','video'], required: true }]");
t=t.replace('Object.assign(sceneRegistry, {});\n','');
t=t.replace('export const reservedSceneTypes = [','export const legacyReservedSceneTypes = [');
t+='\nexport const reservedSceneTypes = [] as const;\n';fs.writeFileSync(file,t);
file='tests/flexible.test.ts';t=fs.readFileSync(file,'utf8').replace('  reservedSceneTypes,','  legacyReservedSceneTypes as reservedSceneTypes,');fs.writeFileSync(file,t);
file='apps/studio/src/flexible/NewProjectWizard.tsx';t=fs.readFileSync(file,'utf8').replace('FlexibleProject, ImplementedType, FlexibleCreate','FlexibleProject, SupportedSceneType as ImplementedType, FlexibleCreate');
t=t.replace("created.scenes.find((scene) => scene.type === 'media-showcase')","created.scenes.find((scene) => scene.mediaBindings.length>0)");
fs.writeFileSync(file,t);
file='apps/studio/src/flexible/FlexibleEditor.tsx';t=fs.readFileSync(file,'utf8');
t=t.replace("import { ImageControls } from './ImageControls';\n",'').replace('  MediaBinding,\n','');
const a=t.indexOf('  async function upload(file: File)');const b=t.indexOf('  async function mutate(',a);if(a<0||b<0)throw Error('unused upload functions');t=t.slice(0,a)+t.slice(b);
t=t.replace(",\n    [reviewNote, setReviewNote] = useState('');",';');
const imageStart=t.indexOf('  const image =\n');const imageEnd=t.indexOf('  const fail =',imageStart);if(imageStart<0)throw Error('old image');t=t.slice(0,imageStart)+t.slice(imageEnd);
t=t.replace("  useEffect(() => setReviewNote(image?.sourceNote ?? ''), [image?.id]);\n",'');
t=t.replace("  const binding = scene?.type === 'media-showcase' ? scene.mediaBindings[0] : null;\n",'');
t=t.replace('<div className="jobs">', '<div className="jobs">{!jobs.some(job=>job.state===\'completed\')&&<p className="inline-note">لا توجد نسخة فيديو مكتملة لهذا المشروع بعد.</p>}');
fs.writeFileSync(file,t);
file='apps/studio/src/flexible/flexible.css';fs.appendFileSync(file,'\n.studio .field select{font:inherit;color:var(--text);background:#09111e;border:1px solid var(--line);border-radius:9px;padding:10px;max-width:100%;}\n');
file='.prettierrc.json';const config=JSON.parse(fs.readFileSync(file,'utf8'));config.endOfLine='auto';fs.writeFileSync(file,JSON.stringify(config,null,2)+'\n');
file='package.json';const pkg=JSON.parse(fs.readFileSync(file,'utf8'));
for(const key of ['format','format:check'])pkg.scripts[key]=pkg.scripts[key].replace('packages/templates/src/flexible-reel/1.0.0','packages/templates/src/flexible-reel/1.1.0')+' packages/shared/src/image-layout.ts packages/motion-components/src/common/LegacyImageLayout.tsx packages/templates/src/bim-personal-intro/1.2.0 packages/templates/src/bim-motion-study/1.2.0 apps/server/src/flexible-media.ts apps/server/src/project-archives.ts apps/studio/src/LegacyImageControls.tsx apps/studio/src/ProjectBackups.tsx tests/phase4.test.ts tests/phase4-fixtures.ts scripts/verify-phase4-ui.ts docs/PHASE_4_IMPLEMENTATION.md';
pkg.scripts['test:phase4']='node --test tests/phase4.test.ts';pkg.scripts['verify:phase4-ui']='node scripts/verify-phase4-ui.ts';fs.writeFileSync(file,JSON.stringify(pkg,null,2)+'\n');
// Frozen versions keep their manifests. New opt-in versions get independent metadata.
for(const name of ['bim-personal-intro','bim-motion-study']){
 const spec=JSON.parse(fs.readFileSync(`packages/templates/src/${name}/1.1.0/template.json`,'utf8'));spec.version='1.2.0';spec.imageControls={sceneLocal:true,identityDefaults:true};fs.writeFileSync(`packages/templates/src/${name}/1.2.0/template.json`,JSON.stringify(spec,null,2)+'\n');
}
