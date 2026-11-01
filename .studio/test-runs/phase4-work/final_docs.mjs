import fs from 'node:fs';
let file='README.md',t=fs.readFileSync(file,'utf8');
t=t.replace(/^\*\*الحالة الفعلية[^\r\n]+/m,'**الحالة الفعلية — 1 نوفمبر 2026:** يدعم التطبيق المشاهد المرنة التسعة، والفيديو والصوت وتايملاين التعليق والموسيقى والبرومبتات اليدوية والمقاسات الثلاثة ونسخ ZIP واسترجاع الإصدارات. تحكم صور V1/V2 متاح في نسخة مستقلة بالقالب `1.2.0` مع الحفاظ على النسخ القديمة. تفاصيل التنفيذ والتحقق في [PHASE_4_IMPLEMENTATION.md](docs/PHASE_4_IMPLEMENTATION.md).');
t=t.replace('# تحديث 2026-11-01:','## تحديث 2026-11-01:');fs.writeFileSync(file,t.trimEnd()+'\n');
file='docs/PHASE_4_IMPLEMENTATION.md';t=fs.readFileSync(file,'utf8');
t=t.replace('Final command results and artifact paths are recorded after the complete verification pass below.',`Verified on Windows x64 with Node 24.19.0:

| Command/check | Actual result |
| --- | --- |
| \`npm.cmd test\` | 40/40 passed in the complete suite; the two later focused recovery/replacement regressions are included in the 8/8 Phase 4 result below |
| \`npm.cmd run test:phase4\` | 8/8 passed, including real media decoding, archive roundtrips, cross-version recovery and a 900-frame audiovisual export |
| \`npm.cmd run build\` | Passed, including TypeScript |
| \`npm.cmd run lint\` | Passed in the declared incremental JavaScript scope |
| \`npm.cmd run format:check\` | Passed in the explicit scope; frozen templates excluded |
| \`npm.cmd run verify:editor\` | 6/6 actual-browser checks passed, including 20s Elmekawy, 25s Khatwa and a decoded 20s export |
| \`npm.cmd run verify:phase4-ui\` | 7/7 browser workflows passed, including legacy size/position/zoom and a fully decoded 30s audiovisual export |
| \`npm.cmd run verify:scenes\` | 27/27 stills passed the text safety gate: nine scene types in three ratios |
| \`npm.cmd run verify:render-smoke\` | 36/36 exact legacy pixel comparisons, two scene-local transform/isolation checks and both 30-frame H.264/audio smoke clips passed |
| \`npm.cmd run verify:legacy\` | All 20,244 protected original files match the backup |
| \`npm.cmd run launcher:verify\` | 5/5 passed against the real EXE |
| \`npm.cmd run render:flexible\` | Original schema-2.0 JSON sample passed boundary/seek/transform/overflow checks and a complete 600-frame silent export |
| \`npm.cmd run render:flexible -- <schema-2.1 project.json>\` | Passed boundary/seek checks and a fully decoded 900-frame audiovisual export; CLI supports the same validated video/audio and range serving |
| Protected active source inventory | 50/50 pre-existing template/motion-component files retain identical SHA-256 hashes |

Successful evidence is retained under \`.studio/test-runs/\`:

- UI: \`phase4-ui-d315668c-5184-4f88-bf5b-4f883556469a/report.json\`, with the legacy controls screenshot and 30-second output location.
- Earlier editor workflow: \`editor-ui-1ed8471d-e721-4f0c-b87c-88892353102f/report.json\`.
- Nine-scene matrix: \`scene-matrix-94f85724-73ca-4cc1-94c4-fa21adf6fa66/report.json\` and 27 PNGs.
- Legacy parity/image isolation: \`render-smoke-e4cf105c-b6c3-472a-b7ae-f012b5e1b005/report.json\`.
- JSON-only 30s video/audio: \`flexible-17225989-e0c1-46aa-aaaa-dce068f7527b/report.json\` and \`flexible-reel-30s.mp4\`.
- Original 20s JSON: \`flexible-4bca94d3-7681-4381-93fa-7d6dacd90afb/report.json\`.

Build warnings remain for runtime font URLs, Remotion's module-level directive and bundle size. Optional missing V2 comparison-image URLs still log 404s when reading the old bundle; the captured baseline pixels match. The browser-independent clean-install proposal remains a separate design gate; the working historical browser fallback is retained. The course test uses local fixture video/audio to verify the workflow, not authored Revit lesson footage.`);
fs.writeFileSync(file,t);
