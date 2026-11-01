import Ajv from 'ajv';
import { projectSchema, semanticErrors } from '../index.ts';
import type { Project } from '../index.ts';
import type { FlexibleProject, ImplementedType } from './types.ts';
import { sceneRegistry, flexibleManifest, portraitProfile } from './manifest.ts';
import { compileTimeline } from './timeline.ts';

const object = (properties: Record<string, unknown>, required = Object.keys(properties)) => ({
  type: 'object',
  additionalProperties: false,
  required,
  properties,
});
const text = (maxLength: number, minLength = 0) => ({ type: 'string', minLength, maxLength });
const number = (minimum: number, maximum: number) => ({ type: 'number', minimum, maximum });
const integer = (minimum: number, maximum: number) => ({ type: 'integer', minimum, maximum });
const id = { type: 'string', pattern: '^[a-z][a-z0-9_-]{0,63}$' };
const sha = { type: 'string', pattern: '^[a-f0-9]{64}$' };
const direction = { enum: ['rtl', 'ltr'] };
const color = { type: 'string', pattern: '^#[a-fA-F0-9]{6}$' };
const stamp = { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$' };
const pathSchema = { type: 'string', maxLength: 250, pattern: '^[a-zA-Z0-9_./-]+\\.[a-zA-Z0-9]+$' };
export const mediaBindingSchema = object({
  slot: { const: 'image' },
  assetId: id,
  assetSha256: sha,
  fit: { enum: ['cover', 'contain'] },
  focalPoint: object({ x: number(0, 1), y: number(0, 1) }),
  frame: object({
    x: number(0, 1),
    y: number(0, 1),
    width: number(0.1, 1.5),
    height: number(0.1, 1.5),
  }),
  transform: object({ scale: number(0.25, 3), offsetX: number(-1, 1), offsetY: number(-1, 1) }),
});
export const sceneContentSchemas = {
  'kinetic-title': object({ headline: text(200, 1), subtitle: text(200) }, ['headline']),
  'stat-proof': object({
    label: text(200, 1),
    value: { type: 'number' },
    prefix: text(30),
    suffix: text(30),
    sourceNote: text(400, 1),
  }),
  'media-showcase': object({ headline: text(200, 1), caption: text(400) }),
  'process-flow': object({
    headline: text(200, 1),
    steps: { type: 'array', minItems: 1, maxItems: 8, items: object({ id, label: text(120, 1) }) },
  }),
  'offer-cta': object(
    { headline: text(200, 1), action: text(120, 1), contact: text(200, 1), offer: text(200) },
    ['headline', 'action', 'contact'],
  ),
} satisfies Record<ImplementedType, unknown>;
const transition = {
  oneOf: [
    object({ type: { const: 'cut' }, durationFrames: { const: 0 } }),
    object({ type: { const: 'crossfade' }, durationFrames: integer(2, 180) }),
  ],
};
export const flexibleProjectSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'urn:elmekawy:flexible-project:2.0.0',
  ...object({
    schemaVersion: { const: '2.0.0' },
    id: { type: 'string', maxLength: 82, pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*--[a-f0-9]{32}$' },
    revision: integer(1, Number.MAX_SAFE_INTEGER),
    createdAt: stamp,
    updatedAt: stamp,
    name: text(120, 1),
    template: object({ id: { const: 'flexible-reel' }, version: { const: '1.0.0' } }),
    brief: object({ client: text(120), objective: text(10000) }),
    locale: object({ language: text(32, 2), direction }),
    brand: object({
      profileId: id,
      version: { const: '1.0.0' },
      displayName: text(120, 1),
      colors: object({
        background: color,
        surface: color,
        foreground: color,
        accent: color,
        muted: color,
      }),
      fonts: object({ arabicAssetId: id, latinAssetId: id }),
      safeArea: object({
        left: integer(100, 400),
        right: integer(180, 400),
        top: integer(220, 600),
        bottom: integer(360, 600),
      }),
    }),
    outputProfile: object(
      Object.fromEntries(
        Object.entries(portraitProfile).map(([key, value]) => [
          key,
          key === 'crf' ? integer(0, 51) : { const: value },
        ]),
      ),
    ),
    targetDurationFrames: integer(600, 1350),
    scenes: {
      type: 'array',
      minItems: 3,
      maxItems: 8,
      items: {
        oneOf: (Object.keys(sceneRegistry) as ImplementedType[]).map((type) =>
          object({
            schemaVersion: { const: '1.0.0' },
            id,
            type: { const: type },
            durationFrames: integer(1, 1530),
            direction,
            content: sceneContentSchemas[type],
            motion: object({
              id: { enum: sceneRegistry[type].motionPresetIds },
              version: { const: '1.0.0' },
              enterFrames: integer(1, 180),
              staggerFrames: integer(0, 60),
              exitFrames: integer(0, 180),
              easing: { enum: ['linear', 'ease-out'] },
              reducedMotion: { type: 'boolean' },
            }),
            transitionOut: transition,
            mediaBindings: {
              type: 'array',
              minItems: type === 'media-showcase' ? 1 : 0,
              maxItems: type === 'media-showcase' ? 1 : 0,
              items: mediaBindingSchema,
            },
          }),
        ),
      },
    },
    assets: {
      type: 'array',
      maxItems: 100,
      items: object({
        id,
        kind: { enum: ['image', 'font'] },
        sha256: sha,
        byteSize: integer(1, 50 * 1024 * 1024),
        mimeType: { enum: ['image/png', 'image/jpeg', 'image/webp', 'font/ttf'] },
        storage: object({ scope: { enum: ['shared', 'project'] }, path: pathSchema }),
        approval: { enum: ['pending', 'approved'] },
        sourceNote: text(1000, 1),
        license: object({ status: { enum: ['unknown', 'documented'] }, note: text(1000) }),
      }),
    },
    audio: object({ mode: { const: 'none' } }),
  }),
};
const ajv = new Ajv({
  allErrors: true,
  strict: true,
  coerceTypes: false,
  useDefaults: false,
  removeAdditional: false,
});
const validate = ajv.compile<FlexibleProject>(flexibleProjectSchema);
const validateLegacy = ajv.compile<Project>(projectSchema);
export class FlexibleValidationError extends Error {
  issues: string[];
  constructor(issues: string[]) {
    super(issues.join('; '));
    this.name = 'FlexibleValidationError';
    this.issues = issues;
  }
}
export function flexibleSemanticErrors(project: FlexibleProject): string[] {
  const issues: string[] = [];
  try {
    if (compileTimeline(project.scenes).durationFrames !== project.targetDurationFrames)
      issues.push('DURATION_MISMATCH');
  } catch (error) {
    issues.push((error as Error).message);
  }
  const assets = new Map(project.assets.map((asset) => [asset.id, asset]));
  if (assets.size !== project.assets.length) issues.push('DUPLICATE_ASSET_ID');
  for (const asset of project.assets) {
    const parts = asset.storage.path.split('/');
    if (
      parts.some(
        (part) =>
          !part ||
          part === '.' ||
          part === '..' ||
          /[. ]$/.test(part) ||
          /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part),
      ) ||
      (asset.storage.scope === 'project' && parts[0] !== 'assets')
    )
      issues.push('UNSAFE_ASSET_PATH:' + asset.id);
    if ((asset.kind === 'font') !== (asset.mimeType === 'font/ttf'))
      issues.push('ASSET_KIND_MISMATCH:' + asset.id);
  }
  for (const key of ['arabicAssetId', 'latinAssetId'] as const)
    if (assets.get(project.brand.fonts[key])?.kind !== 'font') issues.push('INVALID_FONT:' + key);
  for (const scene of project.scenes) {
    for (const [key, value] of Object.entries(scene.content))
      if (
        typeof value === 'string' &&
        !value.trim() &&
        !['prefix', 'suffix', 'subtitle', 'caption', 'offer'].includes(key)
      )
        issues.push('EMPTY_SCENE_TEXT:' + scene.id);
    const count =
      scene.type === 'kinetic-title'
        ? scene.content.headline.trim().split(/\s+/u).length
        : scene.type === 'process-flow'
          ? scene.content.steps.length
          : 1;
    if (
      scene.motion.enterFrames +
        (count - 1) * scene.motion.staggerFrames +
        scene.motion.exitFrames >
      scene.durationFrames
    )
      issues.push('MOTION_EXCEEDS_SCENE:' + scene.id);
    if (
      scene.type === 'process-flow' &&
      new Set(scene.content.steps.map((step) => step.id)).size !== scene.content.steps.length
    )
      issues.push('DUPLICATE_STEP_ID:' + scene.id);
    if (scene.type === 'process-flow' && scene.content.steps.some((step) => !step.label.trim()))
      issues.push('EMPTY_STEP_LABEL:' + scene.id);
    for (const binding of scene.mediaBindings) {
      const asset = assets.get(binding.assetId);
      if (!asset || asset.kind !== 'image' || asset.sha256 !== binding.assetSha256)
        issues.push('INVALID_MEDIA_BINDING:' + scene.id);
    }
  }
  if (!project.name.trim()) issues.push('EMPTY_NAME');
  if (
    [project.createdAt, project.updatedAt].some(
      (stamp) => !Number.isFinite(Date.parse(stamp)) || new Date(stamp).toISOString() !== stamp,
    ) ||
    project.updatedAt < project.createdAt
  )
    issues.push('INVALID_TIMESTAMPS');
  try {
    new Intl.NumberFormat(project.locale.language);
  } catch {
    issues.push('INVALID_LOCALE');
  }
  return issues;
}
export function parseFlexibleProject(value: unknown): FlexibleProject {
  if (!validate(value))
    throw new FlexibleValidationError(
      (validate.errors ?? []).map((error) => error.instancePath + ':' + error.keyword),
    );
  const issues = flexibleSemanticErrors(value);
  if (issues.length) throw new FlexibleValidationError(issues);
  return structuredClone(value);
}
export function renderReadinessErrors(project: FlexibleProject): string[] {
  const required = new Set([
    project.brand.fonts.arabicAssetId,
    project.brand.fonts.latinAssetId,
    ...project.scenes.flatMap((scene) => scene.mediaBindings.map((binding) => binding.assetId)),
  ]);
  return [...required].flatMap((id) => {
    const asset = project.assets.find((asset) => asset.id === id);
    if (!asset) return ['MISSING_ASSET:' + id];
    return asset.approval !== 'approved' ? ['UNAPPROVED_ASSET:' + id] : [];
  });
}
export function parseProjectDocument(value: unknown): Project | FlexibleProject {
  if (typeof value !== 'object' || value === null)
    throw new FlexibleValidationError(['INVALID_DOCUMENT']);
  const version = (value as { schemaVersion?: unknown }).schemaVersion;
  if (version === flexibleManifest.projectSchemaVersion) return parseFlexibleProject(value);
  if (version !== '1.0.0') throw new FlexibleValidationError(['UNSUPPORTED_SCHEMA_VERSION']);
  if (!validateLegacy(value)) throw new FlexibleValidationError(['INVALID_LEGACY_PROJECT']);
  const issues = semanticErrors(value);
  if (issues.length) throw new FlexibleValidationError(issues);
  return structuredClone(value);
}
