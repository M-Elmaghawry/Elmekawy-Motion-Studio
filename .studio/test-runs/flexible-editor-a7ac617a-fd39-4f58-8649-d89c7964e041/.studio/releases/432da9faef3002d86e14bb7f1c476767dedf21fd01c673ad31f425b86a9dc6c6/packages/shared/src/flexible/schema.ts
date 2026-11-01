import Ajv from 'ajv';
import * as v2 from './schema-v2.ts';
import { sceneRegistry, outputProfiles } from './manifest.ts';
import type { FlexibleProject, SupportedSceneType } from './types.ts';
export { FlexibleValidationError, mediaBindingSchema } from './schema-v2.ts';
const object = (properties: Record<string, unknown>, required = Object.keys(properties)) => ({ type: 'object', additionalProperties: false, required, properties });
const str = (maxLength: number, minLength = 0) => ({ type: 'string', maxLength, minLength });
const num = (minimum: number, maximum: number) => ({ type: 'number', minimum, maximum });
const int = (minimum: number, maximum = 5400) => ({ type: 'integer', minimum, maximum });
const id = { type: 'string', pattern: '^[a-z][a-z0-9_-]{0,63}$' };
const sha = { type: 'string', pattern: '^[a-f0-9]{64}$' };
const props = (value: unknown) => (value as { properties: Record<string, unknown> }).properties;
const old = v2.flexibleProjectSchema.properties;
export const sceneContentSchemas = {
  ...v2.sceneContentSchemas,
  'ui-demo': object({ headline: str(200, 1), appName: str(100, 1), caption: str(400), actions: { type: 'array', minItems: 1, maxItems: 5, items: str(100, 1) } }),
  'product-hero': object({ headline: str(200, 1), tagline: str(200), badge: str(100) }),
  'before-after': object({ headline: str(200, 1), beforeLabel: str(100, 1), afterLabel: str(100, 1) }),
  'data-explainer': object({ headline: str(200, 1), unit: str(30), points: { type: 'array', minItems: 1, maxItems: 6, items: object({ id, label: str(80, 1), value: num(0, 1e12) }) } }),
};
export const audioTimelineSchema = object({
  mode: { const: 'timeline' },
  tracks: { type: 'array', maxItems: 24, items: object({ id, assetId: id, assetSha256: sha, role: { enum: ['voiceover', 'music'] }, startFrame: int(0, 1349), trimStartFrame: int(0), durationFrames: int(1, 1350), volume: num(0, 1), fadeInFrames: int(0, 300), fadeOutFrames: int(0, 300) }) },
  beats: { type: 'array', maxItems: 500, uniqueItems: true, items: int(0, 1349) },
  pauses: { type: 'array', maxItems: 100, items: object({ id, startFrame: int(0, 1349), durationFrames: int(1, 1350), label: str(120, 1) }) },
});
export const promptsSchema = { type: 'array', maxItems: 100, items: object({ id, sceneId: id, text: str(20000), negativeConstraints: str(5000), source: str(1000), status: { enum: ['draft', 'ready-to-copy', 'uploaded', 'approved'] }, assetId: { anyOf: [id, { type: 'null' }] } }) };
const binding = object({ ...v2.mediaBindingSchema.properties, slot: { enum: ['image', 'before', 'after'] }, trimStartFrame: int(0) }, [...v2.mediaBindingSchema.required]);
const oldAsset = props((old.assets as { items: unknown }).items);
const oldBrand = props(old.brand);
export const flexibleProjectSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#', $id: 'urn:elmekawy:flexible-project:2.1.0',
  ...object({ ...old,
    schemaVersion: { const: '2.1.0' }, template: object({ id: { const: 'flexible-reel' }, version: { const: '1.1.0' } }),
    brand: object({ ...oldBrand, safeArea: object({ left: int(0, 500), right: int(0, 500), top: int(0, 600), bottom: int(0, 600) }) }),
    outputProfile: { oneOf: outputProfiles.map(profile => object(Object.fromEntries(Object.entries(profile).map(([key, value]) => [key, key === 'crf' ? int(0, 51) : { const: value }])))) },
    scenes: { type: 'array', minItems: 3, maxItems: 8, items: { oneOf: (Object.keys(sceneRegistry) as SupportedSceneType[]).map(type => object({
      schemaVersion: { const: '1.0.0' }, id, type: { const: type }, durationFrames: int(1, 1530), direction: { enum: ['rtl', 'ltr'] }, content: sceneContentSchemas[type],
      motion: object({ id: { enum: sceneRegistry[type].motionPresetIds }, version: { const: '1.0.0' }, enterFrames: int(1, 180), staggerFrames: int(0, 60), exitFrames: int(0, 180), easing: { enum: ['linear', 'ease-out'] }, reducedMotion: { type: 'boolean' } }),
      transitionOut: { oneOf: [object({ type: { const: 'cut' }, durationFrames: { const: 0 } }), object({ type: { const: 'crossfade' }, durationFrames: int(2, 180) })] },
      mediaBindings: { type: 'array', minItems: sceneRegistry[type].mediaSlots.length, maxItems: sceneRegistry[type].mediaSlots.length, items: binding },
    })) } },
    assets: { type: 'array', maxItems: 100, items: object({ ...oldAsset, kind: { enum: ['image', 'font', 'video', 'audio'] }, byteSize: int(1, 250 * 1024 ** 2), mimeType: { enum: ['image/png', 'image/jpeg', 'image/webp', 'font/ttf', 'video/mp4', 'audio/mpeg', 'audio/mp4', 'audio/wav'] }, metadata: object({ durationSeconds: num(0.01, 180), width: int(0, 3840), height: int(0, 3840), hasAudio: { type: 'boolean' }, codec: str(40, 1) }) }, [...Object.keys(oldAsset)]) },
    audio: { oneOf: [object({ mode: { const: 'none' } }), audioTimelineSchema] }, prompts: promptsSchema,
  }),
};
const validate = new Ajv({ allErrors: true, strict: true, coerceTypes: false, useDefaults: false, removeAdditional: false }).compile<FlexibleProject>(flexibleProjectSchema);
export function flexibleSemanticErrors(project: FlexibleProject): string[] {
  if (project.schemaVersion === '2.0.0') return v2.flexibleSemanticErrors(project);
  const issues = v2.flexibleSemanticErrors(project).filter(issue => !issue.startsWith('INVALID_MEDIA_BINDING:'));
  const assets = new Map(project.assets.map(asset => [asset.id, asset]));
  const mime: Record<string, string[]> = { image: ['image/png', 'image/jpeg', 'image/webp'], font: ['font/ttf'], video: ['video/mp4'], audio: ['audio/wav', 'audio/mpeg', 'audio/mp4'] };
  for (const asset of project.assets) {
    if (!mime[asset.kind]?.includes(asset.mimeType)) issues.push('ASSET_KIND_MISMATCH:' + asset.id);
    if (['video', 'audio'].includes(asset.kind) && (!asset.metadata || (asset.kind === 'audio' && !asset.metadata.hasAudio))) issues.push('MISSING_MEDIA_METADATA:' + asset.id);
    if (['image', 'font'].includes(asset.kind) && asset.byteSize > 50 * 1024 ** 2) issues.push('ASSET_TOO_LARGE:' + asset.id);
  }
  const safe = project.brand.safeArea, output = project.outputProfile;
  if (output.width - safe.left - safe.right < 400 || output.height - safe.top - safe.bottom < 400) issues.push('SAFE_AREA_TOO_SMALL');
  for (const scene of project.scenes) {
    const slots = sceneRegistry[scene.type].mediaSlots;
    for (const [index, binding] of scene.mediaBindings.entries()) {
      const asset = assets.get(binding.assetId), allowed = scene.type === 'media-showcase' ? ['image', 'video'] : ['image'];
      if (!asset || !allowed.includes(asset.kind) || asset.sha256 !== binding.assetSha256 || binding.slot !== slots[index]?.name) issues.push('INVALID_MEDIA_BINDING:' + scene.id);
      if (asset?.kind === 'video' && ((binding.trimStartFrame ?? 0) + scene.durationFrames > Math.floor((asset.metadata?.durationSeconds ?? 0) * output.fps) + 1)) issues.push('VIDEO_TOO_SHORT:' + scene.id);
      if (asset?.kind !== 'video' && binding.trimStartFrame) issues.push('INVALID_MEDIA_TRIM:' + scene.id);
    }
    if (scene.type === 'data-explainer' && new Set(scene.content.points.map(point => point.id)).size !== scene.content.points.length) issues.push('DUPLICATE_POINT_ID:' + scene.id);
  }
  const prompts = project.prompts ?? [];
  if (new Set(prompts.map(prompt => prompt.id)).size !== prompts.length) issues.push('DUPLICATE_PROMPT_ID');
  for (const prompt of prompts) {
    if (!project.scenes.some(scene => scene.id === prompt.sceneId)) issues.push('INVALID_PROMPT_SCENE:' + prompt.id);
    const asset = prompt.assetId ? assets.get(prompt.assetId) : undefined;
    if (prompt.assetId && (!asset || !['image','video'].includes(asset.kind))) issues.push('INVALID_PROMPT_ASSET:' + prompt.id);
    if (['uploaded','approved'].includes(prompt.status) && !asset) issues.push('PROMPT_REQUIRES_ASSET:' + prompt.id);
    if (prompt.status === 'approved' && asset?.approval !== 'approved') issues.push('PROMPT_ASSET_UNAPPROVED:' + prompt.id);
  }
  if (project.audio.mode === 'timeline') {
    const { tracks, beats, pauses } = project.audio;
    if (new Set(tracks.map(track => track.id)).size !== tracks.length || new Set(pauses.map(pause => pause.id)).size !== pauses.length) issues.push('DUPLICATE_AUDIO_ID');
    for (const track of tracks) {
      const asset = assets.get(track.assetId);
      if (!asset || !['audio','video'].includes(asset.kind) || !asset.metadata?.hasAudio || asset.sha256 !== track.assetSha256) issues.push('INVALID_AUDIO_ASSET:' + track.id);
      if (track.startFrame + track.durationFrames > project.targetDurationFrames || track.trimStartFrame + track.durationFrames > Math.floor((asset?.metadata?.durationSeconds ?? 0) * output.fps) + 1 || track.fadeInFrames + track.fadeOutFrames > track.durationFrames) issues.push('INVALID_AUDIO_TIMING:' + track.id);
    }
    for (const beat of beats) if (beat >= project.targetDurationFrames) issues.push('BEAT_OUT_OF_RANGE');
    for (const pause of pauses) {
      if (pause.startFrame + pause.durationFrames > project.targetDurationFrames) issues.push('PAUSE_OUT_OF_RANGE:' + pause.id);
      if (tracks.some(track => track.volume > 0 && track.startFrame < pause.startFrame + pause.durationFrames && track.startFrame + track.durationFrames > pause.startFrame)) issues.push('AUDIO_OVERLAPS_SILENCE:' + pause.id);
    }
  }
  return [...new Set(issues)];
}
export function parseFlexibleProject(value: unknown): FlexibleProject {
  if ((value as FlexibleProject)?.schemaVersion === '2.0.0') return v2.parseFlexibleProject(value);
  if (!validate(value)) throw new v2.FlexibleValidationError((validate.errors ?? []).map(error => error.instancePath + ':' + error.keyword));
  const issues = flexibleSemanticErrors(value);
  if (issues.length) throw new v2.FlexibleValidationError(issues);
  return structuredClone(value);
}
export function renderReadinessErrors(project: FlexibleProject): string[] {
  const issues = v2.renderReadinessErrors(project);
  if (project.audio.mode === 'timeline') for (const track of project.audio.tracks) if (project.assets.find(asset => asset.id === track.assetId)?.approval !== 'approved') issues.push('UNAPPROVED_ASSET:' + track.assetId);
  return [...new Set(issues)];
}
export function parseProjectDocument(value: unknown) {
  if ((value as FlexibleProject)?.schemaVersion === '2.1.0') return parseFlexibleProject(value);
  return v2.parseProjectDocument(value);
}
export function projectWarnings(project: FlexibleProject): string[] {
  const warnings: string[] = [];
  if (renderReadinessErrors(project).length) warnings.push('وسائط مستخدمة تحتاج مراجعة واعتماد قبل التصدير.');
  if (project.audio.mode === 'timeline') {
    const covered = new Uint8Array(project.targetDurationFrames);
    for (const track of project.audio.tracks) if (track.volume > 0) covered.fill(1, track.startFrame, track.startFrame + track.durationFrames);
    for (const pause of project.audio.pauses) covered.fill(1, pause.startFrame, pause.startFrame + pause.durationFrames);
    let gap = 0;
    for (const frame of covered) { gap = frame ? 0 : gap + 1; if (gap >= project.outputProfile.fps) { warnings.push('يوجد صمت غير معلَّم لمدة ثانية أو أكثر. أضف صوتًا أو علامة صمت مقصودة.'); break; } }
  }
  return warnings;
}
