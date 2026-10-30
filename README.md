# Elmekawy Motion Studio

> **Master README — الإصدار 1.0**  
> **التاريخ:** 30 أكتوبر 2026  
> **الحالة:** مرحلة التخطيط والتنفيذ الأولي (MVP)  
> **أول مشروع:** Elmekawy BIM Personal Brand Reel

## 1. تعريف المشروع

**Elmekawy Motion Studio** نظام إنتاج فيديوهات Motion Graphics قصيرة بطريقة **Hybrid** تجمع الذكاء الاصطناعي لتخطيط المحتوى وكتابة السيناريو والـPrompts، مع **Remotion + React + TypeScript** لبناء المشاهد وتحريكها وتصديرها محليًا، و**GSAP** عند الحاجة إلى حركات متقدمة.

يبدأ المشروع بإنتاج فيديوهات شخصية للعلامة **Elmekawy BIM**، ثم اختبار تقديم الخدمة للعملاء عبر **Khatwa Designs** إذا أثبتت التجربة جودة وتكلفة وزمن إنتاج مناسبين. **لا نبني SaaS أو لوحة تحكم كبيرة في المرحلة الأولى.**

### قرار نهائي بشأن منصة الصور

لدى صاحب المشروع اشتراك سنوي في منصة توليد الصور التي يسميها **Magnific**. استخدام المنصة **يدوي 100%**: يكتب المساعد Prompt، ينسخه المستخدم إلى الموقع، يولّد الصورة، ينزّلها، ويضعها في مجلد المشروع. **لا API، ولا MCP، ولا أي ربط أو أتمتة مع موقع الصور.** لا نفترض إمكانيات أو حقوق ترخيص لم يتم التحقق منها في الباقة الحالية.

## 2. الرؤية والأهداف

- إنتاج Reels وShorts وإعلانات Motion Graphics ذات هوية بصرية ثابتة.
- استخدام الصور المُولّدة يدويًا ومواد Revit/BIM الحقيقية المرخّصة.
- فصل النصوص والوسائط عن كود الحركة، بحيث يمكن تبديلها بسرعة.
- بناء مكتبة قوالب مشاهد وحركات قابلة لإعادة الاستخدام.
- قياس الوقت والتكلفة والـCredits المستخدمة قبل تسعير الخدمة للعملاء.
- التوسع تدريجيًا إلى فيديوهات تعليمية وتسويقية للشركات والمكاتب الهندسية.

### الجمهور والاستخدامات

**شخصيًا:** فيديو تعريفي، إعلانات دورات Revit/BIM، محتوى هندسي تعليمي، شرح Clash Detection وQTO وBIM Automation، وإعلانات الورش والخدمات.

**تجاريًا لاحقًا:** إعلانات منتجات، Company Profiles متحركة، فيديوهات تعريف خدمات، عروض شركات مقاولات ومكاتب هندسية، محتوى Social Media لعملاء Khatwa Designs.

**منصات النشر:** Instagram Reels، TikTok، YouTube Shorts، Facebook، LinkedIn.

## 3. القرارات التقنية المعتمدة

| المحور | القرار |
|---|---|
| نهج العمل | Hybrid AI + Programmatic Motion Graphics |
| بيئة التطوير | Windows + VS Code + Codex |
| محرك الفيديو | Remotion |
| الواجهة والمكونات | React + TypeScript |
| التحريك | Remotion interpolate/spring؛ GSAP اختياري ومربوط بالإطارات |
| معالجة الوسائط | أدوات Remotion وFFmpeg عند الحاجة |
| بيانات المحتوى | JSON / TypeScript objects |
| الصور | Prompts من AI، توليد يدوي في موقع الاشتراك، تنزيل وإضافة محلية |
| تكامل منصة الصور | **لا يوجد، وغير مطلوب** |
| التصيير | محلي على الجهاز |
| الصوت | اختياري، مع مراعاة حقوق الاستخدام |
| نظام إدارة ويب / SaaS | خارج نطاق MVP |
| أول Reel | Elmekawy BIM Personal Intro |
| اللغة | عربية + مصطلحات إنجليزية، مع دعم توسع إنجليزي |

## 4. خط الإنتاج (End-to-End Workflow)

```text
Creative Brief
  ↓
AI Creative Director
  → Script + Hook + CTA + Storyboard + Scene Breakdown
  ↓
Asset Planner
  → قائمة الصور والشعارات والفيديوهات والصوت المطلوبة
  ↓
AI Image Prompt Writer
  → Prompt + Negative Constraints + Style + Aspect Ratio
  ↓
MANUAL GENERATION (Magnific / subscribed image website)
  → Copy Prompt → Generate → Download image
  ↓
Asset Review / Approval
  → Rename → Save locally → Record prompt and license
  ↓
Remotion + React + TypeScript
  → Scenes + Timeline + Motion + Typography
  ↓
Preview / QA
  → Arabic RTL + Safe Areas + Timing + Visual Quality
  ↓
Local Render → MP4 H.264
  ↓
Publish / Client Delivery + Production Log
```

### Creative Brief المطلوب لكل فيديو

اسم الفيديو، الهدف، الجمهور، المنصة، المدة، اللغة، الرسالة الرئيسية، Hook، CTA، الأسلوب البصري، الألوان، المواد المتاحة، المراجع، والقيود.

### مخرجات AI Creative Director

1. سكربت نهائي ومراجعة لغوية.
2. Storyboard مقسّم إلى مشاهد.
3. توقيت كل مشهد، النصوص، الحركة، الانتقال.
4. قائمة الأصول المطلوبة مع `asset_id`.
5. Prompts منفصلة لكل صورة خارجية.
6. ملاحظات الجودة والحقوق والواقعية الفنية.

### وحدة AI Asset Prompt Generator

يكتب المستخدم بالعربية: «محتاج صورة مشروع بنية تحتية فيه طرق وكباري وشبكات، شكل BIM، ألوان زرقاء، ومساحة فاضية للنص». يحول المساعد الوصف إلى Prompt إنجليزي جاهز للنسخ، يتضمن:

- Subject / Environment / Composition / Camera Angle.
- Lighting / Style / Color Palette.
- Aspect Ratio، ومساحة للنصوص المتحركة.
- Depth Layers مناسبة لـParallax.
- Negative Constraints: لا Watermark، لا نصوص مشوهة، لا شعارات مخترعة.
- ملاحظات الهندسة الواقعية والملكية.
- اسم ملف مقترح، و`asset_id`، والمشهد الذي سيستخدمه.

**مهم:** التوليد والتقييم والتنزيل يقوم بها المستخدم يدويًا. الصور الهندسية التوليدية توضيحية ولا تُقدّم باعتبارها نموذجًا هندسيًا معتمدًا أو مشروعًا منفذًا.

## 5. الهوية البصرية

| العنصر | القيمة |
|---|---|
| Navy | `#003060` |
| Blue | `#055C9D` |
| Blue Grotto | `#0E86D4` |
| Baby Blue | `#68BBE3` |
| الخط العربي | Cairo |
| الخط الإنجليزي | Inter |
| النمط | Premium Dark Tech / BIM Visualization |
| الحركات | Kinetic Typography، Camera Push، Parallax، Mask Reveal، Subtle Glow |

نتجنب المؤثرات الزائدة، التكدس البصري، الانتقالات الرخيصة، النصوص الصغيرة، والخطوط العربية غير السليمة.

## 6. MVP 01 — أول فيديو Elmekawy BIM

**الاسم:** BIM & Revit — Personal Brand Intro  
**Composition ID:** `ElmekawyBIMIntro`  
**المدة:** 30 ثانية  
**الأبعاد:** 1080 × 1920، 9:16  
**الإطارات:** 30 FPS، الإجمالي 900 Frame  
**الإخراج:** MP4 / H.264  
**اللغة:** العربية مع مصطلحات إنجليزية.

### Storyboard

| المشهد | التوقيت | النص/الهدف | الحركة |
|---|---|---|---|
| 1. Hook | 00–04 | «الـ BIM مش مجرد موديل 3D» | Kinetic Typography + Light Trails |
| 2. BIM | 04–09 | STRUCTURAL & INFRASTRUCTURE BIM | Camera Push + Parallax |
| 3. Services | 09–15 | Modeling / Coordination / QTO / Automation | Animated Cards |
| 4. Training | 15–21 | REVIT & BIM TRAINING / Autodesk Certified Instructor | Text Reveal |
| 5. Profile | 21–26 | Mahmoud Elmekawy — BIM Engineer & Instructor | Portrait + Name Reveal |
| 6. CTA | 26–30 | Learn • Build • Coordinate | Logo + Website Reveal |

رابط CTA المبدئي: `https://m-elmaghawry.github.io/ME-2026-EN/`.

### الأصول المطلوبة

| Asset ID | الملف | المصدر | الاستخدام |
|---|---|---|---|
| `asset-infra-01` | `bim-infrastructure.png` | توليد يدوي | مشهد BIM |
| `asset-struct-01` | `structural-bim.png` | توليد يدوي | الخدمات |
| `asset-tech-01` | `bim-technology.png` | توليد يدوي | خلفيات تقنية |
| `asset-profile-01` | `profile.png` | صورة حقيقية | التعريف الشخصي |
| `asset-logo-01` | شعار Elmekawy BIM | أصل معتمد | النهاية |
| `asset-audio-01` | صوت أو موسيقى | مصدر مرخّص، اختياري | الفيديو |

إذا لم تتوفر صورة شخصية أو شعار، يظهر Placeholder واضح في المعاينة، ولا يُدّعى أن الأصل موجود.

## 7. Prompts الصور لأول Reel

### Prompt 01 — BIM Infrastructure

```text
Create a premium cinematic vertical visualization of a complex
infrastructure BIM digital twin. A modern highway interchange
with bridges, road networks, drainage infrastructure and
underground utility networks, modeled with realistic engineering
geometry. Blend realistic construction materials with luminous
cyan BIM wireframe overlays. Dark navy background, elegant blue
volumetric lighting, strong central composition, layered depth
suitable for parallax motion, realistic perspective, highly
detailed. 9:16 vertical composition. No text, labels, watermark,
logos, humans or distorted geometry.
```

احفظ الصورة: `public/assets/generated/bim-infrastructure.png`.

### Prompt 02 — Structural BIM

```text
Create a high-end vertical 3D structural BIM visualization of a
multi-story modern building. Clearly visible reinforced concrete
columns, beams, slabs, foundations and structural connections,
presented as a professional engineering coordination model.
Blend realistic architectural geometry with subtle blue
holographic structural wireframe layers. Cinematic camera angle
from slightly below, dark navy environment, cyan and electric
blue accents, clean precise geometry. Leave negative space for
animated titles. 9:16 portrait composition. No text, logos,
watermark or impossible structural elements.
```

احفظ الصورة: `public/assets/generated/structural-bim.png`.

### Prompt 03 — BIM Technology

```text
Design a premium futuristic BIM technology background for a
vertical professional motion graphics video. Abstract
architectural data grids, subtle construction model fragments,
layered holographic engineering interfaces, floating transparent
panels, cyan luminous connection lines and elegant depth.
Sophisticated dark navy and blue palette: #003060, #055C9D,
#0E86D4, #68BBE3. Clean modern corporate aesthetic, controlled
cinematic lighting, negative space in the center for motion
typography, visually balanced, detailed yet uncluttered.
9:16 portrait. No readable text, numbers, brand marks or watermark.
```

احفظ الصورة: `public/assets/generated/bim-technology.png`.

### قالب Prompt عام

```text
Create a high-quality [ASSET TYPE] for a professional
[MOTION VIDEO CATEGORY].
Subject: [SUBJECT]. Environment: [SETTING].
Visual direction: [STYLE]. Camera: [ANGLE/FRAMING].
Lighting: [LIGHTING]. Brand palette: [COLORS].
Composition: [ASPECT RATIO], negative space at [POSITION]
for animated typography. Provide layered depth for parallax.
Technical accuracy constraints: [REQUIREMENTS].
Avoid: text, watermarks, invented logos, distorted geometry,
and unsupported details.
```

## 8. هيكل المجلدات المستهدف

```text
Elmekawy-Motion-Studio/
└── elmekawy-bim-reel/
    ├── public/
    │   └── assets/
    │       ├── generated/
    │       │   ├── bim-infrastructure.png
    │       │   ├── structural-bim.png
    │       │   └── bim-technology.png
    │       ├── projects/
    │       ├── personal/
    │       │   └── profile.png
    │       ├── logos/
    │       ├── audio/
    │       └── fonts/
    ├── src/
    │   ├── compositions/PersonalIntro.tsx
    │   ├── scenes/
    │   │   ├── HookScene.tsx
    │   │   ├── BIMScene.tsx
    │   │   ├── ServicesScene.tsx
    │   │   ├── TrainingScene.tsx
    │   │   ├── ProfileScene.tsx
    │   │   └── CTAScene.tsx
    │   ├── components/
    │   │   ├── AnimatedText.tsx
    │   │   ├── GlowBackground.tsx
    │   │   └── SceneTransition.tsx
    │   ├── motion/
    │   │   ├── presets.ts
    │   │   └── easing.ts
    │   ├── data/personal-intro.json
    │   ├── theme/brand.ts
    │   ├── Root.tsx
    │   └── index.ts
    ├── prompts/
    │   ├── creative-director.md
    │   ├── scene-generator.md
    │   └── image-assets.md
    ├── docs/
    │   ├── asset-manifest.md
    │   ├── production-log.md
    │   └── decisions.md
    ├── tests/
    ├── out/
    ├── package.json
    └── README.md
```

هذا **تصميم مقترح**، وليس تأكيدًا أن الملفات أُنشئت بالفعل. تُراجع بنية القالب الحقيقي قبل أي تعديل.

## 9. التشغيل من مجلد فارغ على Windows

### تثبيت المتطلبات

- [VS Code](https://code.visualstudio.com/)
- [Node.js LTS](https://nodejs.org/)
- [Git](https://git-scm.com/downloads)
- Codex extension الرسمية في VS Code (للمساعدة البرمجية).

افتح Terminal داخل VS Code ونفذ:

```powershell
node -v
npm -v
git --version
```

أنشئ مجلدًا مثل `D:\Projects\Elmekawy-Motion-Studio` وافتحه في VS Code. ثم:

```powershell
npx create-video@latest
```

اختر قالب **Blank** واسم `elmekawy-bim-reel` حسب أسئلة أداة الإنشاء، ثم:

```powershell
cd elmekawy-bim-reel
npm install gsap
npx remotion add @remotion/gsap
npm run dev
```

راجع `package.json` إن اختلف اسم أمر التشغيل في القالب. ويمكن تجربة `npx remotion skills add` إذا كان مدعومًا في الإصدار الحالي.

### معاينة وتصدير

بعد تسجيل Composition باسم `ElmekawyBIMIntro`، شغّل Remotion Studio وراجع المشاهد، ثم:

```powershell
npx remotion render ElmekawyBIMIntro out/elmekawy-bim-intro.mp4
```

**لا نعتبر التصدير ناجحًا إلا بعد التحقق من وجود MP4 وتشغيله فعليًا.**

## 10. مبادئ البرمجة

1. فصل المحتوى (`data`) عن المكونات (`components`) وعن الحركة (`motion`).
2. Remotion هو مصدر الحقيقة للتوقيت: `frame` و`fps`.
3. نفضّل `useCurrentFrame` و`interpolate` و`spring`.
4. GSAP اختياري، ويجب ربط تقدمه بـ`frame/fps`، لا تشغيل Timeline مستقل بالوقت الحقيقي.
5. تجنب `setInterval` و`requestAnimationFrame` والعشوائية غير المضبوطة أثناء التصيير.
6. دعم RTL للعربية وLTR للإنجليزية، خصوصًا الجمل المختلطة.
7. الالتزام بـSafe Margins لمنصات الفيديو القصير.
8. تحميل الخطوط والتحقق منها قبل التصيير.
9. معالجة الأصول المفقودة بـPlaceholders في المعاينة، ومنع تسليمها بالخطأ.
10. عدم إضافة API أو أي أتمتة لمنصة توليد الصور.

### نموذج Scene Data

```json
{
  "projectId": "elmekawy-bim-reel-001",
  "compositionId": "ElmekawyBIMIntro",
  "fps": 30,
  "width": 1080,
  "height": 1920,
  "durationInFrames": 900,
  "scenes": [
    {
      "id": "hook",
      "startFrame": 0,
      "durationFrames": 120,
      "headline": "الـ BIM مش مجرد موديل 3D",
      "assetId": null,
      "motionPreset": "kinetic-reveal"
    },
    {
      "id": "infrastructure",
      "startFrame": 120,
      "durationFrames": 150,
      "headline": "STRUCTURAL & INFRASTRUCTURE BIM",
      "assetId": "asset-infra-01",
      "motionPreset": "camera-push"
    }
  ]
}
```

المثال جزئي، ويجب إكمال جميع المشاهد حتى مجموع 900 إطار.

### نموذج Asset Manifest

```json
{
  "assetId": "asset-infra-01",
  "filename": "bim-infrastructure.png",
  "source": "manual-image-generation",
  "generatorModel": "record-after-generation",
  "promptFile": "prompts/image-assets.md",
  "approved": false,
  "licenseReviewed": false,
  "sceneIds": ["infrastructure"]
}
```

## 11. خطة تنفيذ أول 8 أيام (تقديرية)

| اليوم | المهمة | المخرج |
|---|---|---|
| 1 | تثبيت الأدوات وإنشاء Remotion | Studio يعمل |
| 2 | الهوية وهيكل المجلدات والأصول | Asset Library |
| 3 | كتابة Prompts وتوليد 3 صور يدويًا | صور معتمدة |
| 4 | بناء المشاهد الستة | Composition أولية |
| 5 | ضبط الحركة والانتقالات | Preview محسّن |
| 6 | فصل المحتوى في JSON وقوالب | Reusable Scenes |
| 7 | اختبار وتصدير | MP4 أولي |
| 8 | مراجعة نهائية وتوثيق | MVP + Production Log |

المدة تقديرية، وليست التزامًا زمنيًا. تتغير حسب خبرة التنفيذ وعدد التعديلات.

## 12. ضمان الجودة (QA)

### المحتوى والهوية
- [ ] النصوص صحيحة وواضحة، والـCTA مناسب.
- [ ] جميع الادعاءات المهنية دقيقة.
- [ ] الصور التوليدية لا تُعرض كأنها مشاريع حقيقية منفذة.
- [ ] ألوان وخطوط العلامة موحدة.

### الحركة والوسائط
- [ ] جميع الصور موجودة ومعتمدة.
- [ ] لا توجد إطارات سوداء غير مقصودة.
- [ ] لا يوجد قص أو تمدد مشوه للصور.
- [ ] الحركة متسقة في Preview وRender.
- [ ] التوقيت متوازن ولا توجد انتقالات مزعجة.

### العربية والتصدير
- [ ] الحروف العربية متصلة والاتجاه RTL صحيح.
- [ ] النصوص الإنجليزية المختلطة تظهر بالترتيب السليم.
- [ ] النصوص داخل Safe Areas.
- [ ] 1080×1920، 30 FPS، 30 ثانية، MP4 H.264.
- [ ] الصوت متزامن ومرخص إن وجد.
- [ ] تم تشغيل الملف النهائي على الهاتف والكمبيوتر.

## 13. إدارة التكلفة والتراخيص

الاستراتيجية: **Local-first + Existing Subscriptions**. نعتمد على الأدوات الحالية ونقلل الخدمات المدفوعة الجديدة. تكلفة التشغيل ليست صفرًا بالضرورة: وقت العمل، الكهرباء، Credits، والتراخيص التجارية عناصر يجب قياسها.

طُرحت نطاقات تخطيطية أولية 0–20، و20–60، و60+ دولار شهريًا بحسب الأدوات الإضافية، **لكنها ليست أسعارًا مؤكدة أو ميزانية معتمدة**. لا نسعّر الخدمة التجارية قبل قياس إنتاج 3–5 فيديوهات.

يجب مراجعة الترخيص التجاري لـRemotion وGSAP والخطوط والأصول والصوت وشروط منصة الصور عند تقديم خدمة مدفوعة. ولا تُرفع ملفات عملاء أو رسومات هندسية سرية إلى خدمات AI دون موافقة صريحة.

### Production Log لكل فيديو

- اسم المشروع وتاريخ الإنتاج.
- وقت السيناريو والتخطيط.
- عدد الصور المولدة والمحاولات.
- وقت البرمجة والتعديلات.
- زمن التصيير.
- Credits والخدمات المدفوعة.
- عدد جولات المراجعة.
- الملاحظات والدروس المستفادة.

## 14. المخاطر وطرق المعالجة

| الخطر | المعالجة |
|---|---|
| أخطاء هندسية في الصور المولدة | مراجعة فنية، أو استخدام نموذج Revit حقيقي مرخص |
| اختلاف المعاينة عن التصدير | Frame-driven animation |
| أخطاء الخط العربي | اختبار Cairo والـRTL قبل الإخراج |
| استهلاك Credits | تخطيط الصور أولًا وتقليل المحاولات |
| مشاكل حقوق الملكية | توثيق مصدر كل أصل ومراجعة شروطه |
| تسريب بيانات العملاء | عدم رفع مواد سرية دون تصريح |
| فقدان الملفات | Git + نسخ احتياطية |
| تضخم نطاق المشروع | MVP أولًا، واجهة إدارة لاحقًا |
| تغيّر إصدار أداة أو ترخيص | تثبيت الإصدارات ومراجعة الوثائق الرسمية |

## 15. خارطة التوسع المستقبلية

### Phase 0 — Setup
بيئة عمل محلية، مشروع Remotion، README، أول مكتبة أصول.

### Phase 1 — MVP 01
فيديو Elmekawy BIM من 6 مشاهد، 30 ثانية، تصدير MP4.

### Phase 2 — Repeatable Production
3–5 فيديوهات مختلفة، Presets للحركات، Scene Templates، JSON-driven content، Asset Manifest، مكتبة Prompts.

### Phase 3 — Client Pilot
تقديم نماذج فعلية للعملاء عبر Khatwa Designs، Briefs موحدة، موافقات Storyboard، باقات وتسعير مبني على بيانات إنتاج حقيقية.

### Phase 4 — Local Studio Interface (اختياري)
واجهة محلية لإدارة الـBriefs والـScenes والـAssets وتوليد Prompts وعرض حالة كل صورة ومعاينة الفيديو. **حتى في هذه المرحلة، توليد الصور يظل يدويًا دون API أو ربط.**

### Phase 5 — Advanced Production (اختياري)
- نسخ متعددة 9:16 و16:9 و1:1.
- ترجمة وتوطين المحتوى عربي/إنجليزي.
- Voice-over وSubtitles.
- دمج مقاطع AI Video تم توليدها وتنزيلها يدويًا.
- مكتبة قوالب أوسع ومراجعات العملاء.
- Batch Rendering محلي مع مراجعة التراخيص.
- دراسة SaaS أو Cloud Rendering منفصلة **فقط إذا أثبت الطلب جدواه**؛ ليست جزءًا معتمدًا من الخطة الحالية.

## 16. مشاريع الفيديو المقترحة بعد MVP

1. Elmekawy BIM Personal Intro.
2. Revit Structural Course Promo.
3. BIM Coordination & Clash Detection Explainer.
4. From CAD to BIM.
5. Khatwa Designs Services Promo.
6. Engineering Project Showcase بموافقة استخدام الصور.
7. ISO 19650 Mini Explainer.

## 17. قواعد العمل مع Codex

1. اقرأ `README.md` وافحص `package.json` والملفات الموجودة قبل التعديل.
2. اعرض خطة تنفيذ قصيرة وابدأ بخطوة صغيرة.
3. لا تضف أي تكامل مع منصة توليد الصور.
4. لا تختلق صورًا شخصية أو شهادات أو شعارات أو مشاريع.
5. لا تكسر الملفات الموجودة ولا تعِد هيكلة المشروع بلا داعٍ.
6. افصل البيانات عن المكونات.
7. نفّذ الاختبارات والـPreview والـRender عند الإمكان.
8. لا تدّعِ نجاح الإخراج قبل التحقق من الملف.
9. سجّل القرارات والأخطاء في `docs/production-log.md`.

### Prompt تأسيسي لـCodex

```text
You are the senior Remotion engineer and motion designer for
Elmekawy Motion Studio.

Read README.md and inspect the repository before coding.
Build MVP 01: composition ElmekawyBIMIntro, 30 seconds,
1080x1920, 30 FPS, six scenes, Arabic/English, dark navy/cyan.

Use React, TypeScript, Remotion, deterministic frame-driven
animation, and GSAP only when appropriate.
Keep content in editable data files and scenes reusable.

Images are generated manually by the user on an external website
and saved in public/assets/generated/.
Do NOT implement image-generation APIs, MCP, browser automation,
or external service integrations.

First summarize current project state and the next small step.
Implement incrementally, verify results, and report errors.
```

## 18. سجل القرارات (Decision Log)

| ID | القرار | الحالة |
|---|---|---|
| D-001 | Hybrid AI + Remotion | معتمد |
| D-002 | توليد الصور يدويًا باستخدام الاشتراك الحالي | معتمد |
| D-003 | لا API ولا تكامل مع منصة الصور | معتمد |
| D-004 | MVP محلي وليس SaaS | معتمد |
| D-005 | أول Reel هو Elmekawy BIM | معتمد |
| D-006 | هوية Navy/Blue/Cyan | معتمد |
| D-007 | مشاهد وبيانات قابلة لإعادة الاستخدام | معتمد |
| D-008 | التوسع التجاري بعد تجربة وقياس | معتمد |

عند أي تعديل مهم، أضف في `docs/decisions.md`: التاريخ، القرار، السبب، البدائل، تأثير التكلفة، والحالة.

## 19. Definition of Done — متى يعتبر MVP مكتملًا؟

- [ ] مشروع Remotion يعمل محليًا.
- [ ] Composition مسجلة ومعاينتها تعمل.
- [ ] جميع المشاهد الستة موجودة.
- [ ] الأصول معتمدة وموثقة.
- [ ] النصوص العربية والإنجليزية سليمة.
- [ ] الحركة ثابتة بين المعاينة والتصدير.
- [ ] ملف MP4 نهائي يعمل.
- [ ] README وProduction Log محدثان.
- [ ] تكلفة ووقت الإنتاج مسجلان.
- [ ] قائمة تحسينات للفيديو التالي.

## 20. الحالة الحالية والخطوة التالية

**المتفق عليه:** الفكرة، الاستخدامات، أول Reel، الـStoryboard، التقنيات، الألوان، الهيكل، المسار اليدوي للصور، وقواعد التوسع.

**غير متحقق منه حتى الآن:** تثبيت البرامج على جهاز المستخدم، إنشاء الملفات فعليًا، توليد الصور، تنفيذ المشاهد، أو تصدير MP4. لا تُعتبر هذه الخطوات منجزة دون تأكيد أو فحص.

**الخطوة التالية:** إنشاء المجلد والمشروع على Windows، تشغيل Remotion Studio، ثم توليد الصور الثلاث يدويًا وإضافتها إلى المشروع.

## 21. المصادر والوثائق الرسمية

- [Remotion Documentation](https://www.remotion.dev/docs)
- [Remotion Licensing](https://www.remotion.dev/license)
- [GSAP Documentation](https://gsap.com/docs/v3/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Node.js](https://nodejs.org/)
- [VS Code](https://code.visualstudio.com/)
- [Git](https://git-scm.com/)
- [FFmpeg](https://ffmpeg.org/)

---

**مبدأ التوثيق:** هذا الملف هو المرجع الأساسي للمشروع. حدّثه عند تغيير النطاق أو الأدوات أو القرارات، واحتفظ بسجل منفصل لكل تجربة إنتاج.
