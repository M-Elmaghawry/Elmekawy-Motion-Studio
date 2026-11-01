import fs from 'node:fs';
let file='apps/studio/src/main.tsx',t=fs.readFileSync(file,'utf8');
t="import {ProjectBackups,ArchiveImportButton} from './ProjectBackups';\n"+t;
t=t.replace("type Tab='scenes'|'brief'|'assets'|'prompts'|'output';", "type Tab='scenes'|'brief'|'assets'|'prompts'|'output'|'backup';");
t=t.replace("['output','الإخراج']", "['output','الإخراج'],['backup','النسخ والاسترجاع']");
t=t.replace('<main className="main">',`<main className="main"><div className="actions" style={{justifyContent:'flex-end',marginBottom:12}}><ArchiveImportButton disabled={!ready||!!operation||dirty||flexDirty} onError={failed} onImported={async result=>{await refreshProjects();if(result.format==='legacy')await openProject(result.project.id);else openFlexible(result.project as FlexibleProject);setNotice('تم استيراد المشروع والوسائط والإصدارات في مجلد مستقل.');}}/></div>`);
t=t.replace("          {tab==='brief'",`          {tab==='backup'&&<ProjectBackups project={project} base={'/api/projects/'+project.id} disabled={!!operation} prepare={()=>dirty?save():Promise.resolve(project)} onError={failed} onRestored={async()=>{await refreshProjects();await openProject(project.id);setNotice('تمت الاستعادة كإصدار جديد.');}}/>}
          {tab==='brief'`);
fs.writeFileSync(file,t);
file='apps/server/src/uploads.ts';t=fs.readFileSync(file,'utf8');t=t.replace('current.assets.push(asset);',"current.assets.push(asset);if(previous&&current.imageLayouts)for(const layouts of Object.values(current.imageLayouts)){if(layouts[previous.id]){layouts[assetId]=layouts[previous.id];delete layouts[previous.id];}}");fs.writeFileSync(file,t);
file='apps/server/src/flexible-media.ts';t=fs.readFileSync(file,'utf8').replace('prompt.id === promptId && prompt.sceneId === sceneId','prompt.id === promptId && (!sceneId || prompt.sceneId === sceneId)');fs.writeFileSync(file,t);
file='apps/server/src/flexible-routes.ts';t=fs.readFileSync(file,'utf8').replace('uploadFlexibleMedia(params(request).id,revision(request),part)',"uploadFlexibleMedia(params(request).id,revision(request),part,undefined,0,(request.query as {promptId?:string}).promptId)");fs.writeFileSync(file,t);
file='tests/flexible.test.ts';t=fs.readFileSync(file,'utf8').replace("['3.0.0', '2.1.0', null]","['3.0.0', '2.2.0', null]");fs.writeFileSync(file,t);
file='tests/flexible-editor.test.ts';t=fs.readFileSync(file,'utf8').replace("assert.equal(snapshot.schemaVersion, '2.0.0')","assert.equal(snapshot.schemaVersion, '2.1.0')");fs.writeFileSync(file,t);
file='apps/studio/src/flexible/flexible.css';fs.appendFileSync(file,`\n.flexible .prompt-record,.flexible .audio-track,.flexible .scene-media-controls{border:1px solid var(--line);padding:16px;margin:16px 0;border-radius:12px;min-width:0;}
.flexible .panel,.recovery-panel{margin-bottom:20px;scroll-margin-top:20px;}
.editor-tabs a{padding:10px 14px;color:var(--text);border:1px solid var(--line);border-radius:9px;text-decoration:none;}
.recovery-panel select{font:inherit;color:var(--text);background:#09111e;border:1px solid var(--line);border-radius:9px;padding:10px;max-width:100%;}
.legacy-images .image-controls{margin-top:12px;}
.flexible audio{max-width:100%;}
`);
