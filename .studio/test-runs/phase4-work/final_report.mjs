import fs from 'node:fs';
const file='docs/PHASE_4_IMPLEMENTATION.md';let text=fs.readFileSync(file,'utf8');
const previous='40/40 passed in the complete suite; the two later focused recovery/replacement regressions are included in the 8/8 Phase 4 result below';
if(!text.includes(previous))throw Error('Expected verification summary was not found');
text=text.replace(previous,'42/42 passed in the final complete suite, including cross-version restoration and immutable legacy image replacement');
text=text.replace('## Rollback','The production desktop launcher was restarted after confirming zero active render jobs. Closing its owner closed the private control pipe and the old server shut down gracefully. The replacement server at `http://127.0.0.1:4311` reports schema `2.1.0`, nine scene types and three output profiles. Restart evidence: `.studio/test-runs/phase4-work/live-restart.json`. No production project, shared asset, historical original or archive file appears in the source diff.\n\n## Rollback');
fs.writeFileSync(file,text);
