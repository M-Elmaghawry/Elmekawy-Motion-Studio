import fs from 'node:fs';
const file='apps/studio/src/main.tsx';let t=fs.readFileSync(file,'utf8');
const controls='<LegacyImageControls project={project} draft={draft} descriptor={descriptor} sceneId={project.scenes[sceneIndex]?.id??project.scenes[0].id} disabled={!!operation} onChange={setDraft} onEnable={()=>void enableImageEditing()}/>';
const texts='<SceneTextEditor template={templateFor(project.template.id,project.template.version)} scenes={draft.scenes} sceneIndex={sceneIndex} disabled={operation===\'saving\'} onChange={editScene}/>';
if(!t.includes(texts)){const anchor='</small></span></button>)}</div>';if(!t.includes(anchor))throw Error('scene list');t=t.replace(anchor,anchor+controls+texts);}
else t=t.replace(texts+controls,controls+texts);
t=t.replace("'output'|'backup';","'output'|'backup'|'images';");
t=t.replace("['scenes','المشاهد']","['scenes','المشاهد'],['images','حجم وموضع الصور']");
t=t.replace("          {tab==='brief'",`          {tab==='images'&&<><label className="field"><span>المشهد المطلوب</span><select data-testid="legacy-layout-scene" value={sceneIndex} onChange={event=>jumpScene(Number(event.target.value))}>{project.scenes.map((scene,index)=><option key={scene.id} value={index}>{scene.name}</option>)}</select></label>${controls}</>}
          {tab==='brief'`);
// Layout-enabled uploads save drafts first, then keep the new immutable asset IDs in the draft.
t=t.replace("async function upload(role:string,file:File){if(!project)return;setOperation", "async function upload(role:string,file:File){if(!project)return;const current=project.template.version==='1.2.0'&&dirty?await save():project;if(!current)return;setOperation");
t=t.replace("'/api/projects/'+project.id+'/assets/'+role", "'/api/projects/'+current.id+'/assets/'+role");
t=t.replace("const updated=await api<Project>('/api/projects/'+current.id+'/assets/'+role,{method:'POST',headers:{'If-Match':'\"r'+project.revision+'\"'}", "const updated=await api<Project>('/api/projects/'+current.id+'/assets/'+role,{method:'POST',headers:{'If-Match':'\"r'+current.revision+'\"'}");
t=t.replace('body:form});setProject(updated);const resolved=',"body:form});setProject(updated);if(updated.template.version==='1.2.0')setDraft(editableOf(updated));const resolved=");
fs.writeFileSync(file,t);
