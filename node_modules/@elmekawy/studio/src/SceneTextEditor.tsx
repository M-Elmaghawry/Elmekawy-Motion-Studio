import React from 'react';
import type {EditableProject,TemplateSpec,TextFieldSpec} from '@elmekawy/shared';
type Props={template:TemplateSpec;scenes:EditableProject['scenes'];sceneIndex:number;disabled:boolean;onChange:(sceneIndex:number,key:string,value:string)=>void};
export function SceneTextEditor({template,scenes,sceneIndex,disabled,onChange}:Props){
  const spec=template.scenes[sceneIndex];
  const fields:TextFieldSpec[]=spec.textFields??Object.keys(scenes[sceneIndex].content).map(key=>({id:key,label:key,defaultValue:key,group:'scene'}));
  const local=fields.filter(field=>field.group==='scene'),fallback=fields.filter(field=>field.group==='fallback');
  const global=template.scenes.flatMap((scene,index)=>(scene.textFields??[]).filter(field=>field.group==='global').map(field=>({field,owner:index})));
  const input=(field:TextFieldSpec,owner=sceneIndex)=><label className="field" key={field.id} htmlFor={'text-'+field.id}><span>{field.label}<small dir="auto"> · الأصل: {field.defaultValue}</small></span><input id={'text-'+field.id} data-text-field={field.id} dir="auto" maxLength={200} disabled={disabled} value={scenes[owner].content[field.id]} onChange={event=>onChange(owner,field.id,event.target.value)}/></label>;
  return <div className="scene-copy">
    <div className="sectionhead"><h3>نصوص المشهد</h3><small>{local.length} خانات تعديل</small></div>
    {local.map(field=>input(field))}
    {global.length>0&&<section className="text-field-group"><h3>نصوص ثابتة في كل المشاهد</h3>{global.map(({field,owner})=>input(field,owner))}</section>}
    {fallback.length>0&&<section className="text-field-group"><h3>نصوص الصور البديلة</h3><p className="muted">تظهر هذه النصوص عندما تكون الصورة أو الشعار غير متوفرة.</p>{fallback.map(field=>input(field))}</section>}
    <p className="inline-note">تعديل كل خانة يظهر في النص المرتبط بها فورًا، ويُستخدم بعد الحفظ في التصدير نفسه.</p>
  </div>;
}
