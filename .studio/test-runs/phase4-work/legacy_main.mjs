import fs from 'node:fs';
const file='apps/studio/src/main.tsx';let text=fs.readFileSync(file,'utf8');
function change(old,value){if(!text.includes(old))throw Error(old.slice(0,120));text=text.replaceAll(old,value);}
change('?{...descriptor.inputProps,edits:', '?{...descriptor.inputProps,imageLayouts:draft.imageLayouts,edits:');
change('  async function exportVideo(){', `  async function enableImageEditing(){
    if(!project)return;const current=dirty?await save():project;if(!current)return;
    setOperation('images');setError('');try{const copy=await api<Project>('/api/projects/'+current.id+'/image-editing-copy',{method:'POST',headers:{'If-Match':'"r'+current.revision+'"'},body:'{}'});await refreshProjects();await openProject(copy.id);setNotice('تم فتح نسخة تدعم التحكم في صور كل مشهد. النسخة الأصلية محفوظة.');}catch(value){failed(value);}finally{setOperation('');}
  }
  async function exportVideo(){`);
change('onChange={editScene}/></>}', 'onChange={editScene}/><LegacyImageControls project={project} draft={draft} descriptor={descriptor} sceneId={project.scenes[sceneIndex]?.id??project.scenes[0].id} disabled={!!operation} onChange={setDraft} onEnable={()=>void enableImageEditing()}/></>}');
fs.writeFileSync(file,text);
