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
export type ExtendedContentByType = ContentByType & {
  'ui-demo': { headline: string; appName: string; caption: string; actions: string[] };
  'product-hero': { headline: string; tagline: string; badge: string };
  'before-after': { headline: string; beforeLabel: string; afterLabel: string };
  'data-explainer': { headline: string; unit: string; points: { id: string; label: string; value: number }[] };
};
export type SupportedSceneType = keyof ExtendedContentByType;
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
  slot: 'image' | 'before' | 'after';
  assetId: string;
  assetSha256: string;
  fit: 'cover' | 'contain';
  focalPoint: { x: number; y: number };
  frame: { x: number; y: number; width: number; height: number };
  transform: { scale: number; offsetX: number; offsetY: number };
  trimStartFrame?: number;
};
export type SceneData<K extends SupportedSceneType = SupportedSceneType> = {
  schemaVersion: '1.0.0';
  id: string;
  type: K;
  durationFrames: number;
  direction: 'rtl' | 'ltr';
  content: ExtendedContentByType[K];
  motion: MotionPreset;
  transitionOut: TransitionSpec;
  mediaBindings: MediaBinding[];
};
export type FlexibleScene = { [K in SupportedSceneType]: SceneData<K> }[SupportedSceneType];
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
  version: '1.0.0' | '1.1.0';
  projectSchemaVersion: '2.0.0' | '2.1.0';
  sceneSchemaVersion: '1.0.0';
  compositionId: 'FlexibleReel';
  supportedSceneTypes: SupportedSceneType[];
  outputProfiles: OutputProfile[];
  limits: { minScenes: number; maxScenes: number; minSeconds: number; maxSeconds: number };
};
export type FlexibleAsset = {
  id: string;
  kind: 'image' | 'font' | 'video' | 'audio';
  sha256: string;
  byteSize: number;
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp' | 'font/ttf' | 'video/mp4' | 'audio/mpeg' | 'audio/wav' | 'audio/mp4';
  storage: { scope: 'shared' | 'project'; path: string };
  approval: 'pending' | 'approved';
  sourceNote: string;
  license: { status: 'unknown' | 'documented'; note: string };
  metadata?: { durationSeconds: number; width: number; height: number; hasAudio: boolean; codec: string };
};
export type AudioTrack = { id: string; assetId: string; assetSha256: string; role: 'voiceover' | 'music'; startFrame: number; trimStartFrame: number; durationFrames: number; volume: number; fadeInFrames: number; fadeOutFrames: number };
export type PauseMarker = { id: string; startFrame: number; durationFrames: number; label: string };
export type AudioTimeline = { mode: 'timeline'; tracks: AudioTrack[]; beats: number[]; pauses: PauseMarker[] };
export type PromptWorkspaceRecord = { id: string; sceneId: string; text: string; negativeConstraints: string; source: string; status: 'draft' | 'ready-to-copy' | 'uploaded' | 'approved'; assetId: string | null };
export type FlexibleProject = {
  schemaVersion: '2.0.0' | '2.1.0';
  id: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  name: string;
  template: { id: 'flexible-reel'; version: '1.0.0' | '1.1.0' };
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
  audio: { mode: 'none' } | AudioTimeline;
  prompts?: PromptWorkspaceRecord[];
};
export type FlexibleRuntimeProps = {
  project: FlexibleProject;
  media: Record<string, string>;
  preview?: boolean;
};
