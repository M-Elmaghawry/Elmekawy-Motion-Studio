import type { SceneRegistry, TemplateManifest, OutputProfile } from './types.ts';

export const portraitProfile: OutputProfile = {
  id: 'portrait-1080p30-h264-v1',
  version: '1.0.0',
  width: 1080,
  height: 1920,
  fps: 30,
  aspectRatio: '9:16',
  container: 'mp4',
  codec: 'h264',
  pixelFormat: 'yuv420p',
  crf: 18,
};
export const sceneRegistry: SceneRegistry = {
  'kinetic-title': {
    type: 'kinetic-title',
    version: '1.0.0',
    contentSchemaId: 'urn:elmekawy:kinetic-title:1.0.0',
    motionPresetIds: ['word-reveal'],
    mediaSlots: [],
  },
  'stat-proof': {
    type: 'stat-proof',
    version: '1.0.0',
    contentSchemaId: 'urn:elmekawy:stat-proof:1.0.0',
    motionPresetIds: ['count-up'],
    mediaSlots: [],
  },
  'media-showcase': {
    type: 'media-showcase',
    version: '1.0.0',
    contentSchemaId: 'urn:elmekawy:media-showcase:1.0.0',
    motionPresetIds: ['pan'],
    mediaSlots: [{ name: 'image', kinds: ['image'], required: true }],
  },
  'process-flow': {
    type: 'process-flow',
    version: '1.0.0',
    contentSchemaId: 'urn:elmekawy:process-flow:1.0.0',
    motionPresetIds: ['step-reveal'],
    mediaSlots: [],
  },
  'offer-cta': {
    type: 'offer-cta',
    version: '1.0.0',
    contentSchemaId: 'urn:elmekawy:offer-cta:1.0.0',
    motionPresetIds: ['cta-reveal'],
    mediaSlots: [],
  },
};
export const flexibleManifest: TemplateManifest = {
  id: 'flexible-reel',
  version: '1.0.0',
  projectSchemaVersion: '2.0.0',
  sceneSchemaVersion: '1.0.0',
  compositionId: 'FlexibleReel',
  supportedSceneTypes: Object.keys(sceneRegistry) as (keyof SceneRegistry)[],
  outputProfiles: [portraitProfile],
  limits: { minScenes: 3, maxScenes: 8, minSeconds: 20, maxSeconds: 45 },
};
export const reservedSceneTypes = [
  'ui-demo',
  'product-hero',
  'before-after',
  'data-explainer',
] as const;
