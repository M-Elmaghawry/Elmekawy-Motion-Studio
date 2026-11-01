export type SceneType =
  | 'kinetic-title'
  | 'stat-proof'
  | 'ui-demo'
  | 'product-hero'
  | 'media-showcase'
  | 'before-after'
  | 'process-flow'
  | 'data-explainer'
  | 'offer-cta';
export type ContentByType = {
  'kinetic-title': { headline: string; subtitle?: string };
  'stat-proof': {
    label: string;
    value: number;
    prefix: string;
    suffix: string;
    sourceNote: string;
  };
  'media-showcase': { headline: string; caption: string };
  'process-flow': { headline: string; steps: { id: string; label: string }[] };
  'offer-cta': { headline: string; action: string; contact: string; offer?: string };
};
export type ImplementedType = keyof ContentByType;
export type MotionPreset = {
  id: 'word-reveal' | 'count-up' | 'pan' | 'step-reveal' | 'cta-reveal';
  version: '1.0.0';
  enterFrames: number;
  staggerFrames: number;
  exitFrames: number;
  easing: 'linear' | 'ease-out';
  reducedMotion: boolean;
};
export type TransitionSpec =
  | { type: 'cut'; durationFrames: 0 }
  | { type: 'crossfade'; durationFrames: number };
export type MediaBinding = {
  slot: 'image';
  assetId: string;
  assetSha256: string;
  fit: 'cover' | 'contain';
  focalPoint: { x: number; y: number };
  frame: { x: number; y: number; width: number; height: number };
  transform: { scale: number; offsetX: number; offsetY: number };
};
export type SceneData<K extends ImplementedType = ImplementedType> = {
  schemaVersion: '1.0.0';
  id: string;
  type: K;
  durationFrames: number;
  direction: 'rtl' | 'ltr';
  content: ContentByType[K];
  motion: MotionPreset;
  transitionOut: TransitionSpec;
  mediaBindings: MediaBinding[];
};
export type FlexibleScene = { [K in ImplementedType]: SceneData<K> }[ImplementedType];
export type OutputProfile = {
  id: string;
  version: string;
  width: number;
  height: number;
  fps: 24 | 25 | 30 | 50 | 60;
  aspectRatio: '9:16' | '1:1' | '16:9';
  container: 'mp4';
  codec: 'h264';
  pixelFormat: 'yuv420p';
  crf: number;
};
export type SceneRegistry = {
  [K in ImplementedType]: {
    type: K;
    version: '1.0.0';
    contentSchemaId: string;
    motionPresetIds: MotionPreset['id'][];
    mediaSlots: { name: 'image'; kinds: ['image']; required: boolean }[];
  };
};
export type TemplateManifest = {
  id: 'flexible-reel';
  version: '1.0.0';
  projectSchemaVersion: '2.0.0';
  sceneSchemaVersion: '1.0.0';
  compositionId: 'FlexibleReel';
  supportedSceneTypes: ImplementedType[];
  outputProfiles: OutputProfile[];
  limits: { minScenes: number; maxScenes: number; minSeconds: number; maxSeconds: number };
};
export type FlexibleAsset = {
  id: string;
  kind: 'image' | 'font';
  sha256: string;
  byteSize: number;
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp' | 'font/ttf';
  storage: { scope: 'shared' | 'project'; path: string };
  approval: 'pending' | 'approved';
  sourceNote: string;
  license: { status: 'unknown' | 'documented'; note: string };
};
export type FlexibleProject = {
  schemaVersion: '2.0.0';
  id: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  name: string;
  template: { id: 'flexible-reel'; version: '1.0.0' };
  brief: { client: string; objective: string };
  locale: { language: string; direction: 'rtl' | 'ltr' };
  brand: {
    profileId: string;
    version: string;
    displayName: string;
    colors: {
      background: string;
      surface: string;
      foreground: string;
      accent: string;
      muted: string;
    };
    fonts: { arabicAssetId: string; latinAssetId: string };
    safeArea: { left: number; right: number; top: number; bottom: number };
  };
  outputProfile: OutputProfile;
  targetDurationFrames: number;
  scenes: FlexibleScene[];
  assets: FlexibleAsset[];
  audio: { mode: 'none' };
};
export type FlexibleRuntimeProps = {
  project: FlexibleProject;
  media: Record<string, string>;
  preview?: boolean;
};
