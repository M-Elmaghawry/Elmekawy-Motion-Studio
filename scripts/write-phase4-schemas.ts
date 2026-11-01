import fs from 'node:fs/promises';
import { projectSchema } from '@elmekawy/shared';
import { flexibleProjectSchema, flexibleManifest, sceneRegistry } from '@elmekawy/shared/flexible';
const legacy = structuredClone(projectSchema);
const template = legacy.properties.template as { properties: { version: unknown } };
template.properties.version = { const: '1.2.0' };
legacy.required.push('imageLayouts');
legacy.$id = 'urn:elmekawy:project:template-1.2.0';
for (const [folder, file, value] of [
  ['packages/shared/schemas/v1.2', 'project.schema.json', legacy],
  ['packages/shared/schemas/v2.1', 'flexible-project.schema.json', flexibleProjectSchema],
  [
    'packages/templates/src/flexible-reel/1.1.0',
    'template.json',
    { ...flexibleManifest, sceneRegistry },
  ],
] as const) {
  await fs.mkdir(folder, { recursive: true });
  await fs.writeFile(folder + '/' + file, JSON.stringify(value, null, 2) + '\n');
}
