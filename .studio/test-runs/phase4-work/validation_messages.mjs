import fs from 'node:fs';
const file='apps/studio/src/flexible/FlexibleEditor.tsx';let t=fs.readFileSync(file,'utf8');
t=t.replace('  const parsed = useMemo(() => {','  const validation = useMemo(() => {');
t=t.replace('    if (!draft) return null;\n    try {\n      return parseFlexibleProject(draft);\n    } catch {\n      return null;\n    }\n  }, [draft]);',`    if(!draft)return {project:null,message:''};
    try{return {project:parseFlexibleProject(draft),message:''};}catch(error){
      const issues=error instanceof Error?error.message:'';
      const message=issues.includes('AUDIO_OVERLAPS_SILENCE')?'علامة الصمت تتداخل مع مسار مسموع. قصّر المسار أو غيّر توقيته.':issues.includes('INVALID_AUDIO_TIMING')?'راجع بداية الصوت ومدته والقص والتدرج. يجب أن يبقى داخل الفيديو والملف الأصلي.':issues.includes('VIDEO_TOO_SHORT')?'مدة ملف الفيديو أو نقطة القص لا تغطي مدة المشهد.':issues.includes('MOTION_EXCEEDS_SCENE')?'حركة الدخول والتتابع والخروج أطول من مدة المشهد.':issues.includes('BEAT_OUT_OF_RANGE')||issues.includes('PAUSE_OUT_OF_RANGE')?'علامة إيقاع أو وقفة تقع خارج مدة الفيديو.':'راجع مدد المشاهد وقيم الحقول. المدة الإجمالية يجب أن تكون بين 20 و45 ثانية.';
      return {project:null,message};
    }
  }, [draft]);
  const parsed=validation.project;`);
t=t.replace('          راجع مدد المشاهد وقيم الحقول. يجب أن تكون المدة الإجمالية بين 20 و45 ثانية؛ المعاينة تعرض\n          آخر إعدادات صالحة.', '          {validation.message} المعاينة تعرض آخر إعدادات صالحة.');
fs.writeFileSync(file,t);
