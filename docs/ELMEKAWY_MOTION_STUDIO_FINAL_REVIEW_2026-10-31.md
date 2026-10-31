# Elmekawy Motion Studio — Final Code Review & Motion Lab Research

**التاريخ:** 31 أكتوبر 2026  
**نطاق التحليل:** آخر نسخة منشورة من `main` بمستودع [Elmekawy Motion Studio](https://github.com/M-Elmaghawry/Elmekawy-Motion-Studio)، و18 فيديو MP4 رفعها صاحب المشروع (المدة الإجمالية **917.3 ثانية = 15.3 دقيقة**).  
**النسخة:** Research / Architecture Recommendation v2.0  
**التصنيف:** تقرير تخطيط وتطوير، **ليس سجل تنفيذ**.

> **حدود التحقق:** راجعت الملفات العامة التي أمكن فتحها في GitHub، وفحصت الفيديوهات المرفوعة محليًا واستخراج 12 لقطة موزعة زمنيًا من كل فيديو من الفيديوهات الـ13 المتبقية، بالإضافة إلى ملخص التحليل السابق للخمسة 03/09/13/14/17. جميع الفيديوهات 576×1024، 30 FPS وبها مسار صوت AAC، لكن لم أجرِ تدقيقًا سمعيًا تفصيليًا أو قياسًا دقيقًا لكل Cut/Beat؛ لذلك الملاحظات الصوتية *متطلبات تحسين مقترحة* وليست ادعاءات عن توقيت الأصوات الفعلي. **لم أتمكن من Clone أو تشغيل Build/Tests للمستودع من بيئة المراجعة**؛ إذ تعذّر الوصول الشبكي من بيئة الطرفية. لا أدّعي التحقق العملي من أداء برنامج Windows.

---

## 1. القرار التنفيذي

المشروع أصبح **Local Production MVP**؛ بنية الـ Workspaces والمحرك المشترك وبيانات المشاريع المنفصلة تسمح بإعادة استخدام القوالب الحالية. إضافة Windows Launcher تحسّن تجربة الاستخدام. **لكن المنتج لا يزال محررًا لقالبين ثابتين، وليس نظام تأليف حر للمشاهد**. بعد تحليل Motion Lab، أعلى قيمة ليست في إضافة حزمة Effects عشوائية، بل في بناء نظام مرن لـ **Scene Composition + Motion Semantics + Asset Binding + Timing/Audio**.

### أولويات سريعة

| الرتبة | العمل | السبب | اختبار قبول |
|---|---|---|---|
| P0 | تصحيح أوامر Launcher في `package.json` والتوثيق | README يذكر أوامر npm غير موجودة في ملف الحزم الحالي | تنفيذ أمر Build وVerify الموثقين على Windows ينجح |
| P0 | إزالة اعتماد Chrome على `elmekawy-bim-reel-V2` | خطوة التثبيت لا تزال مشروطة بمشروع تاريخي | Fresh clone + seed + render دون الحاجة للمجلد القديم |
| P0 | تدقيق البيانات والأرشيف والوسائط المتتبعة في Git | حجم المستودع وخطورة نشر ملفات عملاء وRenders | نسخة كود خفيفة مع بيانات محلية خاصة ونسخ احتياطية مستقلة |
| P1 | Flexible Scene Engine & Template Manifest | لا يمكن تكوين فيديو جديد بالمشاهد حسب الطلب | إنشاء 20–45 ثانية بـ3–8 مشاهد مختلفة دون TSX جديد |
| P1 | Storyboard/Scene Editor | منظومة Motion Lab تعتمد على المعنى والتوقيت | إضافة/حذف/إعادة ترتيب/توقيت مشهد من الواجهة |
| P1 | Audio/Timing Planning | إيقاع الحركة يحتاج مرجعًا زمنيًا | Timeline tracks + markers + Voiceover timing |
| P1 | Asset/Brand Manager | إعلانات المنتج تحتاج media متنوعة وهوية عملاء | صور + فيديو + صوت + شعارات بإسناد أصول وتصاريح |
| P2 | Motion Component Library | إعادة الاستخدام بدل 18 قالبًا | 12 مكونًا مستقلًا مع live preview وtests |
| P2 | Windows UX packaging | Launcher ليس EXE مستقلًا | Launch + update/repair + portable data backup بدون VS Code |
| P2 | Automated QA/CI | حماية التوافق والتصدير | Type/test/build على PR + Render smoke test دوري |

---

## 2. مراجعة تحديثات GitHub: ما الذي تحسّن؟

**مؤكد من README والكود المنشور:**

1. أضيف Launcher بواجهة Windows/C# في `tools/launcher/Program.cs` وEXE صغير في الجذر. يمكنه بدء خادم Node المحلي وفتح المتصفح، واكتشاف نسخة تعمل، وإظهار قائمة Tray للتشغيل/الإيقاف.
2. يستخدم نافذة Process وstdin private shutdown، ولا يعتمد على Public HTTP Shutdown API. فيه فحص للمتطلبات وبناء UI ومتحكم في ملكية العملية، لكننا لم نتحقق من كل مسارات الخطأ على Windows.
3. فحص الإصدار متشدد: Node.js 24+، ووجود Chrome في `node_modules/.remotion/...`، وملفات Build وCatalog.
4. النواة الحالية تحتفظ بقالبين V1 وV2، ونظام النصوص القابل للتحرير بإصدار 1.1.0، وبإصدارات القوالب السابقة لحفظ توافق الرندرات.
5. الـ README يصف حدود المنتج صراحة: تشغيل Windows، صور خارجية يدويًا، ودون تكامل مع خدمات AI؛ دي ممارسة جيدة.

**فجوة مؤكدة تحتاج إصلاحًا فوريًا:**
- `README.md` يوثق `npm.cmd run launcher:build` و`npm.cmd run launcher:verify`.
- `package.json` المنشور لا يحتوي على هذين الـscripts؛ الموجودة هي `build`, `start`, `dev`, `test`, `verify:legacy`, `seed` فقط.
- يوجد `scripts/build-launcher.ps1` ويمكن ربطه بالـnpm أو تعديل توثيق التشغيل إلى أمر PowerShell الحقيقي. الأفضل إضافة Script aliases وفحصهما آليًا.

**ملاحظات لم تُحل بالكامل:**
- `scripts/seed-projects.ts` لا يزال ينسخ Chrome Headless Shell من `elmekawy-bim-reel-V2/node_modules/.remotion/...`.
- `TemplateId` في `packages/shared/src/index.ts` محصور في `bim-personal-intro` و`bim-motion-study`، والواجهة `apps/studio/src/main.tsx` تستورد `StudioV1` و`StudioV2` مباشرة.
- إنشاء المشروع في الواجهة ما زال يطلب الاسم والعميل والهدف ونوع القالب، ويفترض `Elmekawy BIM` كعميل افتراضي.
- خانات الوسائط مرتبطة بأدوار ثابتة وبصور؛ لا يوجد نظام عام لرفع/توظيف الفيديو والصوت داخل أي مشهد.
- بيانات المشروع وملفات `.studio` والأرشيفات التاريخية ما زالت ظاهرة في شجرة المستودع؛ `.gitignore` يستثني معظم `.studio` ولكنه يعيد إدراج `jobs` و`releases` و`qa`.
- `apps/studio/src/main.tsx` حجمه ما زال كبيرًا (~21 KB في 59 سطرًا مطولًا)؛ يفضل فصل الواجهات/hooks وتفعيل تنسيق موحد.

### الأدلة المباشرة
- [README الحالي](https://github.com/M-Elmaghawry/Elmekawy-Motion-Studio/blob/main/README.md)
- [Root package.json](https://github.com/M-Elmaghawry/Elmekawy-Motion-Studio/blob/main/package.json)
- [Launcher source](https://github.com/M-Elmaghawry/Elmekawy-Motion-Studio/blob/main/tools/launcher/Program.cs)
- [Launcher PowerShell build](https://github.com/M-Elmaghawry/Elmekawy-Motion-Studio/blob/main/scripts/build-launcher.ps1)
- [Chrome seed](https://github.com/M-Elmaghawry/Elmekawy-Motion-Studio/blob/main/scripts/seed-projects.ts)
- [Main UI](https://github.com/M-Elmaghawry/Elmekawy-Motion-Studio/blob/main/apps/studio/src/main.tsx)
- [Shared template types](https://github.com/M-Elmaghawry/Elmekawy-Motion-Studio/blob/main/packages/shared/src/index.ts)
- [.gitignore](https://github.com/M-Elmaghawry/Elmekawy-Motion-Studio/blob/main/.gitignore)

---

## 3. النتائج التقنية لفيديوهات Motion Lab الـ18

**المصدر:** الملفات المرفوعة `01.mp4` إلى `18.mp4`. دقة كل ملف 576×1024، نسبة 9:16، ومعدل 30 FPS؛ جميعها تحتوي Audio Stream من نوع AAC. اللقطات المستخدمة للمراجعة موزعة بانتظام على كل فيديو وليست Timeline frame-by-frame، وبالتالي التوقيتات أدناه *نقاط مشاهدة تقريبية* وليست قياسات مواضع القطع بدقة الإطار.

| رقم | المدة | النوع الإبداعي الغالب | أنسب عنصر لإعادة الاستخدام |
|---|---:|---|---|
| 01 | 42.2s | Social proof → Q&A → Service Funnel | Stat Counter / FAQ / Chat UI |
| 02 | 37.2s | Orange vs juice visual comparison | Product Compare / Process Transformation |
| 03 | 25.2s | Kinetic words / blue focus dot | Word Reveal / Focus Dot |
| 04 | 17.6s | Conceptual clock / anti-procrastination | Radial Timer / Clock Narrative |
| 05 | 24.5s | Glowing nodes / paths / polarity switch | NodeGraph / Path Trace |
| 06 | 27.3s | Script → Motion UI / scheduling / charts | Script-to-Video UI / Calendar / Charts |
| 07 | 39.5s | Motion service steps, progression/cards | Service Flow / Checklist |
| 08 | 63.7s | Real-estate footage and pricing | Video Showcase / Property Card |
| 09 | 66.8s | Comparative advertising and process | Before/After Compare |
| 10 | 59.2s | Virtual clinic demo inside phone screen | Mobile App Walkthrough |
| 11 | 49.0s | Time capsule / drawers / date / value | Timeline Object / Evidence Card |
| 12 | 39.4s | Service offering via mobile/app/agent cards | UI Workflow / Decision Flow |
| 13 | 33.4s | 1 product, 3 artistic versions | Product Stage / Asset Variants |
| 14 | 119.5s | Production workflow / role-task-assets | Workflow Navigator |
| 15 | 93.5s | Coffee ad production case study / price | Asset → Prompt → Review → Ad |
| 16 | 69.8s | Mobile chat scenario / commercial proof | Chat Simulator / Offer Cards |
| 17 | 60.4s | Content data and reach scale | Data Cards / Counters |
| 18 | 49.0s | Value proposition / service unit economics | ROI Calculator / Price Math |

### 3.1 التحليل التفصيلي للفيديوهات الـ13 التي لم تُحلل بعمق سابقًا

#### 01 — Counter → UI → FAQ → Offer (42.2s)
- ~1.8s: رقم `400,000+` كـHook، عنصر عددي واحد ضخم يسبق الشرح.
- ~5.3–19.3s: ينتقل إلى هاتف/سؤال/خانة UI ومجموعة خيارات، وتبدو القصة وكأنها تفاعل لا سلايد نصي.
- ~22.8–29.8s: قائمة أسئلة، مقارنة تسعير، ثم كارت بيانات مرئي.
- ~36.9–40.4s: بحث/سؤال ثم CTA مرتبط بالمشكلة الأولى.
- **آليات مطلوبة:** `StatCounter`, `QuestionCard`, `InputSimulation`, `FAQStack`, `OfferCompare`, `SearchReveal`.
- **ملاحظة تنفيذية:** لا تُحرك كل البطاقة دفعة واحدة؛ النص الأساسي أولًا، ثم الحدود، ثم الأيقونة، ثم التفاصيل الصغيرة بتأخيرات متعاقبة.

#### 02 — Visual Contrast & Physical Transformation (37.2s)
- ~1.6–7.8s: مقارنة *البرتقال الطبيعي/العصير*، مستخدمًا مجسمًا وصورة كأس وعنوانًا متقابلًا.
- ~10.9s: صورة العصارة تربط السبب بالنتيجة (Process)، وليست حركة زخرفية.
- ~17.1–29.5s: تغير الخلفية إلى الداكنة وظهور الهاتف والبطاقات والخدمات.
- **آليات مطلوبة:** `ProductCompare`, `IngredientAssembly`, `ProcessFlow`, `PaletteSwitch`.
- **ملاحظة:** الاستفادة من الطبقات/الخلفيات الفارغة؛ صور Magnific المنفصلة بدون Text أنسب من صورة نهائية تحمل كل العناصر.

#### 04 — Clock Concept Story (17.6s)
- ~0.7–9.5s: دوران/ظهور عقارب الساعة يرافق نصًا مختصرًا متدرجًا.
- ~11–16.9s: رمز بسيط ثم سؤال/رسالة ختامية.
- **آليات مطلوبة:** `RadialClock`, `TimeProgress`, `ShortHook`, `CircleWipe`.
- **ميزة فنية:** أقل كمية عناصر وأقصر مدة من المجموعة؛ يثبت أن جودة الفكرة أهم من ازدحام التصميم.

#### 05 — Glowing Nodes & Branching Paths (24.5s)
- ~1–9s: نقاط مضيئة متصلة بخطوط مرنة، تتجه إلى بطاقات صغيرة.
- ~11–13.3s: انتقال واضح إلى لوحة بيضاء قبل العودة إلى خلفية داكنة.
- ~15–23.5s: Progress، جهاز موبايل/CTA والشعار.
- **آليات مطلوبة:** `GlowDot`, `SVGPathTracer`, `OrbitConnector`, `ThemeFlash`, `NodeToCard`.
- **ملاحظة:** استخدم SVG stroke-dashoffset وقيم frame-based بدل فيديو تأثير مسبق عندما يكون المسار هندسيًا واضحًا.

#### 06 — Script-to-Video / Scheduling / Charts (27.3s)
- ~1–5.7s: المشكلة تظهر في جملة ثم تتحول إلى أزرار/عناصر واجهة.
- ~10–17s: جملة `نصوص متحركة تشد الانتباه` تتلوها Calendar وBar Chart.
- ~20–26s: شاشة محتوى ثم شاشة CTA وشعار.
- **آليات مطلوبة:** `TextToUI`, `CalendarWidget`, `AnimatedBarChart`, `MiniDashboard`.
- **تحسين:** بيانات الرسم البياني أرقام حقيقية صالحة للتعديل وليس مجرد أعمدة Decorative.

#### 07 — Offering Design as a Guided Process (39.5s)
- ~1.6–8.2s: سؤال يتبعه عرض عناصر طريقة العمل.
- ~11.5–28s: شرح مقفل/مراحل/إعلان الفيديو والملفات والبرومبت.
- ~31.5–37.7s: التسعير وكتابة النص/إضافة الصوت ثم نهاية الترويج.
- **آليات مطلوبة:** `StepNavigator`, `PanelAccordion`, `TierCard`, `ActionCTA`.
- **الدرس:** تجعل كل خطوة في العملية حالة UI منفصلة وتقلل حمل الذاكرة على المشاهد.

#### 08 — Real Estate Ad Built Around Real Footage (63.7s)
- ~13–39s: مقاطع عقارية من الخارج والداخل، مع حركة كاميرا موجودة في المصدر نفسه.
- ~39–45s: بطاقات قيمة العقار ثم رابط/إعلان.
- ~50–61s: دعوة للتواصل وحركة الـCTA.
- **آليات مطلوبة:** `VideoFrame`, `ImageKenBurns`, `PriceBadge`, `PropertyDetails`, `FootageMontage`, `ContactCTA`.
- **الدرس:** لا يمكن استبدال كل مشهد بعناصر SVG؛ محتاجين دعم الفيديو/الصوت/لقطات المشاريع الأصلية من البداية.

#### 10 — Virtual Clinic App Walkthrough (59.2s)
- ~2–12s: مشكلة واضحة وعرض هاتف بمحتوى مبسط.
- ~17–37s: خطوات متوالية على نفس جهاز الهاتف ومحتوى فاتح فوق خلفية داكنة.
- ~41–56s: قائمة محتوى متسلسلة ثم انتقال لشعار/CTA.
- **آليات مطلوبة:** `DeviceFrame`, `ScreenContentTransition`, `FormFlow`, `SelectedTab`, `VerticalSteps`.
- **تنفيذ مهم:** مكونات UI حقيقية داخل Device Mockup قابلة لتحريك حالات الشاشة، بدل تصدير Screenshot مستقل لكل خطوة.

#### 11 — Time Capsule / 3D Narrative (49s)
- ~2–14s: أدراج تاريخية + Money + مؤشرات زمنية بصريًا.
- ~18–34s: ورقة/إيصال/أرشيف ثلاثي الأبعاد وأرقام قيمة تتغير.
- ~38–47s: رسالة تفاعل تستعمل الرقم كعنصر Hook.
- **آليات مطلوبة:** `Chronology`, `DocumentCard`, `CurrencyCounter`, `EvidenceZoom`.
- **حدود التقنية:** عمق الأدراج الواقعي يحتاج تصويرًا/3D/أصولًا جاهزة؛ Remotion مسؤول عن التجميع والتوقيت والتعليق والخطوط، وليس بديلًا تلقائيًا للنمذجة الثلاثية.

#### 12 — Motion Service Flow (39.4s)
- ~1.6s: Typography قوية في منتصف الشاشة.
- ~4.9–24.6s: هاتف وخطوات وصل الخدمة واختيارات ظاهرة.
- ~27.9–37.8s: خدمات فرعية وCTA.
- **آليات مطلوبة:** `CardGrid`, `PersonaCard`, `MessageBubble`, `ApprovalStepper`, `PhoneFlow`.
- **فكرة إعادة الاستخدام:** مشاهد عمليات العملاء لا تتطلب Brand مخصص في JSX، بل Theme Tokens + Text Slots + Icon Set.

#### 15 — Long-Form Campaign Case Study (93.5s)
- ~3.9–19.5s: طرح المشكلة، إعلان مقهى ومقارنة سعره.
- ~27–43s: شرح مراحل إنتاج إعلان لعلامة قهوة، الأصل والنسخ.
- ~50–82s: ترتيب المنتج والمشهد النهائي وVariant Comparison.
- **آليات مطلوبة:** `AssetPlanner`, `PromptCard`, `ProductAdLayout`, `VersionComparison`, `ReviewStatus`, `WorkflowProgress`.
- **فرصة خاصة بمشروعنا:** واجهة الاستوديو تعرض نفس المراحل كـWorkflow حقيقي: Brief → Assets → Prompts (نسخ يدوي) → Review → Motion → Render.

#### 16 — Chat / Commerce Scenario (69.8s)
- ~2.9–26s: هاتف ورسائل Chat، وإرسالات/استجابات وخيارات.
- ~32–50s: إعلان مشروب قهوة ثم مقارنة استخدام سيناريوهات.
- ~55–66.9s: النتيجة التجارية (`1 أول عميل` و`3 HOURS`) وشعار.
- **آليات مطلوبة:** `MessageThread`, `TypingIndicator`, `PhoneScreen`, `OfferCard`, `MetricBadge`.
- **قيد جودة:** تمثيل Chat يجب أن يبدو متسقًا زمنيًا، مع pauses للقراءة ومن غير نصوص غير واضحة في الموبايل.

#### 18 — Offer Economics / ROI Explainer (49s)
- ~2–14s: سؤال قوي، رقم/ضوء ثم تمثيل فكرة العرض.
- ~18–30s: مراحل Prompt/Script/Voice/Export ورسائل سعر الخدمة.
- ~34–42s: مقارنة `200 SAR` × 10 = `2,000`، تربط العمليات بالنشاط التجاري.
- ~47s: CTA نهائي بالهوية.
- **آليات مطلوبة:** `MoneyCounter`, `EquationReveal`, `ProcessStrip`, `ValueStatement`, `CTAReveal`.
- **دقة مهمة:** لا نصمم أرقام عشوائية توحي بنتائج واقعية للعملاء؛ نستخدم أرقام المستخدم أو أمثلة مشروحة بوضوح.

### 3.2 النتائج السابقة للفيديوهات الخمسة (ملخص مدمج)

- **03:** Arabic Kinetic Typography، نقطة تركيز زرقاء، وتدرج النصوص بأسئلة قصيرة.
- **09:** مقارنة Before/After؛ الاستفادة من تغيير السياق المرئي بدل مجرد تغيير العناوين.
- **13:** إعادة توظيف أصل Product واحد بثلاث معالجات إعلانية مختلفة.
- **14:** إبراز خطوات Production Workflow: Role/Task/Assets/Visual Direction/Scenes/Motion/Output.
- **17:** Data-Driven Motion: مضاعفة العناصر، عدادات، لوحات بيانات، ومقارنات تصلح لمحتوى الخدمات.

### 3.3 خلاصة نمط Motion Lab (من العينة لا من ملفات المشروع الأصلية)

1. **Problem → Demonstration → Evidence → CTA:** معظم الفيديوهات تقود من سؤال إلى تمثيل حل، ثم نتيجة.
2. **Visual Semantics:** العناصر ليست رسومات زخرفية؛ الهاتف للعمليات، المقارنة للفارق، الساعة للزمن، الرقم للقيمة.
3. **One Primary Idea Per Beat:** لا تكدس خمس رسائل في شاشة واحدة.
4. **Contrast:** داكن/فاتح، كبير/صغير، نص/منتج، سؤال/جواب.
5. **Progressive Disclosure:** أظهر المعلومات خطوة بخطوة، لا دفعة واحدة.
6. **Persistent Anchors:** FocusDot، هاتف، خط تقدم، شعار، أو بطاقة مرتبطة بين المشاهد.
7. **Motion With Audio:** يجب تصميم الإيقاع لتتطابق الحركة مع Voice-over/Beat Markers؛ هذا **متطلب تصميم** لا توصيف محسوم للمسارات الصوتية المرفوعة.
8. **Re-use of Assets:** لا حاجة إلى صورة جديدة لكل ثانية؛ الأصل الجيد ينتج تكوينات متعددة.
9. **Vertical-First:** كل المواد 576×1024 و30 FPS، والمساحات الآمنة مهمة.
10. **No confirmed source software:** من الصورة النهائية لا يمكن إثبات أنهم استخدموا After Effects أو Blender أو Remotion بالتحديد.

---

## 4. النظام المقترح: Motion Grammar بدل 18 قالبًا

### 4.1 طبقات التأليف

```text
Project Brief
 ├─ Brand Profile (palette, fonts, logo)
 ├─ Story / Script / Voiceover
 ├─ Storyboard (ordered scenes, durations, goals)
 ├─ Asset Manifest (images/video/audio, rights, approvals)
 └─ Output Profile (resolution, fps, codec)
        ↓
Scene Registry + Component Library
 ├─ Kinetic / Comparison / Product / Process / UI / Data / Media / CTA
 ├─ Motion Presets (reveal, zoom, slide, stagger, connector)
 └─ Semantic Transition Links
        ↓
Remotion Composition Engine
        ↓
Live Player → QA → Local Render → Export
```

### 4.2 Scene Registry: أقل قائمة مفيدة

| Scene type | الفكرة | Components | References |
|---|---|---|---|
| `kinetic-title` | Hook وسؤال | WordReveal, TextFocus | 03/04/18 |
| `stat-proof` | رقم رئيسي | Counter, MetricBadge | 01/17/18 |
| `ui-demo` | محاكاة واجهة/تطبيق | Device, Input, Tabs | 06/10/12/16 |
| `product-hero` | عرض منتج | ProductStage, DepthLayers | 02/13/15 |
| `media-showcase` | صور أو فيديو | Clip, Pan, Overlay | 08/15 |
| `before-after` | مقارنة | SplitReveal, Slider | 02/09/13 |
| `process-flow` | مراحل | Stepper, NodeLink | 05/07/14 |
| `data-explainer` | بيانات | Bar, Number, Timeline | 11/17/18 |
| `offer-cta` | سعر / CTA | PriceCard, LogoReveal | 01/16/18 |

### 4.3 أول 15 Motion Components قابلة لإعادة الاستخدام

1. `ArabicWordReveal` (RTL/bi-di aware)
2. `FocusDot` / `GlowPulse`
3. `AnimatedStatCounter`
4. `MobileDeviceFrame`
5. `ChatMessageStack`
6. `UIFormSimulation`
7. `SVGPathTracer`
8. `ProcessStepper`
9. `BeforeAfterSplit`
10. `ProductHeroStage`
11. `VideoFootageFrame`
12. `MetricBarChart`
13. `TimelineEvidenceCard`
14. `PriceEquationReveal`
15. `CTAEndCard`

### 4.4 قواعد Motion Tokens — قيم بدء قابلة للمعايرة

هذه **اقتراحات وليست قياسات مستخرجة من الفيديوهات**:

```text
fps = 30
micro-motion:       6–10 frames
text word reveal:   8–14 frames
card enter:        12–20 frames
scene change:      12–24 frames
readability pause: 0.6–1.5 s حسب كثافة النص
stagger:            2–5 frames
fade/scale:         frame-driven interpolate/spring
```

اجعل كل Motion Preset قابلًا للتعديل من JSON، مع اختيار Accessibility/Reduced Motion عند الحاجة. لا تُثبّت رقمًا واحدًا لكل المشاهد؛ النصوص الصوتية والإيقاع يحددان الاختيار.

### 4.5 نموذج Scene Data مقترح (تصميم أولي)

```json
{
  "schemaVersion": "2.0.0",
  "projectId": "revit-course-promo",
  "template": {"id":"flexible-reel","version":"1.0.0"},
  "video": {"width":1080,"height":1920,"fps":30},
  "brandProfileId": "elmekawy-bim",
  "scenes": [
    {
      "id": "scene-001",
      "type": "kinetic-title",
      "durationFrames": 105,
      "content": {"headline": "اتعلم Revit من مشروع حقيقي"},
      "mediaRefs": [],
      "motion": {"preset":"word-reveal","speed":"normal"},
      "transitionOut": {"type":"focus-dot","durationFrames":15}
    }
  ],
  "audio": {"voiceoverAssetId":null,"musicAssetId":null,"markers":[]}
}
```

**هام:** عرّف هل زمن Transition متداخل مع المشهد التالي أو واقع داخله، واحسب طول الفيديو بحيث لا يحدث Double Count. هذا Schema جديد للقوالب المرنة فقط؛ لا تغيّر الـLegacy Schema/Compositions in place.

---

## 5. تحسين واجهة التطبيق

### 5.1 New Project Wizard

1. Project Basics: الاسم والعميل والهدف والمنصة.
2. Brand: ألوان وهوية وخطوط وشعار من Brand Preset أو Custom.
3. Video Format: 9:16 / 1:1 / 16:9 والمدد المقترحة، وفق إمكانيات القالب.
4. Script + Voiceover: نص عام، تقسيم جمل، مدة تقديرية، اختيار ملفات صوت أو بدون.
5. Storyboard: اختيار Scene Types وترتيبها وتحديد مدتها.
6. Assets: استيراد صور/فيديو/صوت مع ربطها بالمشاهد.
7. Review: تخطيط النهائيات قبل الإنشاء.

### 5.2 Manual AI Prompt Workspace — بدون أي تكامل

- إدخال عربي لاحتياج الصورة ثم **حقل Prompt إنجليزي يكتبه المستخدم أو ChatGPT**؛ التحويل التلقائي بالذكاء الاصطناعي داخل البرنامج **غير متاح حاليًا** ما لم يُربط نموذج لاحقًا بقرار منفصل.
- حقول مرتبطة بالمشهد: subject, lens, camera, lighting, negative space, style, 9:16, background separation, technical accuracy.
- Copy Prompt، open external website **يدويًا**، Download file، Upload into Studio، Review وApprove.
- حفظ Prompt version + asset hash + license/source notes.
- ممنوع API/MCP/browser automation لتوليد الصور.

### 5.3 واجهة التحرير

- Left: قائمة Scenes قابلة للسحب لإعادة الترتيب (في Flexible Template فقط).
- Center: Remotion Player، Safe Area Overlay، Grid Guides.
- Right: Text / Motion / Media / Brand / Timing properties.
- Bottom: Timeline مختصر (مشاهد + Voiceover + Music + Beat Markers).
- QA pane: Missing Asset، Long Arabic Text، RTL، Unlicensed/Unapproved Asset، Frame Duration، Loudness.

---

## 6. ملاحظات نهائية للمستودع وحماية البيانات

1. اجعل الاستوديو ينفذ `STUDIO_DATA_ROOT` مستقلًا عن جذر الكود، بمسارات داخل `%LOCALAPPDATA%` أو مجلد يحدده المستخدم، مع Backup & Export.
2. لا تُنشر ملفات عملاء أو مخرجاتهم أو مفاتيح أو لقطات خاصة على GitHub العام؛ افصل Demo Fixtures عن Real Projects.
3. حافظ على تاريخ أرشيف V1/V2 مع نسخة احتياطية خارجية؛ لا تحذف أرشيفًا قبل اختبار Restore.
4. اجعل Chrome Browser Provisioning مستقلًا، بتثبيت محكوم الإصدار + Integrity Check، لا نسخًا من المشروع القديم.
5. صحح mismatch لأوامر `launcher:build` و`launcher:verify` وتأكد من نجاحهما في Clean Windows.
6. أضف `.github/workflows` للـtypecheck, unit tests, build, schema validation؛ اختبارات التصيير الثقيلة يمكن أن تكون schedule/manual.
7. أضف `format`, `lint`, و`typecheck` scripts. افصل `main.tsx` إلى ProjectList, NewProjectWizard, SceneEditor, AssetPanel, RenderPanel, state hooks.
8. اجعل V1/V2 immutable، وأضف Flexible Template بإصدار جديد بدل تمديد تعريفات Legacy.
9. لا تدعم الفيديو والصوت بسماح رفع MIME فقط؛ يجب فحص محتواهما بـFFprobe، وتحديد Limits، وتحويل صيغة عند الحاجة، والتأكد من تطابق Player/Renderer.
10. أضف Project Backup/Export ZIP + Manifest يضمن إمكان إعادة فتح المشروع في جهاز جديد.
11. أضف Disk Usage / Asset Dedupe + Cleanup غير مُتلف لمراجع الرندرات التاريخية.
12. وثّق Git Commit SHA وRemotion Version وAsset Hashes لكل Render لإعادة الإنتاج.

---

## 7. خطة التنفيذ بعد التحليل (5 مراحل مع بوابات قبول)

| Phase | زمن تقريبي بناءً على نطاق العمل، وليس التزامًا | الأولويات | Gate |
|---|---|---|---|
| A. Reliability | 1–3 جلسات تطوير | Launcher scripts, Browser provisioning plan, backup, CI | V1/V2 unchanged, clean setup passes |
| B. Flexible Engine | 4–8 جلسات | Scene Registry + Timeline Data + 6 Scene Types | New 20s reel from data alone |
| C. Studio UI | 4–8 جلسات | Wizard + Brand + Storyboard + Scene Editor | New client reel without editing TSX |
| D. Media & Audio | 3–6 جلسات | Video/audio uploads, voiceover timeline, image approval | Render with real clip and audio sync |
| E. Production QA | 2–4 جلسات | Accessibility, checkpoints, export/backup, render validation | 3 different reels pass QA |

النطاق كبير؛ لا تنفذ كل المراحل دفعة واحدة. آلية العمل الأفضل **Incremental PRs** بكل مرحلة، مع Smoke Render وتأمين الـBackups.

## 8. اختبار الإنتاج الحقيقي النهائي

ينبغي إعداد ثلاث عينات بأساليب مختلفة لاختبار مرونة النظام:

- **Elmekawy BIM — 20s**: Hook → 3D/BIM Image → Data/Process → CTA، عربي/إنجليزي.
- **Khatwa Designs — 25s**: Product/Image Hero → Before/After → Portfolio → Offer → CTA، هوية مختلفة.
- **Revit Course Promo — 30s**: Problem → Real Revit Footage → 3 Benefits → Instructor → CTA، يتطلب فيديو وصوت وBrand Preset.

تعريف النجاح: كل مشروع ينشأ من الواجهة، لا يحتوي نسخة كود أو `node_modules`، ويوظف الأصول والهوية الخاصة به، ويمكن Preview/Save/Reopen/Render/Export/Restore، مع عدم تغير ناتج V1/V2 المؤرشف.

---

## 9. نقاط لا يمكن الجزم بها حاليًا

- لا يمكن إثبات البرامج الأصلية التي استخدمتها Motion Lab من الفيديوهات النهائية فقط.
- لا توجد مراجعة سمعية كاملة لكل Voiceover والموسيقى والمؤثرات، لذا توصيات Sound Design مستمدة من احتياجات التصميم وليس تحليلًا موضوعيًا لكل تردد أو Beat.
- لا يمكن اعتبار جميع تحليلات Cut Timing دقيقة على مستوى Frame لأن طريقة أخذ العينات كانت متباعدة.
- لا يمكن التحقق من حالة أحدث Commit SHA أو إجراء Git Diff كامل من المراجعة الشبكية الحالية؛ اعتمادنا على المحتوى الحالي للملفات العامة مقارنة بنتائج المراجعة السابقة.
- تشغيل EXE/Windows/Test Suite محليًا يحتاج جهاز Windows أو CI مخصص؛ هذه مراجعة Static Source وليست Runtime Verification.

---

## 10. خلاصة نهائية

**أهم تحسين يجب تنفيذه بعد إصلاح مشكلات الاستقرار:** بناء Flexible Motion Scene Engine يجعل الاستوديو يفهم معنى المشهد (إحصائية، مقارنة، عرض منتج، واجهة، سير عمل، CTA) بدل التعامل مع الفيديو كله باعتباره قالبًا واحدًا ثابتًا. يليه Scene Editor وBrand/Asset Manager ثم Audio Timing. ده يحقق الاستفادة الحقيقية من أسلوب Motion Lab ويجعل النظام قابلًا لإنتاج فيديوهات BIM وإعلانات منتجات وفيديوهات تدريب، دون إعادة البرمجة لكل عميل.
