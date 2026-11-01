import fs from 'node:fs';
const file='package.json',pkg=JSON.parse(fs.readFileSync(file,'utf8'));
pkg.scripts['verify:scenes']='node scripts/verify-flexible-scenes.ts';pkg.scripts['schemas:phase4']='node scripts/write-phase4-schemas.ts';
for(const key of ['format','format:check'])pkg.scripts[key]+=' scripts/verify-flexible-scenes.ts scripts/write-phase4-schemas.ts packages/shared/schemas/v1.2 packages/shared/schemas/v2.1 apps/server/package.json';
fs.writeFileSync(file,JSON.stringify(pkg,null,2)+'\n');
