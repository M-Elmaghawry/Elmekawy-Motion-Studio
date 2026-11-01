import fs from 'node:fs';
let file='apps/studio/src/flexible/FlexibleEditor.tsx',t=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
const change=(a,b)=>{if(!t.includes(a))throw Error(a.slice(0,100));t=t.replaceAll(a,b);};
t="import {AudioTimeline} from './AudioTimeline';\nimport {PromptWorkspace} from './PromptWorkspace';\nimport {ProjectBackups} from '../ProjectBackups';\nimport {AdditionalSceneFields} from './AdditionalSceneFields';\nimport {SceneMediaControls} from './SceneMediaControls';\n"+t;
change('  renderReadinessErrors,','  renderReadinessErrors,\n  projectWarnings,\n  outputProfiles,\n  safeAreaFor,');
change('  ImplementedType,','  SupportedSceneType as ImplementedType,\n  PromptWorkspaceRecord,');
change("  async function upload(file: File)","  async function upload(file: File)");
const start=t.indexOf('              {binding && image && (');const end=t.indexOf('\n            </div>\n          )}',start);if(start<0||end<0)throw Error('media block');
t=t.slice(0,start)+t.slice(end);
change('              <fieldset disabled={disabled}>\n                <div className="form-grid">',`              {scene.mediaBindings.length>0&&<SceneMediaControls key={scene.id} project={draft} scene={scene} media={descriptor.inputProps.media} disabled={disabled||!parsed} onChange={value=>changeScene(()=>value)} onUpload={(file,slot)=>void uploadMedia(file,scene.id,slot)} onReview={(assetId,note,approved)=>void reviewAsset(assetId,note,approved)}/>}
              <fieldset disabled={disabled}>
                <AdditionalSceneFields scene={scene} onChange={value=>changeScene(()=>value)}/>
                <div className="form-grid">`);
const functions=`  async function mutate(action:(current:FlexibleProject)=>Promise<FlexibleProject>){
    if(!saved||!draft)return;setBusy('media');setError('');try{const current=dirty?await persist():saved;if(!current)return;const updated=await action(current);await apply(updated);await onProjectsChanged();setNotice('تم الحفظ.');}catch(value){fail(value);}finally{setBusy('');}
  }
  async function uploadMedia(file:File,sceneId?:string,slot=0,promptId?:string){await mutate(async current=>{
    const body=new FormData();body.append('file',file);const query=new URLSearchParams({slot:String(slot),...(promptId?{promptId}:{})});
    return api<FlexibleProject>(base+(sceneId?'/assets/'+sceneId:'/media')+'?'+query,{method:'POST',headers:{'If-Match':'"r'+current.revision+'"'},body});
  });}
  async function reviewAsset(assetId:string,sourceNote:string,approved:boolean){await mutate(current=>api<FlexibleProject>(base+'/review/'+assetId,{method:'POST',headers:{'If-Match':'"r'+current.revision+'"'},body:JSON.stringify({sourceNote,approved})}));}
  function uploadPrompt(file:File,prompt:PromptWorkspaceRecord){const scene=draft?.scenes.find(scene=>scene.id===prompt.sceneId);void uploadMedia(file,scene?.mediaBindings.length?scene.id:undefined,0,prompt.id);}
`;
change('  function field(key:',functions+'  function field(key:');
change("              {Object.entries(sceneLabels).map(([id, label]) => (", "              {Object.entries(sceneLabels).filter(([id])=>draft.schemaVersion==='2.1.0'||!['ui-demo','product-hero','before-after','data-explainer'].includes(id)).map(([id, label]) => (");
change('            <h2>المشاهد</h2>',`            <h2>المشاهد</h2>
            {draft.schemaVersion==='2.0.0'?<button data-testid="upgrade-flexible-media" disabled={disabled||!parsed} onClick={()=>void mutate(current=>api<FlexibleProject>(base+'/upgrade',{method:'POST',headers:{'If-Match':'"r'+current.revision+'"'},body:'{}'}))}>تفعيل أدوات الفيديو والصوت والمقاسات الجديدة</button>:<label className="field"><span>مقاس الفيديو</span><select data-testid="editor-output-profile" disabled={disabled} value={draft.outputProfile.id} onChange={event=>{const profile=outputProfiles.find(profile=>profile.id===event.target.value)!;change(project=>({...project,outputProfile:{...profile,crf:project.outputProfile.crf},brand:{...project.brand,safeArea:safeAreaFor(profile.aspectRatio)}}));}}>{outputProfiles.map(profile=><option key={profile.id} value={profile.id}>{profile.aspectRatio} · {profile.width} × {profile.height}</option>)}</select></label>}`);
change('          <div className="panel render-panel">',`          {draft.schemaVersion==='2.1.0'&&<>
            <AudioTimeline project={draft} media={descriptor.inputProps.media} disabled={disabled} onChange={project=>change(()=>project)} onUpload={file=>void uploadMedia(file)} onReview={(id,note,approved)=>void reviewAsset(id,note,approved)}/>
            <PromptWorkspace project={draft} disabled={disabled} onChange={project=>change(()=>project)} onUpload={uploadPrompt} onReview={(id,note,approved)=>void reviewAsset(id,note,approved)} onNotice={setNotice} onError={fail}/>
          </>}
          <ProjectBackups project={saved} base={base} disabled={disabled||!parsed} prepare={()=>dirty?persist():Promise.resolve(saved)} onRestored={async project=>{await apply(project as FlexibleProject);await onProjectsChanged();setNotice('تمت استعادة الإصدار السابق كإصدار جديد.');}} onError={fail}/>
          <div className="panel render-panel">`);
change('رأسي 1080 × 1920 · 30 FPS · MP4 / H.264 · بدون صوت',"{draft.outputProfile.width} × {draft.outputProfile.height} · {draft.outputProfile.fps} FPS · MP4 / H.264 · {draft.audio.mode==='timeline'&&draft.audio.tracks.some(track=>track.volume>0)?'بصوت':'بدون صوت'}");
change('{descriptor.warnings.map((message) => (','{[...new Set([...descriptor.warnings,...projectWarnings(draft)])].map((message) => (');
change('      <div className="editor-grid">',`      <nav className="editor-tabs" aria-label="أدوات المشروع المرن"><a href="#flex-scenes">المشاهد والصور</a>{draft.schemaVersion==='2.1.0'&&<><a href="#audio-timeline">الوسائط والصوت</a><a href="#prompt-workspace">البرومبتات</a></>}<a href="#project-backups">النسخ والاسترجاع</a></nav>
      <div className="editor-grid">`);
change('<div className="panel scene-tools">','<div className="panel scene-tools" id="flex-scenes">');
// Deleting a scene also removes its scene-linked prompt drafts.
change('return { ...project, scenes: next, targetDurationFrames: target };', 'return { ...project, scenes: next, targetDurationFrames: target,...(project.prompts?{prompts:project.prompts.filter(prompt=>next.some(scene=>scene.id===prompt.sceneId))}:{}) };');
fs.writeFileSync(file,t);
file='apps/studio/src/flexible/NewProjectWizard.tsx';t=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
t=t.replace("import { brandProfiles, sceneLabels }", "import { brandProfiles, sceneLabels, outputProfiles, portraitProfile }");
t=t.replace('    durationFrames: 600,','    durationFrames: 600,\n    outputProfileId: portraitProfile.id,');
t=t.replace('<select aria-label="المقاس" value="portrait" onChange={() => {}}>\n                        <option value="portrait">رأسي 9:16 · 1080 × 1920 · 30 FPS</option>\n                      </select>', '<select data-testid="wizard-output-profile" aria-label="المقاس" value={form.outputProfileId??portraitProfile.id} onChange={event=>setForm({...form,outputProfileId:event.target.value})}>{outputProfiles.map(profile=><option key={profile.id} value={profile.id}>{profile.aspectRatio} · {profile.width} × {profile.height} · {profile.fps} FPS</option>)}</select>');
t=t.replace('ثانية · {form.sceneTypes.length} مشاهد · رأسي 9:16','ثانية · {form.sceneTypes.length} مشاهد · {outputProfiles.find(profile=>profile.id===form.outputProfileId)?.aspectRatio??\'9:16\'}');
fs.writeFileSync(file,t);
