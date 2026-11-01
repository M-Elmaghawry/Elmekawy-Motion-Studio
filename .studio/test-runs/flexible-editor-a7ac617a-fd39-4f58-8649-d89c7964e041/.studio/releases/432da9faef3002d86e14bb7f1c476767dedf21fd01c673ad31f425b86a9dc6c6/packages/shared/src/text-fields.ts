export type TextFieldSpec={
  id:string;
  label:string;
  defaultValue:string;
  group:'scene'|'fallback'|'global';
  legacySource?:string;
};
type Definition=[key:string,label:string,value:string,legacySource?:string];
const fields=(scene:string,definitions:Definition[],group:TextFieldSpec['group']='scene'):TextFieldSpec[]=>definitions.map(([key,label,defaultValue,legacySource])=>({id:scene+'.'+key,label,defaultValue,group,...(legacySource?{legacySource}:{})}));
const heading=(number:string,text:string):Definition[]=>[['sectionNumber','رقم المشهد',number],['eyebrow','العنوان الصغير',text]];
const numbers=(prefix:string,count:number,label:string):Definition[]=>Array.from({length:count},(_,i)=>[prefix+'.'+(i+1),label+' '+(i+1),String(i+1).padStart(2,'0')]);

export const textCatalog:Record<string,Record<string,TextFieldSpec[]>>={
  'bim-personal-intro':{
    hook:fields('hook',[
      ['eyebrow','العنوان الصغير','BEYOND THE MODEL / 01'],
      ['arabicPrefix','العنوان العربي — الجزء الأول','الـ'],
      ['bim','مصطلح العنوان الأول','BIM'],
      ['middleLine','العنوان العربي — السطر الثاني','مش مجرد','مش مجرد'],
      ['model','العنوان العربي — الجزء الأخير','موديل'],
      ['threeD','مصطلح العنوان الأخير','3D'],
      ['tagline','الشعار النصي السفلي','THINK SYSTEMS. BUILD BETTER.']]),
    infrastructure:[...fields('infrastructure',[
      ['eyebrow','العنوان الصغير','CONNECTED BY DESIGN / 02'],
      ['title1','العنوان الرئيسي — السطر الأول','STRUCTURAL &'],
      ['title2','العنوان الرئيسي — السطر الثاني','INFRASTRUCTURE'],
      ['title3','العنوان الرئيسي — السطر الثالث','BIM'],
      ['caption1','التعليق السفلي — السطر الأول','Structure. Infrastructure.'],
      ['caption2','التعليق السفلي — السطر الثاني','One coordinated vision.','One coordinated vision.']]),
      ...fields('infrastructure',[['fallback.infrastructure.caption','تسمية البديل عند غياب الصورة','BIM / CONCEPT VISUAL']],'fallback')],
    services:[...fields('services',[
      ['eyebrow','العنوان الصغير','FROM MODEL TO DELIVERY / 03'],
      ['title1','العنوان الرئيسي — السطر الأول','Precision.','Precision.'],
      ['title2','العنوان الرئيسي — السطر الثاني','At every stage.','At every stage.'],
      ['items.1.label','الخدمة الأولى','BIM Modeling'],
      ['items.2.label','الخدمة الثانية','Coordination'],
      ['items.3.label','الخدمة الثالثة','Quantity Takeoff'],
      ['items.4.label','الخدمة الرابعة','Automation'],
      ...numbers('items.number',4,'رقم الخدمة')]),
      ...fields('services',[
        ['fallback.structural.caption','تسمية بديل الصورة الإنشائية','BIM / CONCEPT VISUAL'],
        ['fallback.technology.caption','تسمية بديل الصورة التقنية','BIM / CONCEPT VISUAL']],'fallback')],
    training:fields('training',[
      ['eyebrow','العنوان الصغير','KNOWLEDGE INTO PRACTICE / 04'],
      ['title1','العنوان الرئيسي — السطر الأول','REVIT &'],
      ['title2','العنوان الرئيسي — السطر الثاني','BIM TRAINING'],
      ['credential1','وصف الاعتماد — السطر الأول','Autodesk Certified'],
      ['credential2','وصف الاعتماد — السطر الثاني','Instructor'],
      ['framework','عنوان إطار التعلم','THE LEARNING FRAMEWORK'],
      ['learning.1','خطوة التعلم الأولى','UNDERSTAND'],
      ['learning.2','خطوة التعلم الثانية','APPLY'],
      ['learning.3','خطوة التعلم الثالثة','DELIVER'],
      ['caption1','التعليق السفلي — السطر الأول','Build skills.','Build skills.'],
      ['caption2','التعليق السفلي — السطر الثاني','Work with confidence.','Work with confidence.']]),
    brand:[...fields('brand',[
      ['eyebrow','العنوان الصغير','ENGINEER. EDUCATOR. / 05'],
      ['name1','الاسم — السطر الأول','Mahmoud','Mahmoud'],
      ['name2','الاسم — السطر الثاني','Elmekawy.','Elmekawy.'],
      ['subtitle','المسمى والخبرات','Senior BIM Engineer | BIM Coordinator | Autodesk Certified Instructor']]),
      ...fields('brand',[
        ['fallback.portrait.mark','حروف البديل عند غياب الصورة','ME'],
        ['fallback.portrait.caption','تسمية البديل عند غياب الصورة','ELMEKAWY / BIM']],'fallback')],
    cta:fields('cta',[
      ['eyebrow','العنوان الصغير','YOUR NEXT CHAPTER / 06'],
      ['word1','العبارة الرئيسية الأولى','Learn','Learn'],
      ['word2','العبارة الرئيسية الثانية','Build','Build'],
      ['word3','العبارة الرئيسية الثالثة','Coordinate','Coordinate'],
      ['name','الاسم الكامل','Mahmoud Elmekawy'],
      ['linkCaption','عنوان رابط التواصل','EXPLORE THE PORTFOLIO ↗'],
      ['website','رابط التواصل','https://www.linkedin.com/in/mahmoud-elmekawy/']])
  },
  'bim-motion-study':{
    hook:[...fields('global',[
      ['brandName','اسم العلامة أعلى الفيديو','ELMEKAWY'],
      ['brandSuffix','تكملة العلامة أعلى الفيديو','BIM'],
      ['studyLabel','التسمية أعلى الفيديو','MOTION STUDY / 02']],'global'),
      ...fields('hook',[
        ...heading('01','BEYOND THE MODEL'),
        ['title1','العنوان — السطر الأول','الموديل','الموديل'],
        ['title2','العنوان — السطر الثاني','مش هو الـ','مش هو الـ'],
        ['title3','العنوان — السطر الثالث','BIM','BIM'],
        ['tagline','الشعار النصي السفلي','THINK IN CONNECTIONS.'],
        ['note','الملاحظة السفلية','القيمة في الترابط، مش في الشكل بس.']])],
    network:[...fields('network',[
      ...heading('02','A CONNECTED SYSTEM'),
      ['title1','العنوان — السطر الأول','من موديل','من موديل'],
      ['title2','العنوان — السطر الثاني','لشبكة تنسيق','لشبكة تنسيق'],
      ['overlay','عنوان الرسم','MODEL → COORDINATION'],
      ...numbers('nodes',4,'رقم عقدة الشبكة'),
      ['center','تسمية مركز الشبكة','BIM'],
      ['note','الملاحظة السفلية','تصوّر توضيحي · ربط التخصصات والمعلومات']]),
      ...fields('network',[['fallback.caption','تسمية البديل عند غياب الصورة','STRUCTURAL / PLACEHOLDER']],'fallback')],
    comparison:[...fields('comparison',[
      ...heading('03','MAKE THE CONFLICT VISIBLE'),
      ['title1','العنوان — السطر الأول','نشوف التعارض','نشوف التعارض'],
      ['title2','العنوان — السطر الثاني','ونراجع المسار','ونراجع المسار'],
      ['afterLabel','عنوان جانب بعد','AFTER / بعد'],
      ['beforeLabel','عنوان جانب قبل','BEFORE / قبل'],
      ['note','الملاحظة السفلية','مثال توضيحي فقط · ليس نتيجة مشروع أو تحقق هندسي']]),
      ...fields('comparison',[
        ['fallback.before','تسمية بديل صورة قبل','SCHEMATIC PLACEHOLDER'],
        ['fallback.after','تسمية بديل صورة بعد','SCHEMATIC PLACEHOLDER']],'fallback')],
    workflow:fields('workflow',[
      ...heading('04','ONE CONTINUOUS WORKFLOW'),
      ['title1','العنوان الرئيسي','كل خطوة متصلة','كل خطوة متصلة'],
      ...(['MODEL','COORDINATE','CHECK','DELIVER'].flatMap((label,i):Definition[]=>[
        ['steps.'+(i+1)+'.number','رقم الخطوة '+(i+1),String(i+1).padStart(2,'0')],
        ['steps.'+(i+1)+'.label','الخطوة '+(i+1)+' — إنجليزي',label],
        ['steps.'+(i+1)+'.arabic','الخطوة '+(i+1)+' — عربي',['نمذجة','تنسيق','مراجعة','تسليم'][i]],
        ['steps.'+(i+1)+'.arrow','رمز الخطوة '+(i+1),'→']
      ])),
      ['note','الملاحظة السفلية','من الفكرة إلى التسليم.']]),
    cta:[...fields('cta',[
      ...heading('05','LET’S CONNECT'),
      ['brandName','اسم العلامة في الخاتمة','ELMEKAWY'],
      ['brandSuffix','تكملة العلامة في الخاتمة','BIM'],
      ['title1','العبارة العربية — السطر الأول','نربط التفاصيل','نربط التفاصيل'],
      ['title2','العبارة العربية — السطر الثاني','ونبني الصورة الكاملة','ونبني الصورة الكاملة'],
      ['contact','دعوة التواصل','خلّينا نتواصل'],
      ['website','رابط التواصل','linkedin.com/in/mahmoud-elmekawy ↗']]),
      ...fields('cta',[['fallback.mark','حروف البديل عند غياب الشعار','ME']],'fallback')]
  }
};
